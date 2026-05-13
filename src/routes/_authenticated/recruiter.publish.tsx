import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruiter/publish")({ component: Publish });

function Publish() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", skills: "", contract_type: "CDI",
    location: "", salary: "", expires_at: "", easy_apply: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) supabase.from("companies").select("id").eq("owner_id", user.id).maybeSingle().then(({ data }) => setCompanyId(data?.id ?? null));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyId) return toast.error("Pas de société");
    setLoading(true);
    const { error } = await supabase.from("job_offers").insert({
      recruiter_id: user.id, company_id: companyId,
      title: form.title, description: form.description,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      contract_type: form.contract_type as any,
      location: form.location, salary: form.salary ? parseFloat(form.salary) : null,
      expires_at: form.expires_at || null, easy_apply: form.easy_apply,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Offre publiée");
    navigate({ to: "/recruiter/dashboard" });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader><CardTitle>{t("recruiter.publishTitle")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div><Label>{t("recruiter.jobTitle")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>{t("recruiter.jobDesc")}</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
            <div><Label>{t("recruiter.skills")}</Label><Input placeholder="React, TypeScript, Node.js" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("recruiter.contractType")}</Label>
                <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CDI", "CDD", "FREELANCE", "STAGE", "INTERIM"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("recruiter.location")}</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("recruiter.salary")}</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
              <div><Label>{t("recruiter.expires")}</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="ea" checked={form.easy_apply} onCheckedChange={(c) => setForm({ ...form, easy_apply: !!c })} />
              <Label htmlFor="ea" className="cursor-pointer">{t("recruiter.easyApply")}</Label>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground gap-2">
              <Send className="h-4 w-4" />{t("recruiter.publish")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
