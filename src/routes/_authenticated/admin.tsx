import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutDashboard, Users, Briefcase, Building2, MessageSquare, Star, Sparkles, LogOut, Sun, Moon, Languages, Shield } from "lucide-react";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

const items = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Offres d'emploi", url: "/admin/offers", icon: Briefcase },
  { title: "Entreprises", url: "/admin/companies", icon: Building2 },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Avis", url: "/admin/reviews", icon: Star },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 p-4 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-elegant shrink-0">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold gradient-text leading-tight">CV Match</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Administration</div>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = path === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={item.url} className={`flex items-center gap-2 ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function AdminLayout() {
  const { role, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, locale, setLocale } = useApp();

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: role === "recruiter" ? "/recruiter/dashboard" : "/employee/space" });
    }
  }, [role, loading, navigate]);

  if (loading || role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const handleLogout = async () => { await signOut(); navigate({ to: "/" }); };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Admin Console
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Languages className="h-4 w-4" /><span className="uppercase">{locale}</span>
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
              <div className="hidden sm:block text-xs text-muted-foreground px-2">{user?.email}</div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
                <LogOut className="h-4 w-4" /> Déconnexion
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
