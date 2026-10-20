import { createFileRoute,useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/commission';
import { toast } from 'sonner';
import { useState } from 'react';
export const Route=createFileRoute('/reset-password')({head:()=>pageHead('New password','Set a new password for your CycleWorks team account.'),component:Reset});
function Reset(){const [busy,setBusy]=useState(false);const navigate=useNavigate();return <main className="page-content"><form className="mx-auto max-w-sm space-y-5 py-16" onSubmit={async e=>{e.preventDefault();setBusy(true);const f=new FormData(e.currentTarget);const result=await supabase.auth.updateUser({password:String(f.get('password'))});setBusy(false);if(result.error)toast.error(result.error.message);else{toast.success('Password updated');await navigate({to:'/'});}}}><h1 className="text-2xl">Set a new password</h1><Label htmlFor="new-password">New password</Label><Input id="new-password" name="password" type="password" minLength={8} required autoComplete="new-password"/><Button type="submit" disabled={busy}>Save password</Button></form></main>}
