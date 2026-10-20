export const importColumns=['sku','brand','model','purchase_date','purchase_cost','procured_by','status','serial_number','sourcing_assistant','service_date','serviced_by','refurb_cost','inspection_date','inspected_by','listing_date','asking_price','listing_url','sold_date','sale_price','sold_by','appointment_by','notes'];
export function validateImport(rows:Record<string,string>[],existing:string[],employees:{id:string;name:string}[]){
 const seen=new Set(existing.map(s=>s.trim().toLowerCase()));const errors:{row:number;message:string}[]=[];const mapped=rows.map((raw,index)=>{
  const row=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k.trim().toLowerCase().replaceAll(' ','_'),String(v??'').trim()]));
  const issue=(message:string)=>errors.push({row:index+2,message});
  for(const key of ['sku','brand','model','purchase_date','purchase_cost','procured_by'])if(!row[key])issue(`${key} is required`);
  const key=row.sku?.toLowerCase();if(key&&seen.has(key))issue(`Duplicate SKU: ${row.sku}`);if(key)seen.add(key);
  if(/e-bike|ebike|e bike|electric/i.test(`${row.brand} ${row.model}`))issue('Electric bikes are not supported');
  row.status=row.status||'service';const order=['service','inspection','listing','available','sold'];const stage=order.indexOf(row.status);if(stage<0)issue('Status must be service, inspection, listing, available or sold');
  for(const k of ['procured_by','sourcing_assistant','serviced_by','inspected_by','sold_by','appointment_by'])if(row[k]){const employee=employees.find(e=>e.id===row[k]||e.name.toLowerCase()===row[k].toLowerCase());if(employee)row[k]=employee.id;else issue(`Unknown employee: ${row[k]}`);}
  for(const k of ['purchase_cost','refurb_cost','asking_price','sale_price'])if(row[k]&&(!Number.isFinite(Number(row[k]))||Number(row[k])<0))issue(`${k} must be a non-negative number`);
  const dates=['purchase_date',...(stage>=1?['service_date']:[]),...(stage>=2?['inspection_date']:[]),...(stage>=3?['listing_date']:[]),...(stage>=4?['sold_date']:[])];let previous='';for(const k of dates){if(!/^\d{4}-\d{2}-\d{2}$/.test(row[k]??'')||!Number.isFinite(Date.parse(row[k]))||new Date(row[k]).toISOString().slice(0,10)!==row[k])issue(`${k} must be a valid YYYY-MM-DD date`);else{if(previous&&row[k]<previous)issue(`${k} is before the previous stage`);previous=row[k];}}
  if(stage>=1&&!row.serviced_by)issue('serviced_by is required');if(stage>=2&&!row.inspected_by)issue('inspected_by is required');if(stage>=4&&(!row.sale_price||!row.sold_by))issue('Sold records need sale_price and sold_by');return row;
 });return {rows:mapped,errors};
}
