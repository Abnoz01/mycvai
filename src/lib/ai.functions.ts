import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAzureAnthropicProvider } from "./ai-gateway";

const MODEL_ID = "claude-sonnet-4-6";
const model = () => createAzureAnthropicProvider(process.env.AZURE_ANTHROPIC_API_KEY!)(MODEL_ID);

export const aiCorrectCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { text: string }) => z.object({ text: z.string().min(10).max(20000) }).parse(i))
  .handler(async ({ data }) => {
    const { text: corrected } = await generateText({
      model: model(),
      prompt: `Corrige la grammaire, l'orthographe, la ponctuation et la mise en forme du CV suivant. Garde le même contenu et la même langue. Renvoie uniquement le CV corrigé.\n\n${data.text}`,
    });
    return { text: corrected };
  });

export const aiTranslateCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { text: string; target: "fr" | "en" }) =>
    z.object({ text: z.string().min(10).max(20000), target: z.enum(["fr", "en"]) }).parse(i))
  .handler(async ({ data }) => {
    const lang = data.target === "fr" ? "français" : "anglais";
    const { text } = await generateText({
      model: model(),
      prompt: `Traduis ce CV en ${lang}. Conserve la mise en forme. Renvoie uniquement la traduction.\n\n${data.text}`,
    });
    return { text };
  });

export const aiMatchCvToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { cv: string; job: string }) =>
    z.object({ cv: z.string().min(1).max(20000), job: z.string().min(1).max(10000) }).parse(i))
  .handler(async ({ data }) => {
    const { output } = await generateText({
      model: model(),
      output: Output.object({
        schema: z.object({ score: z.number().min(0).max(100), reason: z.string() }),
      }),
      prompt: `Analyse la compatibilité entre ce CV et cette offre d'emploi. Score 0-100.\n\nCV:\n${data.cv}\n\nOffre:\n${data.job}`,
    });
    return output;
  });
