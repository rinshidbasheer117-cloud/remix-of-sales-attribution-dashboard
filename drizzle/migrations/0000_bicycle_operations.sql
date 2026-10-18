CREATE TYPE public.app_role AS ENUM ('admin','operations','employee');
CREATE TABLE public.employees (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, job_title text NOT NULL, commission_eligible boolean NOT NULL DEFAULT true, active boolean NOT NULL DEFAULT true);
GRANT SELECT ON public.employees TO authenticated; GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '', employee_id uuid UNIQUE REFERENCES public.employees(id));
GRANT SELECT ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;
CREATE FUNCTION public.is_operator() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'operations') $$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role), public.is_operator() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role), public.is_operator() TO authenticated,service_role;
CREATE POLICY employee_directory ON public.employees FOR SELECT TO authenticated USING(public.is_operator() OR id=(SELECT employee_id FROM public.profiles WHERE id=auth.uid()));
CREATE POLICY own_profile ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.bikes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku text NOT NULL, brand text NOT NULL, model text NOT NULL, serial_number text NOT NULL DEFAULT '', purchase_date date NOT NULL, purchase_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK(purchase_cost>=0), refurb_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK(refurb_cost>=0), status text NOT NULL DEFAULT 'service' CHECK(status IN ('service','inspection','listing','available','sold')), procured_by uuid NOT NULL REFERENCES public.employees(id), sourcing_assistant uuid REFERENCES public.employees(id), serviced_by uuid REFERENCES public.employees(id), inspected_by uuid REFERENCES public.employees(id), service_date date, inspection_date date, listing_date date, intake_photo text, listing_photo text, listing_url text NOT NULL DEFAULT '', asking_price numeric(12,2) CHECK(asking_price>=0), sold_date date, sale_price numeric(12,2) CHECK(sale_price>=0), sold_by uuid REFERENCES public.employees(id), appointment_by uuid REFERENCES public.employees(id), notes text NOT NULL DEFAULT '', created_by uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX bike_sku_unique ON public.bikes(lower(trim(sku)));
GRANT SELECT ON public.bikes TO authenticated; GRANT ALL ON public.bikes TO service_role;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
CREATE POLICY operations_stock ON public.bikes FOR SELECT TO authenticated USING(public.is_operator());
CREATE TABLE public.bike_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bike_id uuid NOT NULL REFERENCES public.bikes(id), stage text NOT NULL, actor_id uuid NOT NULL, happened_on date NOT NULL, detail text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.bike_events TO authenticated; GRANT ALL ON public.bike_events TO service_role;
ALTER TABLE public.bike_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY operations_events ON public.bike_events FOR SELECT TO authenticated USING(public.is_operator());
CREATE TABLE public.commissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bike_id uuid NOT NULL REFERENCES public.bikes(id), employee_id uuid NOT NULL REFERENCES public.employees(id), allocation_role text NOT NULL, amount numeric(12,2) NOT NULL CHECK(amount>=0), profit numeric(12,2) NOT NULL, stock_days integer NOT NULL, zone text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.commissions TO authenticated; GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY operations_ledger ON public.commissions FOR SELECT TO authenticated USING(public.is_operator());
CREATE TABLE public.employee_pins (employee_id uuid PRIMARY KEY REFERENCES public.employees(id), pin_hash text NOT NULL, failed_attempts integer NOT NULL DEFAULT 0, locked_until timestamptz);
GRANT ALL ON public.employee_pins TO service_role; ALTER TABLE public.employee_pins ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.portal_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL, employee_id uuid NOT NULL REFERENCES public.employees(id), expires_at timestamptz NOT NULL);
GRANT ALL ON public.portal_sessions TO service_role; ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.bike_validate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF trim(NEW.sku)='' OR trim(NEW.model)='' OR trim(NEW.brand)='' THEN RAISE EXCEPTION 'SKU, brand and model are required'; END IF;
IF lower(NEW.model || ' ' || NEW.brand) ~ '(e-bike|ebike|e bike|electric)' THEN RAISE EXCEPTION 'Electric bikes are not supported'; END IF;
IF NEW.purchase_date > (now() AT TIME ZONE 'Asia/Dubai')::date THEN RAISE EXCEPTION 'Purchase date cannot be in the future'; END IF;
IF TG_OP='UPDATE' AND OLD.status='sold' THEN RAISE EXCEPTION 'Sold bike records are locked'; END IF;
IF NEW.service_date IS NOT NULL AND (NEW.service_date<NEW.purchase_date OR NEW.service_date>(now() AT TIME ZONE 'Asia/Dubai')::date) THEN RAISE EXCEPTION 'Invalid service date'; END IF;
IF NEW.inspection_date IS NOT NULL AND (NEW.service_date IS NULL OR NEW.inspection_date<NEW.service_date OR NEW.inspection_date>(now() AT TIME ZONE 'Asia/Dubai')::date) THEN RAISE EXCEPTION 'Invalid inspection date'; END IF;
IF NEW.listing_date IS NOT NULL AND (NEW.inspection_date IS NULL OR NEW.listing_date<NEW.inspection_date OR NEW.listing_date>(now() AT TIME ZONE 'Asia/Dubai')::date) THEN RAISE EXCEPTION 'Invalid listing date'; END IF;
IF NEW.sold_date IS NOT NULL AND (NEW.listing_date IS NULL OR NEW.sold_date<NEW.listing_date OR NEW.sold_date>(now() AT TIME ZONE 'Asia/Dubai')::date) THEN RAISE EXCEPTION 'Invalid sale date'; END IF;
NEW.sku:=trim(NEW.sku); NEW.updated_at:=now(); RETURN NEW; END $$;
CREATE TRIGGER validate_bike BEFORE INSERT OR UPDATE ON public.bikes FOR EACH ROW EXECUTE FUNCTION public.bike_validate();
CREATE FUNCTION public.intake_bike(payload jsonb, historical boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE bid uuid; BEGIN
IF NOT public.is_operator() THEN RAISE EXCEPTION 'Access denied'; END IF;
IF NOT historical AND nullif(payload->>'intake_photo','') IS NULL THEN RAISE EXCEPTION 'Intake photo required'; END IF;
IF EXISTS(SELECT 1 FROM public.employees WHERE id=(payload->>'procured_by')::uuid AND NOT active) THEN RAISE EXCEPTION 'Employee is inactive'; END IF;
INSERT INTO public.bikes(sku,brand,model,serial_number,purchase_date,purchase_cost,procured_by,sourcing_assistant,intake_photo,notes,created_by) VALUES(payload->>'sku',payload->>'brand',payload->>'model',coalesce(payload->>'serial_number',''),(payload->>'purchase_date')::date,(payload->>'purchase_cost')::numeric,(payload->>'procured_by')::uuid,nullif(payload->>'sourcing_assistant','')::uuid,nullif(payload->>'intake_photo',''),coalesce(payload->>'notes',''),auth.uid()) RETURNING id INTO bid;
INSERT INTO public.bike_events(bike_id,stage,actor_id,happened_on,detail) VALUES(bid,'service',auth.uid(),(payload->>'purchase_date')::date,CASE WHEN historical THEN 'Imported intake record' ELSE 'Bike received' END); RETURN bid; END $$;
CREATE FUNCTION public.advance_bike(bike uuid, expected_status text, payload jsonb, historical boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE b public.bikes; target text; effective_date date; profit_value numeric; days integer; sales_rate numeric; procurement_rate numeric; zone_name text; pool_ids uuid[]; eid uuid; cents integer; idx integer:=0; BEGIN
IF NOT public.is_operator() THEN RAISE EXCEPTION 'Access denied'; END IF;
SELECT * INTO b FROM public.bikes WHERE id=bike FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Bike not found'; END IF;
IF b.status<>expected_status THEN RAISE EXCEPTION 'Bike stage changed. Refresh and try again'; END IF;
effective_date:=(payload->>'date')::date;
IF effective_date IS NULL THEN RAISE EXCEPTION 'Completion date required'; END IF;
IF b.status='service' THEN
IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=(payload->>'employee')::uuid AND active AND job_title IN ('Head Mechanic','Lead Mechanic','Mechanic')) THEN RAISE EXCEPTION 'Select a mechanic'; END IF;
target:='inspection'; UPDATE public.bikes SET status=target,service_date=effective_date,serviced_by=(payload->>'employee')::uuid,refurb_cost=(payload->>'cost')::numeric WHERE id=bike;
ELSIF b.status='inspection' THEN
IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=(payload->>'employee')::uuid AND active AND job_title='Head Mechanic') THEN RAISE EXCEPTION 'Head mechanic inspection required'; END IF;
target:='listing'; UPDATE public.bikes SET status=target,inspection_date=effective_date,inspected_by=(payload->>'employee')::uuid WHERE id=bike;
ELSIF b.status='listing' THEN
IF NOT historical AND nullif(payload->>'photo','') IS NULL THEN RAISE EXCEPTION 'Showroom photo required'; END IF;
target:='available'; UPDATE public.bikes SET status=target,listing_date=effective_date,listing_photo=nullif(payload->>'photo',''),listing_url=coalesce(payload->>'url',''),asking_price=(payload->>'price')::numeric WHERE id=bike;
ELSIF b.status='available' THEN
IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=(payload->>'employee')::uuid AND active AND commission_eligible) THEN RAISE EXCEPTION 'Select an eligible closer'; END IF;
IF nullif(payload->>'appointment','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.employees WHERE id=(payload->>'appointment')::uuid AND active AND commission_eligible) THEN RAISE EXCEPTION 'Invalid appointment employee'; END IF;
target:='sold'; UPDATE public.bikes SET status=target,sold_date=effective_date,sale_price=(payload->>'price')::numeric,sold_by=(payload->>'employee')::uuid,appointment_by=nullif(payload->>'appointment','')::uuid WHERE id=bike RETURNING * INTO b;
profit_value:=b.sale_price-b.purchase_cost-b.refurb_cost; days:=b.sold_date-b.purchase_date;
IF days<=30 THEN sales_rate:=.05; procurement_rate:=.15; zone_name:='Green'; ELSIF days<=60 THEN sales_rate:=.10; procurement_rate:=.10; zone_name:='Yellow'; ELSE sales_rate:=.15; procurement_rate:=.05; zone_name:='Red'; END IF;
INSERT INTO public.commissions(bike_id,employee_id,allocation_role,amount,profit,stock_days,zone) VALUES(bike,b.sold_by,'Sales',round(greatest(profit_value,0)*sales_rate/CASE WHEN b.appointment_by IS NOT NULL AND b.appointment_by<>b.sold_by THEN 2 ELSE 1 END,2),profit_value,days,zone_name),(bike,b.procured_by,'Procurement',round(greatest(profit_value,0)*procurement_rate/CASE WHEN b.sourcing_assistant IS NOT NULL AND b.sourcing_assistant<>b.procured_by THEN 2 ELSE 1 END,2),profit_value,days,zone_name);
IF b.appointment_by IS NOT NULL AND b.appointment_by<>b.sold_by THEN INSERT INTO public.commissions(bike_id,employee_id,allocation_role,amount,profit,stock_days,zone) VALUES(bike,b.appointment_by,'Appointment',round(greatest(profit_value,0)*sales_rate,2)-(SELECT amount FROM public.commissions WHERE bike_id=bike AND allocation_role='Sales'),profit_value,days,zone_name); END IF;
IF b.sourcing_assistant IS NOT NULL AND b.sourcing_assistant<>b.procured_by THEN INSERT INTO public.commissions(bike_id,employee_id,allocation_role,amount,profit,stock_days,zone) VALUES(bike,b.sourcing_assistant,'Sourcing support',round(greatest(profit_value,0)*procurement_rate,2)-(SELECT amount FROM public.commissions WHERE bike_id=bike AND allocation_role='Procurement'),profit_value,days,zone_name); END IF;
SELECT array_agg(id ORDER BY name) INTO pool_ids FROM public.employees WHERE active AND commission_eligible AND id NOT IN(SELECT employee_id FROM public.commissions WHERE bike_id=bike);
cents:=round(greatest(profit_value,0)*.05*100); IF pool_ids IS NOT NULL THEN FOREACH eid IN ARRAY pool_ids LOOP INSERT INTO public.commissions(bike_id,employee_id,allocation_role,amount,profit,stock_days,zone) VALUES(bike,eid,'Staff pool',(cents/array_length(pool_ids,1)+CASE WHEN idx<cents%array_length(pool_ids,1) THEN 1 ELSE 0 END)/100.0,profit_value,days,zone_name); idx:=idx+1; END LOOP; END IF;
ELSE RAISE EXCEPTION 'Sold bike records are locked'; END IF;
INSERT INTO public.bike_events(bike_id,stage,actor_id,happened_on,detail) VALUES(bike,target,auth.uid(),effective_date,coalesce(payload->>'note','Stage completed'));
END $$;
REVOKE ALL ON FUNCTION public.intake_bike(jsonb,boolean), public.advance_bike(uuid,text,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.intake_bike(jsonb,boolean), public.advance_bike(uuid,text,jsonb,boolean) TO authenticated;
CREATE FUNCTION public.set_my_pin(pin text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$ DECLARE eid uuid; BEGIN
SELECT employee_id INTO eid FROM public.profiles WHERE id=auth.uid(); IF eid IS NULL THEN RAISE EXCEPTION 'Employee account not assigned'; END IF;
IF pin !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'Use a six digit passcode'; END IF;
INSERT INTO public.employee_pins(employee_id,pin_hash) VALUES(eid,extensions.crypt(pin,extensions.gen_salt('bf',10))) ON CONFLICT(employee_id) DO UPDATE SET pin_hash=EXCLUDED.pin_hash,failed_attempts=0,locked_until=NULL;
DELETE FROM public.portal_sessions WHERE employee_id=eid; END $$;
CREATE FUNCTION public.unlock_portal(pin text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$ DECLARE eid uuid; p public.employee_pins; secret text; BEGIN
SELECT employee_id INTO eid FROM public.profiles WHERE id=auth.uid(); IF eid IS NULL THEN RAISE EXCEPTION 'Employee account not assigned'; END IF;
SELECT * INTO p FROM public.employee_pins WHERE employee_id=eid FOR UPDATE; IF NOT FOUND THEN RETURN jsonb_build_object('error','Set your passcode first'); END IF;
IF p.locked_until>now() THEN RETURN jsonb_build_object('error','Too many attempts. Try again in 15 minutes'); END IF;
IF extensions.crypt(pin,p.pin_hash)<>p.pin_hash THEN UPDATE public.employee_pins SET failed_attempts=CASE WHEN p.locked_until IS NOT NULL AND p.locked_until<=now() THEN 1 ELSE failed_attempts+1 END,locked_until=CASE WHEN failed_attempts>=4 AND (locked_until IS NULL OR locked_until>now()) THEN now()+interval '15 minutes' ELSE NULL END WHERE employee_id=eid; RETURN jsonb_build_object('error','Incorrect passcode'); END IF;
UPDATE public.employee_pins SET failed_attempts=0,locked_until=NULL WHERE employee_id=eid;
secret:=encode(extensions.gen_random_bytes(32),'hex'); DELETE FROM public.portal_sessions WHERE user_id=auth.uid();
INSERT INTO public.portal_sessions VALUES(encode(extensions.digest(secret,'sha256'),'hex'),auth.uid(),eid,now()+interval '3 minutes'); RETURN jsonb_build_object('token',secret); END $$;
CREATE FUNCTION public.my_portal(token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$ DECLARE eid uuid; BEGIN
SELECT employee_id INTO eid FROM public.portal_sessions WHERE token_hash=encode(extensions.digest(token,'sha256'),'hex') AND user_id=auth.uid() AND expires_at>now(); IF eid IS NULL THEN RAISE EXCEPTION 'Portal locked'; END IF;
RETURN jsonb_build_object('employee',(SELECT to_jsonb(e) FROM public.employees e WHERE e.id=eid),'commissions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'bike_id',c.bike_id,'allocation_role',c.allocation_role,'amount',c.amount,'stock_days',c.stock_days,'zone',c.zone,'sku',b.sku,'brand',b.brand,'model',b.model,'sold_date',b.sold_date,'sale_price',b.sale_price,'photo',b.listing_photo)) FROM public.commissions c JOIN public.bikes b ON b.id=c.bike_id WHERE c.employee_id=eid),'[]'::jsonb),'bikes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',b.id,'sku',b.sku,'brand',b.brand,'model',b.model,'status',b.status,'photo',coalesce(b.listing_photo,b.intake_photo),'sold_date',b.sold_date,'service_date',b.service_date)) FROM public.bikes b WHERE eid IN(b.procured_by,b.sourcing_assistant,b.serviced_by,b.inspected_by,b.sold_by,b.appointment_by)),'[]'::jsonb)); END $$;
REVOKE ALL ON FUNCTION public.set_my_pin(text),public.unlock_portal(text),public.my_portal(text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.set_my_pin(text),public.unlock_portal(text),public.my_portal(text) TO authenticated;
CREATE FUNCTION public.assign_account(account uuid, employee uuid, access_role public.app_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator required'; END IF;
IF account=auth.uid() THEN RAISE EXCEPTION 'Cannot change your own access'; END IF;
INSERT INTO public.profiles(id,employee_id) VALUES(account,employee) ON CONFLICT(id) DO UPDATE SET employee_id=EXCLUDED.employee_id;
DELETE FROM public.user_roles WHERE user_id=account; INSERT INTO public.user_roles(user_id,role) VALUES(account,access_role); END $$;
REVOKE ALL ON FUNCTION public.assign_account(uuid,uuid,public.app_role) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.assign_account(uuid,uuid,public.app_role) TO authenticated;
CREATE POLICY stock_photos_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='bike-photos' AND public.is_operator());
CREATE POLICY stock_photos_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='bike-photos' AND public.is_operator() AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY stock_photos_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='bike-photos' AND public.is_operator() AND owner_id=auth.uid()::text);
