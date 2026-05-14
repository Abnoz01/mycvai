import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callAzureAnthropic } from "./ai-gateway";

const MODEL_ID = "claude-sonnet-4-6";
const apiKey = () => process.env.AZURE_ANTHROPIC_API_KEY!;

export const aiCorrectCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { text: string }) => z.object({ text: z.string().min(10).max(20000) }).parse(i))
  .handler(async ({ data }) => {
    const text = await callAzureAnthropic({
      apiKey: apiKey(),
      model: MODEL_ID,
      system: "Tu corriges la grammaire, l'orthographe, la ponctuation et la mise en forme du CV. Garde le contenu et la langue. Renvoie uniquement le CV corrigé.",
      messages: [{ role: "user", content: data.text }],
    });
    return { text };
  });

export const aiTranslateCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { text: string; target: "fr" | "en" }) =>
    z.object({ text: z.string().min(10).max(20000), target: z.enum(["fr", "en"]) }).parse(i))
  .handler(async ({ data }) => {
    const lang = data.target === "fr" ? "français" : "anglais";
    const text = await callAzureAnthropic({
      apiKey: apiKey(),
      model: MODEL_ID,
      system: `Traduis le CV en ${lang}. Conserve la mise en forme. Renvoie uniquement la traduction.`,
      messages: [{ role: "user", content: data.text }],
    });
    return { text };
  });

export const aiMatchCvToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cv: string; job: string }) =>
    z.object({ cv: z.string().min(1).max(20000), job: z.string().min(1).max(10000) }).parse(i))
  .handler(async ({ data }) => {
    const raw = await callAzureAnthropic({
      apiKey: apiKey(),
      model: MODEL_ID,
      system: 'Analyse la compatibilité CV/offre. Renvoie STRICTEMENT un JSON: {"score": number 0-100, "reason": string}. Aucun texte avant ou après.',
      messages: [{ role: "user", content: `CV:\n${data.cv}\n\nOffre:\n${data.job}` }],
      temperature: 0.1,
    });
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : { score: 0, reason: raw };
    return z.object({ score: z.number().min(0).max(100), reason: z.string() }).parse(parsed);
  });
