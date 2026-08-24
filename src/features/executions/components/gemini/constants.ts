export const AVAILABLE_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-3.6-flash",
] as const;

export type GeminiModel = typeof AVAILABLE_MODELS[number];