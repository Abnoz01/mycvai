import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sun, Moon, Languages, ChevronDown, LogOut, Sparkles, User, Building2 } from "lucide-react";

export function TopBar({ companyName }: { companyName?: string }) {
  const { t } = useTranslation();
  const { theme, setTheme, locale, setLocale } = useApp();
  const { session, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-elegant">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold gradient-text">CV Match</span>
          {companyName && <span className="ml-2 hidden text-sm text-muted-foreground md:inline">· {companyName}</span>}
        </Link>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Languages className="h-4 w-4" />
                <span className="uppercase">{locale}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocale("fr")}>Français</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocale("ar")}>العربية</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {!session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    {t("nav.signup")} <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate({ to: "/signup/employee" })}>
                    <User className="mr-2 h-4 w-4" /> {t("nav.employee")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/signup/recruiter" })}>
                    <Building2 className="mr-2 h-4 w-4" /> {t("nav.recruiter")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" onClick={() => navigate({ to: "/login" })} className="gradient-primary text-primary-foreground">
                {t("nav.login")}
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="h-4 w-4" /> {t("nav.logout")}
            </Button>
          )}
          {role && session && (
            <Link to={role === "recruiter" ? "/recruiter/dashboard" : "/employee/space"}>
              <Button size="sm" variant="outline">{role === "recruiter" ? t("nav.recruiter") : t("nav.employee")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
