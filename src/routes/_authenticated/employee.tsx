import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "@/components/layout/top-bar";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { User as UserIcon, Briefcase, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employee")({ component: EmployeeLayout });

function EmployeeLayout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && role && role !== "employee") navigate({ to: "/recruiter/dashboard" });
  }, [role, loading, navigate]);

  const tabs = [
    { to: "/employee/space", label: t("employee.tabs.space"), icon: UserIcon },
    { to: "/employee/jobs", label: t("employee.tabs.jobs"), icon: Briefcase },
    { to: "/employee/tracking", label: t("employee.tabs.tracking"), icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="border-b border-border bg-card">
        <div className="container mx-auto flex gap-1 px-4">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition",
                loc.pathname === t.to ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4 py-8"><Outlet /></div>
    </div>
  );
}
