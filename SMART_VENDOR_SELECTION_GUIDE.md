# Smart Vendor Selection Tool - Professional User Guide

## 🎯 **System Overview**
The Smart Vendor Selection Tool is a production-grade AI-powered procurement automation system that analyzes vendor performance data and provides intelligent recommendations for procurement decisions.

## 🚀 **Getting Started**

### **Prerequisites**
1. **AI Provider Setup**: Configure at least one AI provider (OpenAI, Claude, Gemini, Groq, or OpenRouter)
2. **Vendor Data**: Import your vendor performance data via CSV
3. **Active AI Agent**: Create and activate an AI agent for analysis

### **Quick Start Guide**

#### **Step 1: Set Up AI Provider**
1. Navigate to the **"Providers"** tab in the main dashboard
2. Click **"Add Provider"** 
3. Select your AI provider type (OpenAI, Anthropic, Google, Groq, OpenRouter)
4. Enter your **real API key**
5. Test the connection to ensure it's working

#### **Step 2: Create AI Agent**
1. Go to the **"Agents"** tab
2. Click **"Create New Agent"**
3. Configure:
   - **Name**: Give your agent a descriptive name
   - **Provider**: Select your connected AI provider
   - **Model**: Choose the AI model to use
   - **System Prompt**: Use the default or customize for procurement analysis
   - **Temperature**: 0.7 recommended for balanced responses
4. Save and activate the agent

#### **Step 3: Import Vendor Data**
1. Navigate to **"Smart Procurement"** → **"Data Import"** tab
2. Prepare your CSV file with the required format:
   ```
   Vendor_ID,Vendor_Name,Category,Vendor_Rating,On_Time_Delivery_%,Quality_Score,Avg_Price_vs_Market,Completed_Orders,Performance_Trend
   ```
3. Upload your CSV file
4. Verify the data import was successful

#### **Step 4: Run AI Analysis**
1. Go to **"AI Analysis"** tab
2. Select your AI agent
3. Define procurement requirements:
   - **Category**: Select from available vendor categories
   - **Description**: Describe your specific needs
   - **Budget**: Enter your budget (optional)
   - **Urgency**: Choose priority level (affects scoring weights)
4. Click **"Run AI Analysis"**

#### **Step 5: Review Recommendations**
1. Check the **"Recommendations"** tab
2. Review the top 3 vendor recommendations
3. Analyze the AI reasoning and scoring
4. Make your procurement decision

## 📊 **Understanding the Scoring System**

### **Scoring Weights**
- **On-Time Delivery**: 40% (50% for high urgency)
- **Quality Score**: 30% (25% for high urgency)
- **Pricing**: 20% (40% for low urgency)
- **Vendor Rating**: 10%

### **Performance Trend Multipliers**
- **Improving**: +10% bonus
- **Stable**: No change
- **Declining**: -10% penalty

### **Urgency Impact**
- **High Urgency**: Prioritizes delivery speed and reliability
- **Medium Urgency**: Balanced approach
- **Low Urgency**: Prioritizes cost savings

## 📋 **CSV Data Format Requirements**

### **Required Columns**
1. **Vendor_ID**: Unique identifier (e.g., V001, V002)
2. **Vendor_Name**: Company name
3. **Category**: Product/service category
4. **Vendor_Rating**: 0-5 scale rating
5. **On_Time_Delivery_%**: Percentage (0-100)
6. **Quality_Score**: Percentage (0-100)
7. **Avg_Price_vs_Market**: Percentage (-100 to +100, negative is better)
8. **Completed_Orders**: Number of completed orders
9. **Performance_Trend**: "improving", "stable", or "declining"

### **Example CSV Data**
```csv
Vendor_ID,Vendor_Name,Category,Vendor_Rating,On_Time_Delivery_%,Quality_Score,Avg_Price_vs_Market,Completed_Orders,Performance_Trend
V001,TechSupply Corp,Electronics,4.5,95,92,-5,120,improving
V002,PackagePro Ltd,Packaging,4.2,88,89,2,90,stable
V003,MaterialsPlus Inc,Raw Materials,3.8,78,80,-10,75,declining
```

## 🔧 **Advanced Features**

### **AI Analysis Capabilities**
- **Multi-factor Analysis**: Considers delivery, quality, pricing, and ratings
- **Risk Assessment**: Identifies potential vendor risks
- **Trend Analysis**: Evaluates performance trajectories
- **Budget Compatibility**: Matches vendors to budget constraints
- **Custom Requirements**: Analyzes specific procurement needs

### **Data Management**
- **Persistent Storage**: Vendor data saved locally for future use
- **CSV Import/Export**: Easy data integration with ERP systems
- **Real-time Updates**: Dynamic scoring based on current data
- **Data Validation**: Automatic validation of imported data

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **"No AI Agents Found"**
- **Solution**: Create an AI agent in the "Agents" tab first
- Ensure the agent status is "Active"

#### **"No Vendors Found for Category"**
- **Solution**: Import vendor data or check category spelling
- Verify your CSV file has the correct format

#### **"AI Analysis Failed"**
- **Solution**: Check your AI provider connection
- Verify API key is valid and has sufficient credits
- Ensure internet connectivity

#### **CSV Import Errors**
- **Solution**: Check CSV format matches requirements exactly
- Ensure all required columns are present
- Verify data types (numbers for ratings, percentages, etc.)

### **Performance Tips**
1. **Use specific descriptions** in procurement requirements for better AI analysis
2. **Keep vendor data updated** for accurate recommendations
3. **Choose appropriate urgency levels** to get relevant scoring
4. **Review AI reasoning** to understand recommendation logic

## 📈 **Best Practices**

### **Data Quality**
- **Regular Updates**: Keep vendor performance data current
- **Accurate Metrics**: Ensure delivery and quality scores reflect reality
- **Complete Records**: Include all required fields for best results

### **AI Agent Configuration**
- **Descriptive Names**: Use clear agent names for easy identification
- **Appropriate Models**: Choose models suitable for analysis tasks
- **Custom Prompts**: Tailor system prompts for your specific needs

### **Procurement Analysis**
- **Detailed Requirements**: Provide comprehensive procurement descriptions
- **Realistic Budgets**: Set accurate budget constraints
- **Consider Context**: Factor in seasonal variations and market conditions

## 🔒 **Security & Privacy**

### **Data Protection**
- **Local Storage**: Vendor data stored locally in browser
- **API Security**: All AI provider communications use HTTPS
- **No Data Sharing**: Your data is not shared with third parties

### **API Key Management**
- **Secure Storage**: API keys encrypted in browser storage
- **Provider Direct**: All AI calls go directly to providers
- **No Logging**: API keys are not logged or transmitted to our servers

## 📞 **Support**

### **System Requirements**
- **Modern Browser**: Chrome, Firefox, Safari, or Edge
- **Internet Connection**: Required for AI provider API calls
- **JavaScript Enabled**: Required for application functionality

### **Integration Options**
- **ERP Systems**: Export vendor data to CSV format
- **Database Connections**: Use CSV export from your database
- **API Integration**: Contact support for custom integrations

---

**This is a production-grade system with real AI integration. All recommendations are generated by actual AI models using your vendor data and procurement requirements.**