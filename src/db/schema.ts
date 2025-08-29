import { pgTable, text, timestamp, integer, boolean, decimal, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login'),
});

// Password resets table
export const passwordResets = pgTable('password_resets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// AI Agents table
export const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  provider: text('provider').notNull().references(() => aiProviders.id, { onDelete: 'cascade' }),
  model: text('model').notNull().references(() => aiModels.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['active', 'inactive', 'error'] }).notNull().default('active'),
  totalRuns: integer('total_runs').notNull().default(0),
  successfulRuns: integer('successful_runs').notNull().default(0),
  lastRun: timestamp('last_run'), 
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// AI Models table

export const aiModels = pgTable('ai_models', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  provider: text('provider').notNull().references(() => aiProviders.id, { onDelete: 'cascade' }),
});

// Workflows table
export const workflows = pgTable('workflows', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  nodes: jsonb('nodes').notNull(),
  edges: jsonb('edges').notNull(),
  status: text('status', { enum: ['draft', 'active', 'paused', 'error'] }).notNull().default('draft'),
  executionCount: integer('execution_count').notNull().default(0),
  lastExecuted: timestamp('last_executed'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Documents table
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  status: text('status', { enum: ['uploaded', 'processing', 'completed', 'error'] }).notNull().default('uploaded'),
  extractedData: jsonb('extracted_data'),
  processingResults: jsonb('processing_results'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Activities table
export const activities = pgTable('activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  message: text('message').notNull(),
  status: text('status', { enum: ['success', 'warning', 'error', 'info'] }).notNull().default('info'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// AI Providers table
export const aiProviders = pgTable('ai_providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  apiKey: text('api_key').notNull(),
  endpoint: text('endpoint'),
  model: text('model'),
  isActive: boolean('is_active').notNull().default(true),
  rateLimitRpm: integer('rate_limit_rpm'),
  rateLimitTpm: integer('rate_limit_tpm'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Vendors table
export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  rating: decimal('rating', { precision: 3, scale: 2 }).notNull(),
  onTimeDelivery: decimal('on_time_delivery', { precision: 5, scale: 2 }).notNull(),
  qualityScore: decimal('quality_score', { precision: 5, scale: 2 }).notNull(),
  avgPriceVsMarket: decimal('avg_price_vs_market', { precision: 5, scale: 2 }).notNull(),
  completedOrders: integer('completed_orders').notNull().default(0),
  performanceTrend: text('performance_trend', { enum: ['improving', 'stable', 'declining'] }).notNull().default('stable'),
  contactInfo: jsonb('contact_info'),
  capabilities: jsonb('capabilities'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Procurement requests table
export const procurementRequests = pgTable('procurement_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  deadline: timestamp('deadline'),
  status: text('status', { enum: ['draft', 'published', 'in_review', 'completed', 'cancelled'] }).notNull().default('draft'),
  requirements: jsonb('requirements'),
  selectedVendorId: text('selected_vendor_id').references(() => vendors.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Vendor proposals table
export const vendorProposals = pgTable('vendor_proposals', {
  id: text('id').primaryKey(),
  procurementRequestId: text('procurement_request_id').notNull().references(() => procurementRequests.id, { onDelete: 'cascade' }),
  vendorId: text('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  proposedPrice: decimal('proposed_price', { precision: 10, scale: 2 }).notNull(),
  deliveryTime: integer('delivery_time').notNull(), // in days
  proposal: text('proposal').notNull(),
  attachments: jsonb('attachments'),
  aiScore: decimal('ai_score', { precision: 5, scale: 2 }),
  aiAnalysis: jsonb('ai_analysis'),
  status: text('status', { enum: ['submitted', 'under_review', 'accepted', 'rejected'] }).notNull().default('submitted'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


// Agent Executions table
export const agentExecutions = pgTable('agent_executions', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull().default('pending'),
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'),
  tokenUsage: jsonb('token_usage'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


// Activity Feed table
export const activityFeed = pgTable('activity_feed', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  message: text('message').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});