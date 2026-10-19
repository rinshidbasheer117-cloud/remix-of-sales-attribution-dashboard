import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWorkspace } from '@/lib/bikes.functions';
import type { User } from '@supabase/supabase-js';
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void supabase.auth.getSession().then(({ data }) => { if (live) { setUser(data.session?.user ?? null); setReady(true); } });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (live) { setUser(session?.user ?? null); setReady(true); } });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  return { user, ready };
}
export function useWorkspace() {
  const { user, ready } = useSession();
  const fetch = useServerFn(getWorkspace);
  const query = useQuery({ queryKey: ['workspace', user?.id], queryFn: () => fetch(), enabled: !!user, refetchInterval: 240000, retry: 1 });
  return { ...query, user, ready };
}
export type Workspace = Awaited<ReturnType<typeof getWorkspace>>;
export type Bike = Workspace['bikes'][number];
export type Employee = Workspace['employees'][number];