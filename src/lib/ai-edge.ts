import { supabase } from "@/integrations/supabase/client";

async function invokeAiCv<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-cv", { body });
  if (error) throw new Error(error.message);
  return data as T;
}

export function correctCvWithAi(text: string) {
  return invokeAiCv<{ text: string }>({ action: "correct", text });
}

export function translateCvWithAi(text: string, target: "fr" | "en") {
  return invokeAiCv<{ text: string }>({ action: "translate", text, target });
}

export function matchCvToJobWithAi(cv: string, job: string) {
  return invokeAiCv<{ score: number; reason: string }>({ action: "match", cv, job });
}
