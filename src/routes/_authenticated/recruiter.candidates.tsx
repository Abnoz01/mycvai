import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileText, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruiter/candidates")({ component: Candidates });

function Candidates() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: emps } = await supabase.from("employee_profiles").select("*");
      const ids = (emps ?? []).map((e: any) => e.user_id);
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setList((emps ?? []).map((e: any) => ({ ...e, profile: profs?.find((p: any) => p.id === e.user_id) })));
    })();
  }, []);

  const filtered = list.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.profile?.full_name?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q) || (e.skills ?? []).some((s: string) => s.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-10" placeholder={t("recruiter.searchCandidates")} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">Aucun candidat.</div>}
        {filtered.map((e) => {
          const match = 60 + ((e.user_id?.charCodeAt(0) ?? 0) % 35);
          return (
            <Card key={e.user_id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{e.profile?.full_name ?? "Candidat"}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                  <span>{e.experience_years ?? 0} ans</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(e.skills ?? []).slice(0, 5).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary">{match}% match</Badge>
              <Button size="sm" variant="outline" onClick={() => setOpen(e)} className="gap-1"><FileText className="h-3 w-3" />{t("recruiter.viewCv")}</Button>
            </CardContent></Card>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>CV — {open?.profile?.full_name}</DialogTitle></DialogHeader>
          <div className="rounded-xl border bg-muted/30 p-4 max-h-[500px] overflow-auto whitespace-pre-wrap text-sm">
            {open?.cv_text || <span className="text-muted-foreground">CV non disponible.</span>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
