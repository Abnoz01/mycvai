import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruiter/talents")({ component: Talents });

function Talents() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    const { data: emps } = await supabase.from("employee_profiles").select("*").limit(20);
    const ids = (emps ?? []).map((e: any) => e.user_id);
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    const merged = (emps ?? []).map((e: any) => {
      const skillMatch = query
        ? (e.skills ?? []).filter((s: string) => s.toLowerCase().includes(query.toLowerCase())).length * 15
        : 0;
      const text = (e.cv_text ?? "").toLowerCase();
      const hits = query ? query.toLowerCase().split(/\s+/).filter((w) => text.includes(w)).length : 0;
      const score = Math.min(99, 50 + skillMatch + hits * 10);
      return { ...e, profile: profs?.find((p: any) => p.id === e.user_id), score };
    }).sort((a, b) => b.score - a.score);
    setResults(merged);
    setLoading(false);
  };

  const invite = async (employeeId: string) => {
    if (!user) return;
    const { error } = await supabase.from("invitations").insert({
      recruiter_id: user.id, employee_id: employeeId, message: query,
    });
    if (error) return toast.error(error.message);
    toast.success("Invitation envoyée");
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">{t("recruiter.talentSearch")}</h2>
          </div>
          <div className="mt-4 flex gap-2">
            <Input placeholder="ex: développeur React senior à Casablanca..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
            <Button onClick={search} disabled={loading} className="gradient-primary text-primary-foreground gap-2">
              <Sparkles className="h-4 w-4" /> Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {results.map((r) => (
          <Card key={r.user_id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{r.profile?.full_name ?? "Candidat"}</div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {r.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</span>}
                <span>{r.experience_years ?? 0} ans</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(r.skills ?? []).slice(0, 6).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
            <Badge className="bg-primary/15 text-primary">{r.score}% match</Badge>
            <Button size="sm" onClick={() => invite(r.user_id)} className="gradient-primary text-primary-foreground gap-1">
              <Send className="h-3 w-3" />{t("recruiter.invite")}
            </Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
