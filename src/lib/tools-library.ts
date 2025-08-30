import { nanoid } from 'nanoid';

export interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'api' | 'webhook' | 'integration' | 'utility' | 'ai-model';
  configuration: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'password';
      label: string;
      required: boolean;
      placeholder?: string;
      options?: string[];
      description?: string;
    };
  };
  capabilities: string[];
  tags: string[];
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  documentation?: string;
  examples?: Array<{
    title: string;
    description: string;
    code: string;
  }>;
}

export const TOOLS_LIBRARY: ToolTemplate[] = [
  {
    id: 'openai-gpt',
    name: 'OpenAI GPT',
    description: 'Access OpenAI GPT models for text generation and completion',
    category: 'AI Models',
    type: 'ai-model',
    configuration: {
      apiKey: {
        type: 'password',
        label: 'API Key',
        required: true,
        placeholder: 'sk-...',
        description: 'Your OpenAI API key'
      },
      model: {
        type: 'select',
        label: 'Model',
        required: true,
        options: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
        description: 'Choose the GPT model to use'
      },
      temperature: {
        type: 'number',
        label: 'Temperature',
        required: false,
        placeholder: '0.7',
        description: 'Controls randomness (0-2)'
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        required: false,
        placeholder: '2048',
        description: 'Maximum tokens in response'
      }
    },
    capabilities: ['text-generation', 'completion', 'chat', 'analysis'],
    tags: ['openai', 'gpt', 'llm', 'text-generation'],
    icon: '🤖',
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes',
    documentation: 'https://platform.openai.com/docs/api-reference',
    examples: [
      {
        title: 'Basic Text Generation',
        description: 'Generate text based on a prompt',
        code: `const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Write a summary about AI" }],
  temperature: 0.7
});`
      }
    ]
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    description: 'Access Claude AI models for advanced reasoning and analysis',
    category: 'AI Models',
    type: 'ai-model',
    configuration: {
      apiKey: {
        type: 'password',
        label: 'API Key',
        required: true,
        placeholder: 'sk-ant-...',
        description: 'Your Anthropic API key'
      },
      model: {
        type: 'select',
        label: 'Model',
        required: true,
        options: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        description: 'Choose the Claude model to use'
      },
      maxTokens: {
        type: 'number',
        label: 'Max Tokens',
        required: false,
        placeholder: '4096',
        description: 'Maximum tokens in response'
      }
    },
    capabilities: ['reasoning', 'analysis', 'coding', 'writing'],
    tags: ['anthropic', 'claude', 'llm', 'reasoning'],
    icon: '🧠',
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes'
  },
  {
    id: 'slack-integration',
    name: 'Slack Integration',
    description: 'Send notifications and messages to Slack channels',
    category: 'Communication',
    type: 'integration',
    configuration: {
      botToken: {
        type: 'password',
        label: 'Bot Token',
        required: true,
        placeholder: 'xoxb-...',
        description: 'Slack Bot User OAuth Token'
      },
      defaultChannel: {
        type: 'string',
        label: 'Default Channel',
        required: false,
        placeholder: '#general',
        description: 'Default channel for notifications'
      },
      username: {
        type: 'string',
        label: 'Bot Username',
        required: false,
        placeholder: 'AI Assistant',
        description: 'Display name for the bot'
      }
    },
    capabilities: ['messaging', 'notifications', 'file-sharing', 'channel-management'],
    tags: ['slack', 'communication', 'notifications', 'team'],
    icon: '💬',
    difficulty: 'intermediate',
    estimatedSetupTime: '5 minutes'
  },
  {
    id: 'github-integration',
    name: 'GitHub Integration',
    description: 'Create issues, PRs, and manage repositories',
    category: 'Development',
    type: 'integration',
    configuration: {
      accessToken: {
        type: 'password',
        label: 'Personal Access Token',
        required: true,
        placeholder: 'ghp_...',
        description: 'GitHub Personal Access Token'
      },
      defaultRepo: {
        type: 'string',
        label: 'Default Repository',
        required: false,
        placeholder: 'owner/repo',
        description: 'Default repository for operations'
      }
    },
    capabilities: ['issue-creation', 'pr-management', 'repository-access', 'code-review'],
    tags: ['github', 'git', 'development', 'version-control'],
    icon: '🐙',
    difficulty: 'intermediate',
    estimatedSetupTime: '3 minutes'
  },
  {
    id: 'email-smtp',
    name: 'Email (SMTP)',
    description: 'Send emails via SMTP server',
    category: 'Communication',
    type: 'integration',
    configuration: {
      host: {
        type: 'string',
        label: 'SMTP Host',
        required: true,
        placeholder: 'smtp.gmail.com',
        description: 'SMTP server hostname'
      },
      port: {
        type: 'number',
        label: 'Port',
        required: true,
        placeholder: '587',
        description: 'SMTP server port'
      },
      username: {
        type: 'string',
        label: 'Username',
        required: true,
        placeholder: 'your-email@domain.com',
        description: 'SMTP username/email'
      },
      password: {
        type: 'password',
        label: 'Password',
        required: true,
        placeholder: 'app-password',
        description: 'SMTP password or app password'
      },
      fromName: {
        type: 'string',
        label: 'From Name',
        required: false,
        placeholder: 'AI Assistant',
        description: 'Display name for sent emails'
      }
    },
    capabilities: ['email-sending', 'notifications', 'reports', 'alerts'],
    tags: ['email', 'smtp', 'notifications', 'communication'],
    icon: '📧',
    difficulty: 'intermediate',
    estimatedSetupTime: '4 minutes'
  },
  {
    id: 'pdf-parser',
    name: 'PDF Parser',
    description: 'Extract text and data from PDF documents',
    category: 'Document Processing',
    type: 'utility',
    configuration: {
      extractImages: {
        type: 'boolean',
        label: 'Extract Images',
        required: false,
        description: 'Extract images from PDF files'
      },
      preserveLayout: {
        type: 'boolean',
        label: 'Preserve Layout',
        required: false,
        description: 'Maintain document layout structure'
      }
    },
    capabilities: ['text-extraction', 'metadata-extraction', 'image-extraction', 'structure-analysis'],
    tags: ['pdf', 'document', 'parsing', 'extraction'],
    icon: '📄',
    difficulty: 'beginner',
    estimatedSetupTime: '1 minute'
  },
  {
    id: 'csv-processor',
    name: 'CSV Processor',
    description: 'Parse and analyze CSV data files',
    category: 'Data Processing',
    type: 'utility',
    configuration: {
      delimiter: {
        type: 'select',
        label: 'Delimiter',
        required: false,
        options: [',', ';', '\t', '|'],
        description: 'CSV field delimiter'
      },
      hasHeader: {
        type: 'boolean',
        label: 'Has Header Row',
        required: false,
        description: 'First row contains column headers'
      },
      encoding: {
        type: 'select',
        label: 'Encoding',
        required: false,
        options: ['utf-8', 'latin1', 'ascii'],
        description: 'File encoding'
      }
    },
    capabilities: ['data-parsing', 'analysis', 'validation', 'transformation'],
    tags: ['csv', 'data', 'parsing', 'analysis'],
    icon: '📊',
    difficulty: 'beginner',
    estimatedSetupTime: '1 minute'
  },
  {
    id: 'webhook-receiver',
    name: 'Webhook Receiver',
    description: 'Receive and process incoming webhooks',
    category: 'Integration',
    type: 'webhook',
    configuration: {
      secret: {
        type: 'password',
        label: 'Webhook Secret',
        required: false,
        placeholder: 'whsec_...',
        description: 'Secret for webhook verification'
      },
      allowedOrigins: {
        type: 'textarea',
        label: 'Allowed Origins',
        required: false,
        placeholder: 'https://api.github.com\nhttps://hooks.slack.com',
        description: 'One origin per line'
      }
    },
    capabilities: ['webhook-processing', 'event-handling', 'data-validation', 'routing'],
    tags: ['webhook', 'api', 'integration', 'events'],
    icon: '🔗',
    difficulty: 'advanced',
    estimatedSetupTime: '10 minutes'
  },
  {
    id: 'zapier-integration',
    name: 'Zapier Integration',
    description: 'Connect to 5000+ apps via Zapier',
    category: 'Automation',
    type: 'integration',
    configuration: {
      apiKey: {
        type: 'password',
        label: 'Zapier API Key',
        required: true,
        placeholder: 'zap_...',
        description: 'Your Zapier API key'
      },
      webhookUrl: {
        type: 'string',
        label: 'Webhook URL',
        required: false,
        placeholder: 'https://hooks.zapier.com/hooks/catch/...',
        description: 'Zapier webhook URL for triggers'
      }
    },
    capabilities: ['automation', 'app-integration', 'workflow-triggers', 'data-sync'],
    tags: ['zapier', 'automation', 'integration', 'workflow'],
    icon: '⚡',
    difficulty: 'intermediate',
    estimatedSetupTime: '5 minutes'
  },
  {
    id: 'discord-bot',
    name: 'Discord Bot',
    description: 'Send messages and notifications to Discord',
    category: 'Communication',
    type: 'integration',
    configuration: {
      botToken: {
        type: 'password',
        label: 'Bot Token',
        required: true,
        placeholder: 'MTk4NjIyNDgzNDcxOTI1MjQ4...',
        description: 'Discord bot token'
      },
      defaultChannelId: {
        type: 'string',
        label: 'Default Channel ID',
        required: false,
        placeholder: '123456789012345678',
        description: 'Default channel for notifications'
      }
    },
    capabilities: ['messaging', 'notifications', 'server-management', 'user-interaction'],
    tags: ['discord', 'bot', 'communication', 'gaming'],
    icon: '🎮',
    difficulty: 'intermediate',
    estimatedSetupTime: '4 minutes'
  },
  {
    id: 'jira-integration',
    name: 'Jira Integration',
    description: 'Create and update Jira issues',
    category: 'Project Management',
    type: 'integration',
    configuration: {
      baseUrl: {
        type: 'string',
        label: 'Jira Base URL',
        required: true,
        placeholder: 'https://yourcompany.atlassian.net',
        description: 'Your Jira instance URL'
      },
      email: {
        type: 'string',
        label: 'Email',
        required: true,
        placeholder: 'user@company.com',
        description: 'Your Jira account email'
      },
      apiToken: {
        type: 'password',
        label: 'API Token',
        required: true,
        placeholder: 'ATATT3xFfGF0...',
        description: 'Jira API token'
      },
      defaultProject: {
        type: 'string',
        label: 'Default Project Key',
        required: false,
        placeholder: 'PROJ',
        description: 'Default project for issue creation'
      }
    },
    capabilities: ['issue-management', 'project-tracking', 'workflow-automation', 'reporting'],
    tags: ['jira', 'project-management', 'issues', 'atlassian'],
    icon: '📋',
    difficulty: 'advanced',
    estimatedSetupTime: '6 minutes'
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    category: 'Communication',
    type: 'integration',
    configuration: {
      webhookUrl: {
        type: 'string',
        label: 'Webhook URL',
        required: true,
        placeholder: 'https://outlook.office.com/webhook/...',
        description: 'Teams incoming webhook URL'
      },
      defaultTitle: {
        type: 'string',
        label: 'Default Title',
        required: false,
        placeholder: 'AI Assistant Notification',
        description: 'Default title for messages'
      }
    },
    capabilities: ['messaging', 'notifications', 'cards', 'mentions'],
    tags: ['teams', 'microsoft', 'communication', 'enterprise'],
    icon: '👥',
    difficulty: 'beginner',
    estimatedSetupTime: '3 minutes'
  },
  {
    id: 'rest-api-client',
    name: 'REST API Client',
    description: 'Make HTTP requests to any REST API',
    category: 'Integration',
    type: 'api',
    configuration: {
      baseUrl: {
        type: 'string',
        label: 'Base URL',
        required: true,
        placeholder: 'https://api.example.com',
        description: 'API base URL'
      },
      authType: {
        type: 'select',
        label: 'Authentication Type',
        required: false,
        options: ['none', 'bearer', 'basic', 'api-key'],
        description: 'Authentication method'
      },
      authToken: {
        type: 'password',
        label: 'Auth Token/Key',
        required: false,
        placeholder: 'Bearer token or API key',
        description: 'Authentication credentials'
      },
      defaultHeaders: {
        type: 'textarea',
        label: 'Default Headers',
        required: false,
        placeholder: 'Content-Type: application/json\nX-Custom-Header: value',
        description: 'Default headers (one per line)'
      }
    },
    capabilities: ['http-requests', 'api-integration', 'data-fetching', 'webhooks'],
    tags: ['api', 'http', 'rest', 'integration'],
    icon: '🔄',
    difficulty: 'advanced',
    estimatedSetupTime: '8 minutes'
  },
  {
    id: 'database-connector',
    name: 'Database Connector',
    description: 'Connect to SQL databases for data operations',
    category: 'Data Storage',
    type: 'integration',
    configuration: {
      type: {
        type: 'select',
        label: 'Database Type',
        required: true,
        options: ['postgresql', 'mysql', 'sqlite', 'mongodb'],
        description: 'Type of database'
      },
      connectionString: {
        type: 'password',
        label: 'Connection String',
        required: true,
        placeholder: 'postgresql://user:pass@host:port/db',
        description: 'Database connection string'
      },
      poolSize: {
        type: 'number',
        label: 'Connection Pool Size',
        required: false,
        placeholder: '10',
        description: 'Maximum number of connections'
      }
    },
    capabilities: ['data-storage', 'querying', 'transactions', 'migrations'],
    tags: ['database', 'sql', 'storage', 'data'],
    icon: '🗄️',
    difficulty: 'advanced',
    estimatedSetupTime: '10 minutes'
  }
];

