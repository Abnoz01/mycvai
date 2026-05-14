import { createClient } from "npm:@supabase/supabase-js@2.105.4";
import { z } from "npm:zod@3.24.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENDPOINT = "https://momah-azure-ai-foundry.services.ai.azure.com/anthropic/v1/messages";
const MODEL_ID = "claude-sonnet-4-6";

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("correct"), text: z.string().min(10).max(20000) }),
  z.object({ action: z.literal("translate"), text: z.string().min(10).max(20000), target: z.enum(["fr", "en"]) }),
  z.object({ action: z.literal("match"), cv: z.string().min(1).max(20000), job: z.string().min(1).max(10000) }),
]);

type AnthropicMessage = { role: "user" | "assistant"; content: string };

async function callAzureAnthropic(opts: {
  apiKey: string;
  system: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      max_tokens: opts.maxTokens ?? 4000,
      temperature: opts.temperature ?? 0.3,
      system: opts.system,
      messages: opts.messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Azure Anthropic ${res.status}: ${body.slice(0, 500)}`);
    throw new Error("AI service unavailable");
  }

  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? [])
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AZURE_ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!apiKey) throw new Error("Missing AZURE_ANTHROPIC_API_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase configuration");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
      console.error("Auth failed:", userError?.message);
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const input = RequestSchema.parse(await req.json());

    if (input.action === "correct") {
      const text = await callAzureAnthropic({
        apiKey,
        system: "Tu corriges la grammaire, l'orthographe, la ponctuation et la mise en forme du CV. Garde le contenu et la langue. Renvoie uniquement le CV corrigé.",
        messages: [{ role: "user", content: input.text }],
      });
      return Response.json({ text }, { headers: corsHeaders });
    }

    if (input.action === "translate") {
      const lang = input.target === "fr" ? "français" : "anglais";
      const text = await callAzureAnthropic({
        apiKey,
        system: `Traduis le CV en ${lang}. Conserve la mise en forme. Renvoie uniquement la traduction.`,
        messages: [{ role: "user", content: input.text }],
      });
      return Response.json({ text }, { headers: corsHeaders });
    }

    const raw = await callAzureAnthropic({
      apiKey,
      system: 'Analyse la compatibilité CV/offre. Renvoie STRICTEMENT un JSON: {"score": number 0-100, "reason": string}. Aucun texte avant ou après.',
      messages: [{ role: "user", content: `CV:\n${input.cv}\n\nOffre:\n${input.job}` }],
      temperature: 0.1,
    });
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : { score: 0, reason: raw };
    const result = z.object({ score: z.number().min(0).max(100), reason: z.string() }).parse(parsed);
    return Response.json(result, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message.startsWith("Missing") ? 500 : 400;
    console.error(message);
    return Response.json({ error: message }, { status, headers: corsHeaders });
  }
});
