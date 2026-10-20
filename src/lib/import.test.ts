import { expect,it } from 'vitest';
import { validateImport } from './import';
const row={sku:' CW-001 ',brand:'Canyon',model:'Ultimate',purchase_date:'2026-10-01',purchase_cost:'1000',procured_by:'Anaz'};const team=[{id:'anaz',name:'Anaz'}];
it('detects printed SKU duplicates regardless of case and spacing',()=>expect(validateImport([row],['cw-001'],team).errors.some(e=>e.message.includes('Duplicate SKU'))).toBe(true));
it('rejects electric bikes',()=>expect(validateImport([{...row,model:'Electric bike'}],[],team).errors.some(e=>e.message.includes('Electric'))).toBe(true));
it('maps employee names to their assigned records',()=>expect(validateImport([row],[],team).rows[0].procured_by).toBe('anaz'));
it('requires complete lifecycle dates for historical sold bikes',()=>expect(validateImport([{...row,status:'sold'}],[],team).errors.some(e=>e.message.includes('service_date'))).toBe(true));