export const TOOL_CATEGORIES = [
  'AI Models',
  'Communication',
  'Development',
  'Document Processing',
  'Data Processing',
  'Integration',
  'Automation',
  'Project Management',
  'Data Storage'
];

export function getToolsByCategory(category: string): ToolTemplate[] {
  return TOOLS_LIBRARY.filter(tool => tool.category === category);
}

export function searchTools(query: string): ToolTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return TOOLS_LIBRARY.filter(tool => 
    tool.name.toLowerCase().includes(lowercaseQuery) ||
    tool.description.toLowerCase().includes(lowercaseQuery) ||
    tool.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getToolById(id: string): ToolTemplate | undefined {
  return TOOLS_LIBRARY.find(tool => tool.id === id);
}

export function createToolInstance(template: ToolTemplate, configuration: Record<string, any>) {
  return {
    id: nanoid(),
    templateId: template.id,
    name: template.name,
    type: template.type,
    configuration,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function validateToolConfiguration(template: ToolTemplate, configuration: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key, config] of Object.entries(template.configuration)) {
    if (config.required && (!configuration[key] || configuration[key] === '')) {
      errors.push(`${config.label} is required`);
    }
    
    if (configuration[key] && config.type === 'number' && isNaN(Number(configuration[key]))) {
      errors.push(`${config.label} must be a valid number`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}