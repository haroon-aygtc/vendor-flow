import { pgTable, uuid, varchar, text, timestamp, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// AI Providers table
export const aiProviders = pgTable('ai_providers', {
  id: uuid('id').primaryKey().default(createId()),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'openai', 'anthropic', 'google', 'groq', 'openrouter'
  apiKey: text('api_key').notNull(),
  baseUrl: text('base_url'),
  status: varchar('status', { length: 20 }).notNull().default('disconnected'), // 'connected', 'disconnected', 'error'
  config: jsonb('config'),
  rateLimits: jsonb('rate_limits'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI Models table
export const aiModels = pgTable('ai_models', {
  id: uuid('id').primaryKey().default(createId()),
  providerId: uuid('provider_id').references(() => aiProviders.id, { onDelete: 'cascade' }).notNull(),
  modelId: varchar('model_id', { length: 255 }).notNull(), // The actual model ID from provider
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'text', 'chat', 'embedding', 'image'
  contextLength: integer('context_length').notNull(),
  inputCost: decimal('input_cost', { precision: 10, scale: 8 }),
  outputCost: decimal('output_cost', { precision: 10, scale: 8 }),
  capabilities: jsonb('capabilities').notNull(), // Array of strings
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agents table
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().default(createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  providerId: uuid('provider_id').references(() => aiProviders.id, { onDelete: 'cascade' }).notNull(),
  modelId: uuid('model_id').references(() => aiModels.id, { onDelete: 'cascade' }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).default('0.7').notNull(),
  maxTokens: integer('max_tokens').default(1000).notNull(),
  status: varchar('status', { length: 20 }).default('inactive').notNull(), // 'active', 'inactive', 'running'
  totalRuns: integer('total_runs').default(0).notNull(),
  lastRunAt: timestamp('last_run_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflows table
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().default(createId()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  definition: jsonb('definition').notNull(), // React Flow nodes and edges
  status: varchar('status', { length: 20 }).default('draft').notNull(), // 'draft', 'active', 'inactive'
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Agent Executions table
export const agentExecutions = pgTable('agent_executions', {
  id: uuid('id').primaryKey().default(createId()),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'running', 'completed', 'failed'
  error: text('error'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // in milliseconds
  tokenUsage: jsonb('token_usage'), // { promptTokens, completionTokens, totalTokens }
});

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().default(createId()),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'pdf', 'csv', 'markdown', 'txt'
  size: integer('size').notNull(), // in bytes
  content: text('content'),
  metadata: jsonb('metadata'),
  processingStatus: varchar('processing_status', { length: 20 }).default('pending').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

// Document Processing Jobs table
export const documentProcessingJobs = pgTable('document_processing_jobs', {
  id: uuid('id').primaryKey().default(createId()),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  result: jsonb('result'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().default(createId()),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'agent', 'workflow', 'provider', etc.
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(), // 'create', 'update', 'delete', 'execute'
  details: jsonb('details'),
  userId: varchar('user_id', { length: 255 }), // For future user management
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export type AIProvider = typeof aiProviders.$inferSelect;
export type NewAIProvider = typeof aiProviders.$inferInsert;

export type AIModel = typeof aiModels.$inferSelect;
export type NewAIModel = typeof aiModels.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type AgentExecution = typeof agentExecutions.$inferSelect;
export type NewAgentExecution = typeof agentExecutions.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;
export type NewDocumentProcessingJob = typeof documentProcessingJobs.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;