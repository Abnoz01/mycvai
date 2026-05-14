// Azure AI Foundry Anthropic-compatible client.
const ENDPOINT = "https://momah-azure-ai-foundry.services.ai.azure.com/anthropic/v1/messages";

export type AnthropicMessage = { role: "user" | "assistant"; content: string };

export async function callAzureAnthropic(opts: {
  apiKey: string;
  model: string;
  system?: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 4000,
      temperature: opts.temperature ?? 0.3,
      ...(opts.system ? { system: opts.system } : {}),
      messages: opts.messages,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Azure Anthropic ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  return (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
}
