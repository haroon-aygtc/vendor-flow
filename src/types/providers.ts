export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter';
  apiKey: string;
  baseUrl?: string;
  models: AIModel[];
  status: 'connected' | 'disconnected' | 'error';
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  config?: Record<string, any>;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'text' | 'chat' | 'embedding' | 'image';
  contextLength: number;
  inputCost?: number;
  outputCost?: number;
  capabilities: string[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  model: string;
  choices: {
    message: ChatMessage;
    finishReason: string;
  }[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProviderError {
  code: string;
  message: string;
  details?: any;
}