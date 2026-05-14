import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Sparkles, Languages, CheckCircle2, Download, Briefcase, Eye, TrendingUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { aiCorrectCv, aiTranslateCv } from "@/lib/ai.functions";
import { extractCvText } from "@/lib/cv-extract";

export const Route = createFileRoute("/_authenticated/employee/space")({ component: EmployeeSpace });

function EmployeeSpace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ applications: 0, interactions: 0, score: 0, views: 0 });
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTab, setAiTab] = useState<"edit" | "tools">("edit");
  const [cvText, setCvText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const correctFn = useServerFn(aiCorrectCv);
  const translateFn = useServerFn(aiTranslateCv);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("employee_profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data);
    setCvText(data?.cv_text ?? "");
    setStats({
      applications: 0, interactions: 0,
      score: data?.cv_score ?? 0, views: data?.profile_views ?? 0,
    });
    const { count } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("employee_id", user.id);
    setStats((s) => ({ ...s, applications: count ?? 0, interactions: count ?? 0 }));
  };

  useEffect(() => { load(); }, [user]);

  const saveProfile = async () => {
    if (!user || !profile) return;
    const { error } = await supabase.from("employee_profiles").upsert({
      user_id: user.id,
      age: profile.age, location: profile.location,
      experience_years: profile.experience_years, desired_salary: profile.desired_salary,
      cv_text: cvText, cv_score: Math.min(100, (cvText?.length ?? 0) / 30),
    });
    if (error) return toast.error(error.message);
    toast.success(t("common.saved"));
    load();
  };

  const uploadCv = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/cv.${ext}`;
    const { error } = await supabase.storage.from("cvs").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);

    const isPlainText = file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt");
    const text = isPlainText
      ? await file.text().then((value) => value.replace(/\u0000/g, "")).catch(() => "")
      : "";
    const nextCvText = text || cvText;
    if (text) setCvText(text);

    const { error: profileError } = await supabase.from("employee_profiles").upsert({
      user_id: user.id,
      cv_path: path,
      cv_text: nextCvText,
      cv_score: Math.min(100, (nextCvText?.length ?? 0) / 30),
    });
    if (profileError) return toast.error(profileError.message);
    toast.success("CV uploaded");
    load();
  };

  const runCorrect = async () => {
    if (!cvText) return;
    setAiLoading(true);
    try {
      const r = await correctFn({ data: { text: cvText } });
      setCvText(r.text);
      toast.success("Corrigé");
    } catch (e: any) { toast.error(e.message); } finally { setAiLoading(false); }
  };
  const runTranslate = async () => {
    if (!cvText) return;
    setAiLoading(true);
    try {
      const target = /[a-z]\s+(le|la|les|un|une|des|et)\s/i.test(cvText) ? "en" : "fr";
      const r = await translateFn({ data: { text: cvText, target } });
      setCvText(r.text);
      toast.success("Traduit");
    } catch (e: any) { toast.error(e.message); } finally { setAiLoading(false); }
  };

  const downloadAs = (mime: string, ext: string) => {
    const blob = new Blob([cvText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `cv.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const statTiles = [
    { label: t("employee.stats.applications"), value: stats.applications, icon: Briefcase },
    { label: t("employee.stats.interactions"), value: stats.interactions, icon: MessageSquare },
    { label: t("employee.stats.score"), value: `${Math.round(stats.score)}%`, icon: TrendingUp },
    { label: t("employee.stats.views"), value: stats.views, icon: Eye },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {statTiles.map((s) => (
          <Card key={s.label}><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground"><s.icon className="h-5 w-5" /></div>
            <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {t("employee.cv")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-6 hover:border-primary">
              <Upload className="h-6 w-6 text-primary" />
              <div>
                <div className="font-medium">{t("employee.uploadCv")}</div>
                <div className="text-xs text-muted-foreground">PDF · DOC · DOCX · TXT</div>
              </div>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => e.target.files?.[0] && uploadCv(e.target.files[0])} />
            </label>
            <Button onClick={() => setAiOpen(true)} variant="outline" className="w-full gap-2"><Sparkles className="h-4 w-4 text-primary" />{t("employee.aiCorrect")}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{t("employee.age")}</Label><Input type="number" value={profile?.age ?? ""} onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })} /></div>
              <div><Label>{t("employee.experience")}</Label><Input type="number" value={profile?.experience_years ?? ""} onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || null })} /></div>
            </div>
            <div><Label>{t("employee.location")}</Label><Input value={profile?.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></div>
            <div><Label>{t("employee.desiredSalary")}</Label><Input type="number" value={profile?.desired_salary ?? ""} onChange={(e) => setProfile({ ...profile, desired_salary: parseFloat(e.target.value) || null })} /></div>
            <Button onClick={saveProfile} className="w-full gradient-primary text-primary-foreground gap-2"><CheckCircle2 className="h-4 w-4" />{t("employee.save")}</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{t("employee.aiCorrect")}</DialogTitle></DialogHeader>
          <Tabs value={aiTab} onValueChange={(v) => setAiTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">{t("employee.edit")}</TabsTrigger>
              <TabsTrigger value="tools"><Sparkles className="mr-2 h-4 w-4" />{t("employee.aiTools")}</TabsTrigger>
            </TabsList>
            <TabsContent value="edit" className="grid gap-4 md:grid-cols-2">
              <Textarea value={cvText} onChange={(e) => setCvText(e.target.value)} rows={18} placeholder="Contenu du CV..." />
              <div className="rounded-xl border bg-card p-4 text-sm whitespace-pre-wrap max-h-[450px] overflow-auto">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">{t("employee.livePreview")}</div>
                {cvText || <span className="text-muted-foreground">—</span>}
              </div>
            </TabsContent>
            <TabsContent value="tools" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={runTranslate} disabled={aiLoading} variant="outline" className="gap-2"><Languages className="h-4 w-4" />{t("employee.translate")}</Button>
                <Button onClick={runCorrect} disabled={aiLoading} variant="outline" className="gap-2"><CheckCircle2 className="h-4 w-4" />{t("employee.grammar")}</Button>
              </div>
              <div className="rounded-xl border bg-card p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-auto">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">{t("employee.livePreview")}</div>
                {aiLoading ? "..." : cvText}
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button onClick={saveProfile} className="gradient-primary text-primary-foreground">{t("employee.save")}</Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadAs("application/pdf", "pdf")}><Download className="mr-1 h-3 w-3" />PDF</Button>
              <Button variant="outline" size="sm" onClick={() => downloadAs("application/msword", "doc")}><Download className="mr-1 h-3 w-3" />DOC</Button>
              <Button variant="outline" size="sm" onClick={() => downloadAs("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx")}><Download className="mr-1 h-3 w-3" />DOCX</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
