import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare, CheckCircle2, XCircle, MapPin, Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employee/tracking")({ component: Tracking });

const STATUS_META = {
  pending: { color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  interview: { color: "bg-primary/15 text-primary border-primary/30", icon: MessageSquare },
  accepted: { color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  rejected: { color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
} as const;

function Tracking() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("applications").select("*, job_offers(*, companies(name))").eq("employee_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setApps(data ?? []));
  }, [user]);

  const counts = {
    pending: apps.filter((a) => a.status === "pending").length,
    interview: apps.filter((a) => a.status === "interview").length,
    accepted: apps.filter((a) => a.status === "accepted").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };
  const labels = {
    pending: t("employee.statusPending"), interview: t("employee.statusInterview"),
    accepted: t("employee.statusAccepted"), rejected: t("employee.statusRejected"),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {(Object.keys(counts) as Array<keyof typeof counts>).map((k) => {
          const M = STATUS_META[k];
          return (
            <Card key={k}><CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${M.color}`}><M.icon className="h-5 w-5" /></div>
              <div><div className="text-2xl font-bold">{counts[k]}</div><div className="text-xs text-muted-foreground">{labels[k]}</div></div>
            </CardContent></Card>
          );
        })}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">{t("employee.openOffers")}</h3>
        <div className="grid gap-3">
          {apps.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">Aucune candidature.</div>}
          {apps.map((a) => {
            const o = a.job_offers;
            const M = STATUS_META[a.status as keyof typeof STATUS_META];
            return (
              <Card key={a.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o?.title}</span>
                    <Badge variant="outline">{o?.contract_type}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{o?.companies?.name}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {o?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.location}</span>}
                    {o?.salary && <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{o.salary}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{a.match_percent}% match</div>
                  <Badge className={M.color}><M.icon className="mr-1 h-3 w-3" />{labels[a.status as keyof typeof labels]}</Badge>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
