import { supabase } from "@/integrations/supabase/client";

async function invokeAiCv<T>(body: Record<string, unknown>): Promise<T> {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Votre session a expiré. Veuillez vous reconnecter.");

  const { data, error } = await supabase.functions.invoke("ai-cv", {
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) {
    const message = error.message.includes("401")
      ? "Votre session a expiré. Veuillez vous reconnecter."
      : error.message;
    throw new Error(message);
  }
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
