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

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Connexion — CV Match" }] }),
});

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && role) {
      navigate({ to: role === "recruiter" ? "/recruiter/dashboard" : "/employee/space" });
    }
  }, [session, role, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Connecté");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader><CardTitle>{t("auth.signinTitle")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>{t("auth.email")}</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>{t("auth.password")}</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("auth.signin")}</Button>
            </form>
            <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
              <div>{t("auth.noAccount")}</div>
              <div className="flex gap-2 justify-center">
                <Link to="/signup/employee" className="text-primary hover:underline">{t("auth.asEmployee")}</Link>
                <span>·</span>
                <Link to="/signup/recruiter" className="text-primary hover:underline">{t("auth.asRecruiter")}</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
