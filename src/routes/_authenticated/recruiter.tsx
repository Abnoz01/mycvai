import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "@/components/layout/top-bar";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Plus, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/recruiter")({ component: RecruiterLayout });

function RecruiterLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loc = useLocation();
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    if (!loading && role && role !== "recruiter") navigate({ to: "/employee/space" });
  }, [role, loading, navigate]);

  useEffect(() => {
    if (user) supabase.from("companies").select("name").eq("owner_id", user.id).maybeSingle().then(({ data }) => setCompanyName(data?.name ?? ""));
  }, [user]);

  const tabs = [
    { to: "/recruiter/dashboard", label: t("recruiter.tabs.dashboard"), icon: LayoutDashboard },
    { to: "/recruiter/publish", label: t("recruiter.tabs.publish"), icon: Plus },
    { to: "/recruiter/candidates", label: t("recruiter.tabs.candidates"), icon: Users },
    { to: "/recruiter/talents", label: t("recruiter.tabs.talents"), icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar companyName={companyName} />
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex gap-1 px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition",
                loc.pathname === tab.to ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 py-8"><Outlet /></div>
    </div>
  );
}
