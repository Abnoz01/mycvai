import { createAnthropic } from "@ai-sdk/anthropic";

// Azure AI Foundry exposes an Anthropic-compatible endpoint.
// The provider appends `/v1/messages`, so baseURL must end with `/anthropic`.
export const createAzureAnthropicProvider = (apiKey: string) =>
  createAnthropic({
    baseURL: "https://momah-azure-ai-foundry.services.ai.azure.com/anthropic",
    apiKey,
    headers: {
      "anthropic-version": "2023-06-01",
    },
  });
