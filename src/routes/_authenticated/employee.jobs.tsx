import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Banknote, Calendar, Zap, Briefcase } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employee/jobs")({ component: Jobs });

function Jobs() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await supabase.from("job_offers").select("*, companies(name)").eq("status", "open").order("created_at", { ascending: false });
    setOffers(data ?? []);
    if (user) {
      const { data: apps } = await supabase.from("applications").select("job_id").eq("employee_id", user.id);
      setApplied(new Set((apps ?? []).map((a: any) => a.job_id)));
    }
  };
  useEffect(() => { load(); }, [user]);

  const apply = async (jobId: string) => {
    if (!user) return;
    const match = Math.floor(Math.random() * 30) + 60;
    const { error } = await supabase.from("applications").insert({ job_id: jobId, employee_id: user.id, match_percent: match });
    if (error) return toast.error(error.message);
    toast.success("Candidature envoyée");
    setApplied(new Set([...applied, jobId]));
  };

  const filtered = offers.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.companies?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder={t("employee.searchJobs")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">Aucune offre disponible.</div>}
        {filtered.map((o) => {
          const match = Math.floor((o.id.charCodeAt(0) % 30) + 60);
          return (
            <Card key={o.id} className="transition hover:shadow-elegant">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{o.title}</h3>
                      <Badge variant="outline">{o.contract_type}</Badge>
                      {o.easy_apply && <Badge className="bg-success/15 text-success border-success/30 gap-1"><Zap className="h-3 w-3" />{t("employee.easyApply")}</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{o.companies?.name}</div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {o.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.location}</span>}
                      {o.salary && <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{o.salary}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="rounded-xl bg-primary/10 px-3 py-1 text-sm font-bold text-primary">{match}% {t("employee.match")}</div>
                    <Button disabled={applied.has(o.id)} onClick={() => apply(o.id)} className="gradient-primary text-primary-foreground gap-1">
                      <Briefcase className="h-4 w-4" />
                      {applied.has(o.id) ? t("employee.applied") : t("employee.apply")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
