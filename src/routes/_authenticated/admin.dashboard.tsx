import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetStats } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, Building2, MessageSquare, Star, TrendingUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({ component: Page });

function Page() {
  const fn = useServerFn(adminGetStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fn() });

  const tiles = [
    { label: "Utilisateurs", value: data?.users ?? 0, icon: Users, color: "from-blue-500 to-indigo-600" },
    { label: "Offres totales", value: data?.offers ?? 0, icon: Briefcase, color: "from-violet-500 to-purple-600" },
    { label: "Offres ouvertes", value: data?.openOffers ?? 0, icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
    { label: "Candidatures", value: data?.applications ?? 0, icon: FileText, color: "from-amber-500 to-orange-600" },
    { label: "Entreprises", value: data?.companies ?? 0, icon: Building2, color: "from-pink-500 to-rose-600" },
    { label: "Messages", value: data?.messages ?? 0, icon: MessageSquare, color: "from-cyan-500 to-sky-600" },
    { label: "Avis", value: data?.reviews ?? 0, icon: Star, color: "from-yellow-500 to-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground">Statistiques globales de la plateforme</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-md`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{isLoading ? "…" : t.value}</div>
                <div className="text-xs text-muted-foreground">{t.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Nouvelles offres (7 derniers jours)</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.offersByDay ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis allowDecimals={false} className="text-xs" />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
