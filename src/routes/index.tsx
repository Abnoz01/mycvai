import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, ArrowRight, Upload, Send, Target, Briefcase, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CV Match — AI-powered recruitment platform" },
      { name: "description", content: "Smart matching between CVs and job offers. AI CV correction & translation. Real-time tracking." },
      { property: "og:title", content: "CV Match — AI-powered recruitment" },
      { property: "og:description", content: "Find your next job with AI matching." },
    ],
  }),
});

function Landing() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ offers: 0, accuracy: 95 });
  const [reviews, setReviews] = useState<Array<{ id: string; author_name: string; job_title: string | null; rating: number; comment: string }>>([]);

  useEffect(() => {
    supabase.from("job_offers").select("id", { count: "exact", head: true }).eq("status", "open").then(({ count }) => {
      setStats((s) => ({ ...s, offers: count ?? 0 }));
    });
    supabase.from("reviews").select("*").limit(3).then(({ data }) => setReviews(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_50%)] opacity-20" />
        <div className="container mx-auto px-4 pt-20 pb-24 text-center">
          <Badge variant="outline" className="mb-6 gap-1 border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="h-3 w-3" /> {t("hero.badge")}
          </Badge>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            {t("hero.title")} <span className="gradient-text">{t("hero.titleAccent")}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup/employee">
              <Button size="lg" className="gradient-primary text-primary-foreground shadow-elegant gap-2">
                {t("hero.cta1")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/faq">
              <Button size="lg" variant="outline">{t("hero.cta2")}</Button>
            </Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-6">
            <Stat value={`${stats.offers}+`} label={t("hero.stats.offers")} icon={Briefcase} />
            <Stat value={`${stats.accuracy}%`} label={t("hero.stats.accuracy")} icon={Target} />
            <Stat value="24/7" label={t("hero.stats.support")} icon={Zap} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">{t("flow.title")}</h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {[{ icon: Users, key: "s1" }, { icon: Upload, key: "s2" }, { icon: Sparkles, key: "s3" }].map((s, i) => (
              <Card key={s.key} className="border-border/60 transition hover:shadow-elegant">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-primary">STEP {i + 1}</div>
                  <h3 className="mt-2 text-xl font-semibold">{t(`flow.${s.key}.title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`flow.${s.key}.desc`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold md:text-4xl">{t("reviews.title")}</h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <Card key={r.id} className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm">"{r.comment}"</p>
                  <div className="mt-4 border-t pt-4">
                    <div className="font-semibold">{r.author_name}</div>
                    <div className="text-xs text-muted-foreground">{r.job_title}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("partners.title")}</h3>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
            {["TechCorp", "NovaSoft", "Atlas Group", "Orion Labs", "ZenithIO", "PrimeWorks"].map((n) => (
              <div key={n} className="text-2xl font-bold tracking-tight">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA TO FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Vous avez des questions ?</h2>
          <p className="mt-3 text-muted-foreground">Consultez notre FAQ ou contactez-nous directement.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/faq"><Button variant="outline" size="lg">FAQ</Button></Link>
            <Link to="/contact">
              <Button size="lg" className="gradient-primary text-primary-foreground gap-2">
                <Send className="h-4 w-4" /> {t("contact.title")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <Icon className="mx-auto h-6 w-6 text-primary" />
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
