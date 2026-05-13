import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/signup/employee")({
  component: SignupEmployee,
  head: () => ({ meta: [{ title: "Inscription Candidat — CV Match" }] }),
});

function SignupEmployee() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, role, refreshRole } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && role === "employee") navigate({ to: "/employee/space" });
  }, [session, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { emailRedirectTo: window.location.origin, data: { role: "employee", full_name: form.full_name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compte créé");
    await refreshRole();
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader><CardTitle>{t("auth.signupEmployeeTitle")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>{t("auth.fullName")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div><Label>{t("auth.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><Label>{t("auth.password")}</Label><Input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("auth.signup")}</Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("auth.haveAccount")} <Link to="/login" className="text-primary hover:underline">{t("auth.signin")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
