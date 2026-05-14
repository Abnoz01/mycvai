import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListMessages } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/messages")({ component: Page });

function Page() {
  const fn = useServerFn(adminListMessages);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => fn() });

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Messages de contact</h1><p className="text-sm text-muted-foreground">{data?.length ?? 0} messages reçus</p></div>
      {isLoading && <div className="text-muted-foreground">Chargement...</div>}
      {!isLoading && (data?.length ?? 0) === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun message pour le moment</CardContent></Card>}
      <div className="grid gap-3">
        {(data ?? []).map((m: any) => (
          <Card key={m.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{m.name}</div>
                  <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</a>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
              </div>
              {m.subject && <div className="mt-3 font-medium">{m.subject}</div>}
              <p className="mt-2 text-sm whitespace-pre-wrap">{m.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
