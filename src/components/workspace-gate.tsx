import { Link } from '@tanstack/react-router';
import { LockKeyhole, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
export function WorkspaceGate({workspace,children,employee=false}:{workspace:ReturnType<typeof useWorkspace>;children:ReactNode;employee?:boolean}){
 if(!workspace.ready||workspace.user&&workspace.isPending)return <div className="py-20 text-center text-muted-foreground">Loading your workspace…</div>;
 if(!workspace.user)return <div className="empty-state"><LockKeyhole/><h2>Your team workspace</h2><p>Sign in to access your bikes and commission records.</p><Button asChild><Link to="/auth">Sign in</Link></Button></div>;
 if(workspace.error)return <div className="empty-state"><RefreshCw/><h2>Unable to load records</h2><p>{workspace.error.message}</p><Button onClick={()=>workspace.refetch()}>Try again</Button></div>;
 if(!employee&&!workspace.data?.operator)return <div className="empty-state"><LockKeyhole/><h2>Access awaiting approval</h2><p>Your account needs to be approved by the dealership administrator.</p><Button asChild variant="outline"><Link to="/my-portal">My commissions</Link></Button></div>;
 return <>{children}</>;
}
