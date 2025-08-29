import { db } from '@/db';
import { aiProviders, aiModels, agents, agentExecutions, activities } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { AIProvider, ChatRequest, ChatResponse } from '@/types/providers';
import { nanoid } from 'nanoid';

export class DatabaseAIProviderService {
  // Create AI Provider
  async createProvider(providerData: {
    name: string;
    type: 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter';
    apiKey: string;
    baseUrl?: string;
  }): Promise<AIProvider> {
    try {
      // Test connection first
      const testProvider = await this.testProviderConnection(providerData);

      // Insert provider into database
      const [provider] = await db.insert(aiProviders).values({
        id: nanoid(),
        name: providerData.name,
        type: providerData.type,
        apiKey: providerData.apiKey,
        endpoint: providerData.baseUrl,
        isActive: true,
        userId: 'system', // This should come from auth context
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Fetch and store models
      const models = await this.fetchProviderModels(provider);
      if (models.length > 0) {
        await db.insert(aiModels).values(
          models.map(model => ({
            id: nanoid(),
            provider: provider.id,
            modelId: model.id,
            name: model.name,
            type: model.type,
            contextLength: model.contextLength,
            capabilities: model.capabilities,
            userId: provider.userId,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
        );
      }

      // Log the action
      await this.logAction('provider', provider.id, 'create', { providerType: provider.type, userId: provider.userId });

      return this.convertToAIProvider(provider, models);
    } catch (error) {
      throw new Error(`Failed to create provider: ${error}`);
    }
  }

  // Get all providers
  async getProviders(): Promise<AIProvider[]> {
    const providersWithModels = await db
      .select()
      .from(aiProviders)
      .leftJoin(aiModels, eq(aiProviders.id, aiModels.provider))
      .orderBy(desc(aiProviders.createdAt));

    // Group models by provider
    const providerMap = new Map<string, { provider: any; models: any[] }>();

    for (const row of providersWithModels) {
      const providerId = row.ai_providers.id;
      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, { provider: row.ai_providers, models: [] });
      }
      if (row.ai_models) {
        providerMap.get(providerId)!.models.push(row.ai_models);
      }
    }

    return Array.from(providerMap.values()).map(({ provider, models }) =>
      this.convertToAIProvider(provider, models)
    );
  }

  // Get provider by ID
  async getProvider(id: string): Promise<AIProvider | null> {
    const result = await db
      .select()
      .from(aiProviders)
      .leftJoin(aiModels, eq(aiProviders.id, aiModels.provider))
      .where(eq(aiProviders.id, id));

    if (result.length === 0) return null;

    const provider = result[0].ai_providers;
    const models = result.filter(r => r.ai_models).map(r => r.ai_models!);

    return this.convertToAIProvider(provider, models);
  }

  // Update provider
  async updateProvider(id: string, updates: Partial<AIProvider>): Promise<AIProvider | null> {
    const [updatedProvider] = await db
      .update(aiProviders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(aiProviders.id, id))
      .returning();

    if (!updatedProvider) return null;

    await this.logAction('provider', id, 'update', updates);
    return this.getProvider(id);
  }

  // Delete provider
  async deleteProvider(id: string): Promise<boolean> {
    const result = await db.delete(aiProviders).where(eq(aiProviders.id, id));

    if (result.length > 0) {
      await this.logAction('provider', id, 'delete', {});
      return true;
    }
    return false;
  }

  // Create agent
  async createAgent(agentData: {
    name: string;
    description?: string;
    provider: string;
    model: string;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    userId: string;
  }) {
    const [agent] = await db.insert(agents).values({
      id: nanoid(),
      ...agentData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    await this.logAction('agent', agent.id, 'create', { name: agent.name });
    return agent;
  }

  // Get agents
  async getAgents() {
    return await db
      .select()
      .from(agents)
      .leftJoin(aiProviders, eq(agents.provider, aiProviders.id))
      .leftJoin(aiModels, eq(agents.model, aiModels.id))
      .orderBy(desc(agents.createdAt));
  }

  // Send chat request
  async sendChatRequest(agentId: string, request: ChatRequest): Promise<ChatResponse> {
    // Get agent details to find the provider
    const agentResult = await db.select()
      .from(agents)
      .leftJoin(aiProviders, eq(agents.provider, aiProviders.id))
      .where(eq(agents.id, agentId))
      .limit(1);

    if (agentResult.length === 0) {
      throw new Error('Agent not found');
    }

    const agent = agentResult[0].agents;
    const provider = agentResult[0].ai_providers;

    if (!provider) {
      throw new Error('Provider not found for agent');
    }

    const startTime = Date.now();
    let response: ChatResponse;
    let error: string | null = null;

    try {
      response = await this.makeAPICall(provider as AIProvider, request);

      // Log successful execution
      await db.insert(agentExecutions).values({
        id: nanoid(),
        agentId: agentId,
        userId: agent.userId || 'system',
        input: request,
        output: response,
        status: 'completed',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
        tokenUsage: response.usage,
      });

      return response;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';

      // Log failed execution
      await db.insert(agentExecutions).values({
        id: nanoid(),
        agentId: agentId,
        userId: agent.userId || 'system',
        input: request,
        status: 'failed',
        error,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        duration: Date.now() - startTime,
      });

      throw err;
    }
  }

  // Private helper methods
  private async testProviderConnection(providerData: any): Promise<boolean> {
    // Implementation depends on provider type
    switch (providerData.type) {
      case 'openai':
        return this.testOpenAIConnection(providerData);
      case 'anthropic':
        return this.testAnthropicConnection(providerData);
      case 'google':
        return this.testGoogleConnection(providerData);
      case 'groq':
        return this.testGroqConnection(providerData);
      case 'openrouter':
        return this.testOpenRouterConnection(providerData);
      default:
        throw new Error('Unsupported provider type');
    }
  }

  private async testOpenAIConnection(providerData: any): Promise<boolean> {
    const response = await fetch(`${providerData.baseUrl || 'https://api.openai.com/v1'}/models`, {
      headers: {
        'Authorization': `Bearer ${providerData.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  }

  private async testAnthropicConnection(providerData: any): Promise<boolean> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': providerData.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    return response.ok;
  }

  private async testGoogleConnection(providerData: any): Promise<boolean> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${providerData.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    return response.ok;
  }

  private async testGroqConnection(providerData: any): Promise<boolean> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerData.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });
    return response.ok;
  }

  private async testOpenRouterConnection(providerData: any): Promise<boolean> {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${providerData.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.ok;
  }

  private async fetchProviderModels(provider: any): Promise<any[]> {
    // Implementation to fetch models from each provider
    switch (provider.type) {
      case 'openai':
        return this.fetchOpenAIModels(provider);
      case 'anthropic':
        return this.getAnthropicModels();
      case 'google':
        return this.getGoogleModels();
      case 'groq':
        return this.getGroqModels();
      case 'openrouter':
        return this.fetchOpenRouterModels(provider);
      default:
        return [];
    }
  }

  private async fetchOpenAIModels(provider: any): Promise<any[]> {
    const response = await fetch(`${provider.baseUrl || 'https://api.openai.com/v1'}/models`, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      type: 'chat',
      contextLength: this.getModelContextLength(model.id),
      capabilities: ['text', 'chat']
    }));
  }

  private getAnthropicModels(): any[] {
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        type: 'chat',
        contextLength: 200000,
        capabilities: ['text', 'reasoning', 'code', 'analysis']
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        type: 'chat',
        contextLength: 200000,
        capabilities: ['text', 'fast-response']
      }
    ];
  }

  private getGoogleModels(): any[] {
    return [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        type: 'chat',
        contextLength: 2000000,
        capabilities: ['text', 'multimodal', 'code', 'reasoning']
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        type: 'chat',
        contextLength: 1000000,
        capabilities: ['text', 'fast-response', 'multimodal']
      }
    ];
  }

  private getGroqModels(): any[] {
    return [
      {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        type: 'chat',
        contextLength: 131072,
        capabilities: ['text', 'fast-inference', 'reasoning']
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        type: 'chat',
        contextLength: 32768,
        capabilities: ['text', 'multilingual', 'code']
      }
    ];
  }

  private async fetchOpenRouterModels(provider: any): Promise<any[]> {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();
    return data.data.slice(0, 20).map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      type: 'chat',
      contextLength: model.context_length || 4096,
      capabilities: ['text', 'chat']
    }));
  }

  private async makeAPICall(provider: AIProvider, request: ChatRequest): Promise<ChatResponse> {
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
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
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

  private convertToAIProvider(dbProvider: any, dbModels: any[]): AIProvider {
    return {
      id: dbProvider.id,
      name: dbProvider.name,
      type: dbProvider.type,
      apiKey: dbProvider.apiKey,
      baseUrl: dbProvider.baseUrl,
      status: dbProvider.status,
      models: dbModels.map(model => ({
        id: model.modelId,
        name: model.name,
        provider: dbProvider.type,
        type: model.type,
        contextLength: model.contextLength,
        capabilities: model.capabilities
      })),
      rateLimits: dbProvider.rateLimits,
      config: dbProvider.config
    };
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

  private async logAction(entityType: string, entityId: string, action: string, details: any) {
    await db.insert(activities).values({
      id: nanoid(),
      userId: 'system',
      type: entityType,
      message: action,
      status: 'success',
      metadata: details,
      createdAt: new Date(),
    });
  }
}

export const databaseAIProviderService = new DatabaseAIProviderService();