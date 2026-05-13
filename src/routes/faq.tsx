import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TopBar } from "@/components/layout/top-bar";
import { Footer } from "@/components/layout/footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  component: FAQ,
  head: () => ({ meta: [{ title: "FAQ — CV Match" }, { name: "description", content: "Foire aux questions" }] }),
});

function FAQ() {
  const { t } = useTranslation();
  const items = ["q1", "q2", "q3", "q4"];
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <section className="container mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-center text-4xl font-bold">{t("faq.title")}</h1>
        <Accordion type="single" collapsible className="mt-10">
          {items.map((q, i) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left">{t(`faq.${q}`)}</AccordionTrigger>
              <AccordionContent>{t(`faq.a${i + 1}`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <Footer />
    </div>
  );
}
