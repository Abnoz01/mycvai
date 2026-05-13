import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: Contact,
  head: () => ({ meta: [{ title: "Contact — CV Match" }] }),
});

function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert(form);
    setLoading(false);
    if (error) return toast.error(t("contact.error"));
    toast.success(t("contact.success"));
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <section className="container mx-auto max-w-5xl px-4 py-20">
        <h1 className="text-center text-4xl font-bold">{t("contact.title")}</h1>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold">{t("contact.info")}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> hello@cvmatch.app</li>
                <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +212 5XX XX XX XX</li>
                <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Casablanca, Maroc</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={submit} className="space-y-3">
                <div><Label>{t("contact.name")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><Label>{t("contact.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                <div><Label>{t("contact.subject")}</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
                <div><Label>{t("contact.message")}</Label><Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required /></div>
                <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">{t("contact.send")}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
