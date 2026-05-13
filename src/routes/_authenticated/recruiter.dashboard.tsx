import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Users, Eye, TrendingUp, ChevronRight, FileText, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruiter/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [kpi, setKpi] = useState({ active: 0, candidates: 0, views: 0, interactions: 0 });
  const [openOffer, setOpenOffer] = useState<any>(null);
  const [openCv, setOpenCv] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: o } = await supabase.from("job_offers").select("*, applications(count)").eq("recruiter_id", user.id).order("created_at", { ascending: false });
    setOffers(o ?? []);
    const totalViews = (o ?? []).reduce((s, x) => s + (x.views ?? 0), 0);
    const active = (o ?? []).filter((x) => x.status === "open").length;
    const totalCands = (o ?? []).reduce((s, x: any) => s + (x.applications?.[0]?.count ?? 0), 0);
    setKpi({ active, candidates: totalCands, views: totalViews, interactions: totalCands });
  };

  useEffect(() => { load(); }, [user]);

  const openApplicants = async (offer: any) => {
    setOpenOffer(offer);
    const { data } = await supabase
      .from("applications")
      .select("*, employee_profiles!inner(*, profiles:user_id(full_name))")
      .eq("job_id", offer.id);
    // fallback: load profiles separately
    const { data: apps } = await supabase.from("applications").select("*").eq("job_id", offer.id);
    const ids = (apps ?? []).map((a: any) => a.employee_id);
    if (ids.length === 0) { setApplicants([]); return; }
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    const { data: emps } = await supabase.from("employee_profiles").select("*").in("user_id", ids);
    const merged = (apps ?? []).map((a: any) => ({
      ...a,
      profile: profs?.find((p: any) => p.id === a.employee_id),
      employee: emps?.find((e: any) => e.user_id === a.employee_id),
    }));
    setApplicants(merged);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("applications").update({ status }).eq("id", id);
    toast.success("Statut mis à jour");
    if (openOffer) openApplicants(openOffer);
  };

  const tiles = [
    { label: t("recruiter.kpi.activeOffers"), value: kpi.active, icon: Briefcase },
    { label: t("recruiter.kpi.candidates"), value: kpi.candidates, icon: Users },
    { label: t("recruiter.kpi.views"), value: kpi.views, icon: Eye },
    { label: t("recruiter.kpi.interactions"), value: `${kpi.interactions}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {tiles.map((s) => (
          <Card key={s.label}><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground"><s.icon className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 font-semibold">{t("recruiter.myOffers")}</div>
          <div className="divide-y">
            {offers.length === 0 && <div className="p-8 text-center text-muted-foreground">Aucune offre. Publiez-en une.</div>}
            {offers.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{o.title}</span>
                    <Badge variant="outline">{o.contract_type}</Badge>
                    <Badge variant={o.status === "open" ? "default" : "secondary"}>{o.status}</Badge>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    <span><Eye className="inline h-3 w-3" /> {o.views} vues</span>
                    <span><Users className="inline h-3 w-3" /> {o.applications?.[0]?.count ?? 0} candidatures</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openApplicants(o)} className="gap-1">{t("recruiter.view")} <ChevronRight className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!openOffer} onOpenChange={(v) => !v && setOpenOffer(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>{openOffer?.title}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="text-sm whitespace-pre-wrap">{openOffer?.description}</div>
            <div className="border-t pt-4">
              <div className="mb-3 font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> {applicants.length} {t("recruiter.applicants")}</div>
              <div className="space-y-2">
                {applicants.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{a.profile?.full_name ?? "Candidat"}</div>
                      <div className="text-xs text-muted-foreground">{a.employee?.location} · {a.employee?.experience_years ?? 0} ans exp.</div>
                    </div>
                    <Badge className="bg-primary/10 text-primary">{a.match_percent}% match</Badge>
                    <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                      <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="interview">Entretien</SelectItem>
                        <SelectItem value="accepted">Acceptée</SelectItem>
                        <SelectItem value="rejected">Refusée</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => setOpenCv(a)} className="gap-1"><FileText className="h-3 w-3" /> CV</Button>
                  </div>
                ))}
                {applicants.length === 0 && <div className="text-sm text-muted-foreground">Aucun candidat pour l'instant.</div>}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!openCv} onOpenChange={(v) => !v && setOpenCv(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>CV — {openCv?.profile?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Âge:</span> {openCv?.employee?.age ?? "—"}</div>
              <div><span className="text-muted-foreground">Lieu:</span> {openCv?.employee?.location ?? "—"}</div>
              <div><span className="text-muted-foreground">Expérience:</span> {openCv?.employee?.experience_years ?? "—"} ans</div>
              <div><span className="text-muted-foreground">Salaire souhaité:</span> {openCv?.employee?.desired_salary ?? "—"}</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 max-h-[400px] overflow-auto whitespace-pre-wrap text-sm">
              {openCv?.employee?.cv_text || <span className="text-muted-foreground">CV non disponible.</span>}
            </div>
            <Button variant="outline" className="w-full gap-2"><Mail className="h-4 w-4" /> Contacter le candidat</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
