import { nanoid } from 'nanoid';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'api' | 'webhook' | 'integration' | 'function';
  configuration: {
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    authentication?: {
      type: 'bearer' | 'api_key' | 'oauth' | 'basic';
      key?: string;
      value?: string;
    };
    parameters?: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'object';
      required: boolean;
      description: string;
      default?: any;
    }>;
  };
  inputSchema: any;
  outputSchema: any;
  examples: Array<{
    input: any;
    output: any;
    description: string;
  }>;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  icon: string;
  isActive: boolean;
}

export const TOOLS_LIBRARY: ToolDefinition[] = [
  {
    id: 'slack-notification',
    name: 'Slack Notification',
    description: 'Send messages and notifications to Slack channels',
    category: 'Communication',
    type: 'webhook',
    configuration: {
      endpoint: 'https://hooks.slack.com/services/{workspace}/{channel}/{token}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      authentication: {
        type: 'bearer',
        key: 'Authorization',
        value: 'Bearer {slack_bot_token}'
      },
      parameters: [
        {
          name: 'channel',
          type: 'string',
          required: true,
          description: 'Slack channel ID or name',
          default: '#general'
        },
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Message content to send'
        },
        {
          name: 'username',
          type: 'string',
          required: false,
          description: 'Bot username for the message',
          default: 'AI Agent'
        },
        {
          name: 'icon_emoji',
          type: 'string',
          required: false,
          description: 'Emoji icon for the bot',
          default: ':robot_face:'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
        message: { type: 'string' },
        username: { type: 'string' },
        icon_emoji: { type: 'string' }
      },
      required: ['channel', 'message']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message_id: { type: 'string' },
        timestamp: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          channel: '#alerts',
          message: 'Document processing completed successfully',
          username: 'Document Processor',
          icon_emoji: ':page_facing_up:'
        },
        output: {
          success: true,
          message_id: 'msg_123456',
          timestamp: '2024-01-15T10:30:00Z'
        },
        description: 'Send a document processing completion notification'
      }
    ],
    tags: ['slack', 'notification', 'communication', 'webhook'],
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes',
    icon: '💬',
    isActive: true
  },
  {
    id: 'github-issue-creator',
    name: 'GitHub Issue Creator',
    description: 'Create and manage GitHub issues automatically',
    category: 'Development',
    type: 'api',
    configuration: {
      endpoint: 'https://api.github.com/repos/{owner}/{repo}/issues',
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Agent-Platform'
      },
      authentication: {
        type: 'bearer',
        key: 'Authorization',
        value: 'token {github_token}'
      },
      parameters: [
        {
          name: 'owner',
          type: 'string',
          required: true,
          description: 'GitHub repository owner'
        },
        {
          name: 'repo',
          type: 'string',
          required: true,
          description: 'GitHub repository name'
        },
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Issue title'
        },
        {
          name: 'body',
          type: 'string',
          required: false,
          description: 'Issue description'
        },
        {
          name: 'labels',
          type: 'object',
          required: false,
          description: 'Array of label names'
        },
        {
          name: 'assignees',
          type: 'object',
          required: false,
          description: 'Array of GitHub usernames to assign'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
        assignees: { type: 'array', items: { type: 'string' } }
      },
      required: ['owner', 'repo', 'title']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        issue_number: { type: 'number' },
        issue_url: { type: 'string' },
        created_at: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          owner: 'mycompany',
          repo: 'myproject',
          title: 'Bug: Login form validation error',
          body: 'Users are experiencing validation errors when submitting the login form with special characters.',
          labels: ['bug', 'frontend', 'high-priority'],
          assignees: ['developer1']
        },
        output: {
          success: true,
          issue_number: 42,
          issue_url: 'https://github.com/mycompany/myproject/issues/42',
          created_at: '2024-01-15T10:30:00Z'
        },
        description: 'Create a bug report issue with labels and assignee'
      }
    ],
    tags: ['github', 'issues', 'development', 'api'],
    difficulty: 'intermediate',
    estimatedSetupTime: '3 minutes',
    icon: '🐙',
    isActive: true
  },
  {
    id: 'email-sender',
    name: 'Email Sender (SMTP)',
    description: 'Send emails via SMTP for notifications and reports',
    category: 'Communication',
    type: 'integration',
    configuration: {
      endpoint: 'smtp://{smtp_host}:{smtp_port}',
      authentication: {
        type: 'basic',
        key: 'username',
        value: '{smtp_username}'
      },
      parameters: [
        {
          name: 'smtp_host',
          type: 'string',
          required: true,
          description: 'SMTP server hostname'
        },
        {
          name: 'smtp_port',
          type: 'number',
          required: true,
          description: 'SMTP server port',
          default: 587
        },
        {
          name: 'from_email',
          type: 'string',
          required: true,
          description: 'Sender email address'
        },
        {
          name: 'to_email',
          type: 'string',
          required: true,
          description: 'Recipient email address'
        },
        {
          name: 'subject',
          type: 'string',
          required: true,
          description: 'Email subject line'
        },
        {
          name: 'body',
          type: 'string',
          required: true,
          description: 'Email body content'
        },
        {
          name: 'html',
          type: 'boolean',
          required: false,
          description: 'Whether body is HTML formatted',
          default: false
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        from_email: { type: 'string', format: 'email' },
        to_email: { type: 'string', format: 'email' },
        subject: { type: 'string' },
        body: { type: 'string' },
        html: { type: 'boolean' }
      },
      required: ['from_email', 'to_email', 'subject', 'body']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message_id: { type: 'string' },
        sent_at: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          from_email: 'noreply@company.com',
          to_email: 'admin@company.com',
          subject: 'Daily Processing Report',
          body: 'Today processed 150 documents with 98% success rate.',
          html: false
        },
        output: {
          success: true,
          message_id: 'msg_abc123',
          sent_at: '2024-01-15T10:30:00Z'
        },
        description: 'Send a daily report email'
      }
    ],
    tags: ['email', 'smtp', 'notification', 'reports'],
    difficulty: 'intermediate',
    estimatedSetupTime: '4 minutes',
    icon: '📧',
    isActive: true
  },
  {
    id: 'teams-notification',
    name: 'Microsoft Teams Notification',
    description: 'Send messages to Microsoft Teams channels',
    category: 'Communication',
    type: 'webhook',
    configuration: {
      endpoint: 'https://outlook.office.com/webhook/{webhook_id}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      parameters: [
        {
          name: 'webhook_url',
          type: 'string',
          required: true,
          description: 'Teams webhook URL'
        },
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Message title'
        },
        {
          name: 'text',
          type: 'string',
          required: true,
          description: 'Message content'
        },
        {
          name: 'color',
          type: 'string',
          required: false,
          description: 'Message color theme',
          default: 'good'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        text: { type: 'string' },
        color: { type: 'string', enum: ['good', 'warning', 'attention'] }
      },
      required: ['title', 'text']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message_id: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          title: 'Workflow Completed',
          text: 'The document processing workflow has completed successfully.',
          color: 'good'
        },
        output: {
          success: true,
          message_id: 'teams_msg_123'
        },
        description: 'Send a success notification to Teams'
      }
    ],
    tags: ['teams', 'microsoft', 'notification', 'webhook'],
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes',
    icon: '📊',
    isActive: true
  },
  {
    id: 'zapier-trigger',
    name: 'Zapier Integration',
    description: 'Trigger Zapier workflows and connect to 5000+ apps',
    category: 'Automation',
    type: 'webhook',
    configuration: {
      endpoint: 'https://hooks.zapier.com/hooks/catch/{zapier_hook_id}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      parameters: [
        {
          name: 'hook_url',
          type: 'string',
          required: true,
          description: 'Zapier webhook URL'
        },
        {
          name: 'event_type',
          type: 'string',
          required: true,
          description: 'Type of event being triggered'
        },
        {
          name: 'data',
          type: 'object',
          required: true,
          description: 'Event data payload'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        event_type: { type: 'string' },
        data: { type: 'object' }
      },
      required: ['event_type', 'data']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        zapier_id: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          event_type: 'document_processed',
          data: {
            document_name: 'contract.pdf',
            status: 'completed',
            insights: ['Key terms identified', 'Compliance verified']
          }
        },
        output: {
          success: true,
          zapier_id: 'zap_abc123'
        },
        description: 'Trigger a Zapier workflow when document processing completes'
      }
    ],
    tags: ['zapier', 'automation', 'integration', 'webhook'],
    difficulty: 'intermediate',
    estimatedSetupTime: '3 minutes',
    icon: '⚡',
    isActive: true
  },
  {
    id: 'rest-api-caller',
    name: 'Custom REST API',
    description: 'Call any HTTP endpoint with custom configuration',
    category: 'Integration',
    type: 'api',
    configuration: {
      endpoint: '{custom_endpoint}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      authentication: {
        type: 'api_key',
        key: 'X-API-Key',
        value: '{api_key}'
      },
      parameters: [
        {
          name: 'endpoint_url',
          type: 'string',
          required: true,
          description: 'Full API endpoint URL'
        },
        {
          name: 'method',
          type: 'string',
          required: true,
          description: 'HTTP method',
          default: 'POST'
        },
        {
          name: 'payload',
          type: 'object',
          required: false,
          description: 'Request payload data'
        },
        {
          name: 'headers',
          type: 'object',
          required: false,
          description: 'Additional headers'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        endpoint_url: { type: 'string', format: 'uri' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
        payload: { type: 'object' },
        headers: { type: 'object' }
      },
      required: ['endpoint_url', 'method']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status_code: { type: 'number' },
        response_data: { type: 'object' }
      }
    },
    examples: [
      {
        input: {
          endpoint_url: 'https://api.example.com/webhooks/process',
          method: 'POST',
          payload: {
            event: 'workflow_completed',
            data: { workflow_id: '123', status: 'success' }
          }
        },
        output: {
          success: true,
          status_code: 200,
          response_data: { message: 'Webhook received' }
        },
        description: 'Send workflow completion data to external API'
      }
    ],
    tags: ['api', 'rest', 'http', 'custom', 'integration'],
    difficulty: 'advanced',
    estimatedSetupTime: '5 minutes',
    icon: '🔄',
    isActive: true
  },
  {
    id: 'discord-notification',
    name: 'Discord Bot Notification',
    description: 'Send messages to Discord channels via bot',
    category: 'Communication',
    type: 'webhook',
    configuration: {
      endpoint: 'https://discord.com/api/webhooks/{webhook_id}/{webhook_token}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      parameters: [
        {
          name: 'webhook_url',
          type: 'string',
          required: true,
          description: 'Discord webhook URL'
        },
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Message content'
        },
        {
          name: 'username',
          type: 'string',
          required: false,
          description: 'Bot username override',
          default: 'AI Agent'
        },
        {
          name: 'avatar_url',
          type: 'string',
          required: false,
          description: 'Bot avatar URL'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        username: { type: 'string' },
        avatar_url: { type: 'string', format: 'uri' }
      },
      required: ['content']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message_id: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          content: '🤖 AI Agent has completed processing 50 documents with 96% accuracy!',
          username: 'Document Processor',
          avatar_url: 'https://example.com/bot-avatar.png'
        },
        output: {
          success: true,
          message_id: 'discord_msg_456'
        },
        description: 'Send processing completion notification to Discord'
      }
    ],
    tags: ['discord', 'notification', 'bot', 'webhook'],
    difficulty: 'beginner',
    estimatedSetupTime: '2 minutes',
    icon: '📱',
    isActive: true
  },
  {
    id: 'jira-issue-creator',
    name: 'Jira Issue Creator',
    description: 'Create and update Jira issues automatically',
    category: 'Project Management',
    type: 'api',
    configuration: {
      endpoint: 'https://{domain}.atlassian.net/rest/api/3/issue',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      authentication: {
        type: 'basic',
        key: 'Authorization',
        value: 'Basic {base64_credentials}'
      },
      parameters: [
        {
          name: 'domain',
          type: 'string',
          required: true,
          description: 'Jira domain (subdomain.atlassian.net)'
        },
        {
          name: 'project_key',
          type: 'string',
          required: true,
          description: 'Jira project key'
        },
        {
          name: 'issue_type',
          type: 'string',
          required: true,
          description: 'Issue type (Bug, Task, Story, etc.)',
          default: 'Task'
        },
        {
          name: 'summary',
          type: 'string',
          required: true,
          description: 'Issue summary/title'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Issue description'
        },
        {
          name: 'priority',
          type: 'string',
          required: false,
          description: 'Issue priority',
          default: 'Medium'
        }
      ]
    },
    inputSchema: {
      type: 'object',
      properties: {
        project_key: { type: 'string' },
        issue_type: { type: 'string' },
        summary: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string' }
      },
      required: ['project_key', 'issue_type', 'summary']
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        issue_key: { type: 'string' },
        issue_url: { type: 'string' }
      }
    },
    examples: [
      {
        input: {
          project_key: 'PROJ',
          issue_type: 'Bug',
          summary: 'Document processing failure for PDF files',
          description: 'AI agent is failing to process PDF files larger than 5MB',
          priority: 'High'
        },
        output: {
          success: true,
          issue_key: 'PROJ-123',
          issue_url: 'https://company.atlassian.net/browse/PROJ-123'
        },
        description: 'Create a bug report in Jira'
      }
    ],
    tags: ['jira', 'issues', 'project-management', 'api'],
    difficulty: 'intermediate',
    estimatedSetupTime: '4 minutes',
    icon: '📋',
    isActive: true
  }
];

export const TOOL_CATEGORIES = [
  'Communication',
  'Development',
  'Automation',
  'Integration',
  'Project Management',
  'Analytics',
  'Security',
  'Data Processing'
];

export function getToolsByCategory(category: string): ToolDefinition[] {
  return TOOLS_LIBRARY.filter(tool => tool.category === category);
}

export function searchTools(query: string): ToolDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return TOOLS_LIBRARY.filter(tool => 
    tool.name.toLowerCase().includes(lowercaseQuery) ||
    tool.description.toLowerCase().includes(lowercaseQuery) ||
    tool.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS_LIBRARY.find(tool => tool.id === id);
}

export function getActiveTools(): ToolDefinition[] {
  return TOOLS_LIBRARY.filter(tool => tool.isActive);
}