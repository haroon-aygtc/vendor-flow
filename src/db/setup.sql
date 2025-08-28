-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE ai_orchestration;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_providers_type ON ai_providers(type);
CREATE INDEX IF NOT EXISTS idx_ai_providers_status ON ai_providers(status);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_agents_provider_id ON agents(provider_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started_at ON agent_executions(started_at);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);