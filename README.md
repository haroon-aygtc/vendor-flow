# AI Orchestration Platform - Production Setup

## 🗄️ **PostgreSQL Database Setup**

### **1. Database Creation**
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE ai_orchestration;
\c ai_orchestration;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **2. Environment Configuration**
Set your `DATABASE_URL` environment variable:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/ai_orchestration
```

### **3. Run Migrations**
```bash
# Generate migration files
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Optional: Open Drizzle Studio to view database
npm run db:studio
```

## 📊 **Database Schema**

### **Core Tables:**
- **`ai_providers`** - Store AI provider configurations (OpenAI, Claude, etc.)
- **`ai_models`** - Available models for each provider
- **`agents`** - Configured AI agents with prompts and settings
- **`agent_executions`** - Execution logs and performance metrics
- **`workflows`** - Workflow definitions and React Flow data
- **`documents`** - Document storage and processing status
- **`audit_logs`** - Complete audit trail of all actions

### **Key Features:**
- ✅ **Real PostgreSQL integration** with Drizzle ORM
- ✅ **Production-grade schema** with proper indexes
- ✅ **Audit logging** for all operations
- ✅ **Performance tracking** with execution metrics
- ✅ **Data persistence** for all configurations

## 🔧 **Production Commands**

```bash
# Database operations
npm run db:generate    # Generate new migrations
npm run db:migrate     # Apply migrations
npm run db:push        # Push schema changes (dev only)
npm run db:studio      # Open database GUI

# Application
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
```

## 🚀 **Real AI Provider Integration**

### **Supported Providers:**
- **OpenAI** - GPT-4, GPT-3.5-turbo with real API calls
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Haiku
- **Google AI** - Gemini 1.5 Pro, Gemini 1.5 Flash  
- **Groq** - Llama 3.1 70B, Mixtral 8x7B (ultra-fast inference)
- **OpenRouter** - Access to 100+ models

### **Production Features:**
- ✅ **Real API connections** - No mocks or simulations
- ✅ **Database persistence** - All data stored in PostgreSQL
- ✅ **Error handling** - Comprehensive error management
- ✅ **Audit trails** - Complete logging of all operations
- ✅ **Performance metrics** - Token usage and execution tracking

## 📋 **Pre-Presentation Checklist**

1. **✅ Database Setup**
   - PostgreSQL running and accessible
   - Database created and migrations applied
   - Environment variables configured

2. **✅ AI Provider Keys**
   - Real API keys added to environment
   - Provider connections tested
   - Models loaded and available

3. **✅ Application Testing**
   - Create test provider connection
   - Create test agent
   - Send test message and verify response
   - Check database for stored data

## 🎯 **Demo Flow for Presentation**

1. **Show Provider Management**
   - Add real AI provider (OpenAI/Claude)
   - Test connection with live API call
   - Show models loaded from provider

2. **Create Agent**
   - Configure agent with real provider
   - Set system prompt and parameters
   - Save to database

3. **Test Agent**
   - Send test message
   - Show real AI response
   - Display execution metrics

4. **Show Database**
   - Open Drizzle Studio
   - Show stored providers, agents, executions
   - Demonstrate audit logging

**Everything is production-ready with real integrations!** 🚀