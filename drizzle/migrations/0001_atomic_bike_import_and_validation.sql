CREATE FUNCTION public.import_bikes(rows jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; bid uuid; stage text; total integer:=0; BEGIN
IF NOT public.is_operator() THEN RAISE EXCEPTION 'Access denied'; END IF;
IF jsonb_typeof(rows)<>'array' OR jsonb_array_length(rows)>500 THEN RAISE EXCEPTION 'Import up to 500 rows at a time'; END IF;
FOR r IN SELECT value FROM jsonb_array_elements(rows) LOOP
stage:=coalesce(nullif(r->>'status',''),'service'); IF stage NOT IN('service','inspection','listing','available','sold') THEN RAISE EXCEPTION 'Invalid status for SKU %',r->>'sku'; END IF;
bid:=public.intake_bike(r,true);
IF stage IN('inspection','listing','available','sold') THEN PERFORM public.advance_bike(bid,'service',jsonb_build_object('date',r->>'service_date','employee',r->>'serviced_by','cost',coalesce(nullif(r->>'refurb_cost',''),'0')),true); END IF;
IF stage IN('listing','available','sold') THEN PERFORM public.advance_bike(bid,'inspection',jsonb_build_object('date',r->>'inspection_date','employee',r->>'inspected_by'),true); END IF;
IF stage IN('available','sold') THEN PERFORM public.advance_bike(bid,'listing',jsonb_build_object('date',r->>'listing_date','photo',r->>'listing_photo','price',nullif(r->>'asking_price',''),'url',r->>'listing_url'),true); END IF;
IF stage='sold' THEN PERFORM public.advance_bike(bid,'available',jsonb_build_object('date',r->>'sold_date','employee',r->>'sold_by','appointment',r->>'appointment_by','price',r->>'sale_price'),true); END IF;
total:=total+1;
END LOOP; RETURN total; END $$;
REVOKE ALL ON FUNCTION public.import_bikes(jsonb) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.import_bikes(jsonb) TO authenticated;
CREATE FUNCTION public.bike_required_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=NEW.procured_by AND active AND commission_eligible) THEN RAISE EXCEPTION 'Select a commission-eligible procurer'; END IF;
IF NEW.sourcing_assistant IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.employees WHERE id=NEW.sourcing_assistant AND active AND commission_eligible) THEN RAISE EXCEPTION 'Select a commission-eligible sourcing assistant'; END IF;
IF NEW.status IN('inspection','listing','available','sold') AND (NEW.service_date IS NULL OR NEW.serviced_by IS NULL) THEN RAISE EXCEPTION 'Service completion is required'; END IF;
IF NEW.status IN('listing','available','sold') AND (NEW.inspection_date IS NULL OR NEW.inspected_by IS NULL) THEN RAISE EXCEPTION 'Inspection completion is required'; END IF;
IF NEW.status IN('available','sold') AND NEW.listing_date IS NULL THEN RAISE EXCEPTION 'Listing completion is required'; END IF;
IF NEW.status='sold' AND (NEW.sold_date IS NULL OR NEW.sold_by IS NULL OR NEW.sale_price IS NULL) THEN RAISE EXCEPTION 'Sale date, price and closer are required'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER bike_fields_required BEFORE INSERT OR UPDATE ON public.bikes FOR EACH ROW EXECUTE FUNCTION public.bike_required_fields();
CREATE INDEX bike_event_bike_id_idx ON public.bike_events(bike_id); CREATE INDEX commissions_employee_id_idx ON public.commissions(employee_id); CREATE INDEX commissions_bike_id_idx ON public.commissions(bike_id);
