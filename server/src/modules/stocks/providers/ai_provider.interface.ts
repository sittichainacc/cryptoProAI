// ============================================================================
// AI Provider Abstraction Interface (Master Prompt Section 10)
// ============================================================================

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface AIGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
}

export interface AIStructuredResult<T> {
  data: T;
  rawResponse: string;
  modelUsed: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
}

export interface IAIProvider {
  readonly providerName: 'openai' | 'anthropic' | 'google' | 'local' | 'mock';

  generate(prompt: string, options?: AIGenerationOptions): Promise<string>;

  generateStructured<T>(
    prompt: string, 
    schema: Record<string, any>, 
    options?: AIGenerationOptions
  ): Promise<AIStructuredResult<T>>;

  analyzeDocument(
    documentText: string, 
    instructions: string, 
    options?: AIGenerationOptions
  ): Promise<string>;

  summarize(text: string, maxWords?: number, options?: AIGenerationOptions): Promise<string>;

  classify(text: string, categories: string[], options?: AIGenerationOptions): Promise<string>;

  reason(
    premises: string[], 
    question: string, 
    options?: AIGenerationOptions
  ): Promise<{ answer: string; chainOfThought?: string }>;
}
