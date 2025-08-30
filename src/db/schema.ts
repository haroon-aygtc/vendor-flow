import { pgTable, text, timestamp, integer, jsonb, boolean, decimal } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// AI Providers table
export const aiProviders = pgTable('ai_providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'openai', 'anthropic', 'azure', etc.
  configuration: jsonb('configuration').notNull(), // API keys, endpoints, etc.
  isActive: boolean('is_active').notNull().default(true),
  lastTested: timestamp('last_tested'),
  testStatus: text('test_status'), // 'success', 'failed', 'pending'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Agents table
export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  provider: text('provider').notNull().references(() => aiProviders.id),
  model: text('model').notNull(),
  configuration: jsonb('configuration').notNull().default({}),
  status: text('status').notNull().default('active'), // 'active', 'inactive', 'error'
  executionCount: integer('execution_count').notNull().default(0),
  avgExecutionTime: decimal('avg_execution_time'),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflows table
export const workflows = pgTable('workflows', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  nodes: jsonb('nodes').notNull().default([]),
  edges: jsonb('edges').notNull().default([]),
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'inactive'
  executionCount: integer('execution_count').notNull().default(0),
  avgExecutionTime: decimal('avg_execution_time'),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflow Executions table
export const workflowExecutions = pgTable('workflow_executions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  status: text('status').notNull(), // 'running', 'completed', 'failed', 'cancelled'
  input: jsonb('input').notNull(),
  output: jsonb('output'),
  executionTime: integer('execution_time'), // in milliseconds
  errorMessage: text('error_message'),
  nodeExecutions: jsonb('node_executions').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Documents table
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'pdf', 'csv', 'markdown', 'txt'
  size: integer('size').notNull(),
  content: text('content'),
  extractedData: jsonb('extracted_data'),
  processingStatus: text('processing_status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  storageUrl: text('storage_url'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Vendors table
export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  onTimeDelivery: decimal('on_time_delivery', { precision: 5, scale: 2 }).default('0'),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }).default('0'),
  avgPriceVsMarket: decimal('avg_price_vs_market', { precision: 5, scale: 2 }).default('0'),
  completedOrders: integer('completed_orders').default(0),
  performanceTrend: text('performance_trend').default('stable'), // 'improving', 'stable', 'declining'
  contactInfo: jsonb('contact_info').default({}),
  capabilities: jsonb('capabilities').default([]),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  complianceStatus: text('compliance_status').default('pending'), // 'compliant', 'non_compliant', 'pending'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Webhooks table
export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'slack', 'email', 'github', etc.
  configuration: jsonb('configuration').notNull(),
  events: jsonb('events').notNull().default([]), // Array of event types to listen for
  isActive: boolean('is_active').notNull().default(true),
  secret: text('secret'),
  lastTriggered: timestamp('last_triggered'),
  totalTriggers: integer('total_triggers').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Webhook Events table
export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'processed', 'failed'
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Activities table (for audit log)
export const activities = pgTable('activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'agent_created', 'workflow_executed', etc.
  message: text('message').notNull(),
  status: text('status').notNull(), // 'success', 'warning', 'error'
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tool Instances table
export const toolInstances = pgTable('tool_instances', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  templateId: text('template_id').notNull(), // Reference to tool template
  name: text('name').notNull(),
  type: text('type').notNull(),
  configuration: jsonb('configuration').notNull(),
  status: text('status').notNull().default('active'),
  lastUsed: timestamp('last_used'),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Agent Tools relationship table
export const agentTools = pgTable('agent_tools', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  toolInstanceId: text('tool_instance_id').notNull().references(() => toolInstances.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Performance Metrics table
export const performanceMetrics = pgTable('performance_metrics', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(), // 'agent', 'workflow', 'provider'
  entityId: text('entity_id').notNull(),
  metricType: text('metric_type').notNull(), // 'execution_time', 'success_rate', 'cost'
  value: decimal('value', { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: jsonb('metadata').default({}),
});

// API Keys table (for secure storage)
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(), // Hashed API key
  permissions: jsonb('permissions').notNull().default([]),
  lastUsed: timestamp('last_used'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Export all tables for use in queries
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AIProvider = typeof aiProviders.$inferSelect;
export type NewAIProvider = typeof aiProviders.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;