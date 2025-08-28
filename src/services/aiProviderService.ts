import { AIProvider, AIModel, ChatRequest, ChatResponse, ProviderError } from '@/types/providers';

export class AIProviderService {
  private providers: Map<string, AIProvider> = new Map();

  // OpenAI Provider
  async createOpenAIProvider(apiKey: string, baseUrl?: string): Promise<AIProvider> {
    const provider: AIProvider = {
      id: 'openai-' + Date.now(),
      name: 'OpenAI',
      type: 'openai',
      apiKey,
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      models: [],
      status: 'disconnected'
    };

    try {
      const models = await this.fetchOpenAIModels(provider);
      provider.models = models;
      provider.status = 'connected';
    } catch (error) {
      provider.status = 'error';
      throw new Error(`Failed to connect to OpenAI: ${error}`);
    }

    this.providers.set(provider.id, provider);
    return provider;
  }

  // Anthropic Provider
  async createAnthropicProvider(apiKey: string): Promise<AIProvider> {
    const provider: AIProvider = {
      id: 'anthropic-' + Date.now(),
      name: 'Anthropic',
      type: 'anthropic',
      apiKey,
      baseUrl: 'https://api.anthropic.com',
      models: [
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          type: 'chat',
          contextLength: 200000,
          capabilities: ['text', 'reasoning', 'code', 'analysis']
        },
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          provider: 'anthropic',
          type: 'chat',
          contextLength: 200000,
          capabilities: ['text', 'fast-response']
        }
      ],
      status: 'disconnected'
    };

    try {
      await this.testAnthropicConnection(provider);
      provider.status = 'connected';
    } catch (error) {
      provider.status = 'error';
      throw new Error(`Failed to connect to Anthropic: ${error}`);
    }

    this.providers.set(provider.id, provider);
    return provider;
  }

  // Google AI Provider
  async createGoogleProvider(apiKey: string): Promise<AIProvider> {
    const provider: AIProvider = {
      id: 'google-' + Date.now(),
      name: 'Google AI',
      type: 'google',
      apiKey,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: [
        {
          id: 'gemini-1.5-pro',
          name: 'Gemini 1.5 Pro',
          provider: 'google',
          type: 'chat',
          contextLength: 2000000,
          capabilities: ['text', 'multimodal', 'code', 'reasoning']
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash',
          provider: 'google',
          type: 'chat',
          contextLength: 1000000,
          capabilities: ['text', 'fast-response', 'multimodal']
        }
      ],
      status: 'disconnected'
    };

    try {
      await this.testGoogleConnection(provider);
      provider.status = 'connected';
    } catch (error) {
      provider.status = 'error';
      throw new Error(`Failed to connect to Google AI: ${error}`);
    }

    this.providers.set(provider.id, provider);
    return provider;
  }

  // Groq Provider
  async createGroqProvider(apiKey: string): Promise<AIProvider> {
    const provider: AIProvider = {
      id: 'groq-' + Date.now(),
      name: 'Groq',
      type: 'groq',
      apiKey,
      baseUrl: 'https://api.groq.com/openai/v1',
      models: [
        {
          id: 'llama-3.1-70b-versatile',
          name: 'Llama 3.1 70B',
          provider: 'groq',
          type: 'chat',
          contextLength: 131072,
          capabilities: ['text', 'fast-inference', 'reasoning']
        },
        {
          id: 'mixtral-8x7b-32768',
          name: 'Mixtral 8x7B',
          provider: 'groq',
          type: 'chat',
          contextLength: 32768,
          capabilities: ['text', 'multilingual', 'code']
        }
      ],
      status: 'disconnected'
    };

    try {
      await this.testGroqConnection(provider);
      provider.status = 'connected';
    } catch (error) {
      provider.status = 'error';
      throw new Error(`Failed to connect to Groq: ${error}`);
    }

    this.providers.set(provider.id, provider);
    return provider;
  }

  // OpenRouter Provider
  async createOpenRouterProvider(apiKey: string): Promise<AIProvider> {
    const provider: AIProvider = {
      id: 'openrouter-' + Date.now(),
      name: 'OpenRouter',
      type: 'openrouter',
      apiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      models: [],
      status: 'disconnected'
    };

    try {
      const models = await this.fetchOpenRouterModels(provider);
      provider.models = models;
      provider.status = 'connected';
    } catch (error) {
      provider.status = 'error';
      throw new Error(`Failed to connect to OpenRouter: ${error}`);
    }

    this.providers.set(provider.id, provider);
    return provider;
  }

  // Chat completion methods
  async sendChatRequest(providerId: string, request: ChatRequest): Promise<ChatResponse> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    switch (provider.type) {
      case 'openai':
      case 'groq':
        return this.sendOpenAICompatibleRequest(provider, request);
      case 'anthropic':
        return this.sendAnthropicRequest(provider, request);
      case 'google':
        return this.sendGoogleRequest(provider, request);
      case 'openrouter':
        return this.sendOpenRouterRequest(provider, request);
      default:
        throw new Error('Unsupported provider type');
    }
  }

  // Private methods for API calls
  private async fetchOpenAIModels(provider: AIProvider): Promise<AIModel[]> {
    const response = await fetch(`${provider.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: 'openai',
      type: 'chat',
      contextLength: this.getModelContextLength(model.id),
      capabilities: ['text', 'chat']
    }));
  }

  private async fetchOpenRouterModels(provider: AIProvider): Promise<AIModel[]> {
    const response = await fetch(`${provider.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.slice(0, 20).map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      provider: 'openrouter',
      type: 'chat',
      contextLength: model.context_length || 4096,
      capabilities: ['text', 'chat']
    }));
  }

  private async testAnthropicConnection(provider: AIProvider): Promise<void> {
    const response = await fetch(`${provider.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async testGoogleConnection(provider: AIProvider): Promise<void> {
    const response = await fetch(`${provider.baseUrl}/models/gemini-1.5-flash:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async testGroqConnection(provider: AIProvider): Promise<void> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async sendOpenAICompatibleRequest(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async sendAnthropicRequest(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
    const messages = request.messages.filter(m => m.role !== 'system');
    const systemMessage = request.messages.find(m => m.role === 'system')?.content;

    const response = await fetch(`${provider.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model,
        messages: messages,
        system: systemMessage,
        max_tokens: request.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      model: request.model,
      choices: [{
        message: {
          role: 'assistant',
          content: data.content[0].text
        },
        finishReason: data.stop_reason
      }],
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      }
    };
  }

  private async sendGoogleRequest(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
    const contents = request.messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`${provider.baseUrl}/models/${request.model}:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: Date.now().toString(),
      model: request.model,
      choices: [{
        message: {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text
        },
        finishReason: data.candidates[0].finishReason
      }],
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  private async sendOpenRouterRequest(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AI Orchestration Platform'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private getModelContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-4o': 128000,
      'gpt-3.5-turbo': 16385,
      'text-davinci-003': 4097
    };
    return contextLengths[modelId] || 4096;
  }

  // Public methods
  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  updateProvider(id: string, updates: Partial<AIProvider>): AIProvider | null {
    const provider = this.providers.get(id);
    if (!provider) return null;

    const updatedProvider = { ...provider, ...updates };
    this.providers.set(id, updatedProvider);
    return updatedProvider;
  }
}

export const aiProviderService = new AIProviderService();