import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown, Minus, Brain, FileText, Upload, HelpCircle, Database, Zap } from 'lucide-react';
import { clientAIProviderService } from '@/services/clientAIProviderService';
import { ChatRequest } from '@/types/providers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  onTimeDelivery: number;
  qualityScore: number;
  avgPriceVsMarket: number;
  completedOrders: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  totalScore?: number;
  aiAnalysis?: string;
}

interface ProcurementRequest {
  category: string;
  description: string;
  budget: number;
  urgency: 'low' | 'medium' | 'high';
  qualityRequirements: string;
  deliveryDate: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  providerId: string;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  status: 'active' | 'inactive' | 'running';
}

export default function SmartVendorSelection() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [procurementRequest, setProcurementRequest] = useState<ProcurementRequest>({
    category: '',
    description: '',
    budget: 0,
    urgency: 'medium',
    qualityRequirements: '',
    deliveryDate: ''
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [csvData, setCsvData] = useState<string>('');
  const [isUploadingData, setIsUploadingData] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    loadVendorsFromStorage();
    loadAgents();
  }, []);

  const loadVendorsFromStorage = () => {
    const savedVendors = localStorage.getItem('vendor-database');
    if (savedVendors) {
      try {
        const vendorData = JSON.parse(savedVendors);
        setVendors(vendorData);
      } catch (error) {
        console.error('Error loading vendor data:', error);
        setVendors([]);
      }
    }
  };

  const saveVendorsToStorage = (vendorData: Vendor[]) => {
    localStorage.setItem('vendor-database', JSON.stringify(vendorData));
  };

  const loadAgents = () => {
    const savedAgents = localStorage.getItem('ai-agents');
    if (savedAgents) {
      try {
        const agentData = JSON.parse(savedAgents);
        setAgents(agentData.filter((agent: Agent) => agent.status === 'active'));
      } catch (error) {
        console.error('Error loading agents:', error);
        setAgents([]);
      }
    }
  };

  const handleAIAnalysis = async () => {
    if (!selectedAgent || !procurementRequest.category) {
      alert('Please select an AI agent and specify procurement requirements');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult('');

    try {
      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) throw new Error('Agent not found');

      const categoryVendors = vendors.filter(v => 
        v.category.toLowerCase() === procurementRequest.category.toLowerCase()
      );

      if (categoryVendors.length === 0) {
        setAnalysisResult('No vendors found for the specified category. Please import vendor data or select a different category.');
        return;
      }

      const vendorData = categoryVendors.map(v => 
        `Vendor: ${v.name}
- Rating: ${v.rating}/5
- On-time Delivery: ${v.onTimeDelivery}%
- Quality Score: ${v.qualityScore}%
- Price vs Market: ${v.avgPriceVsMarket}%
- Completed Orders: ${v.completedOrders}
- Performance Trend: ${v.performanceTrend}`
      ).join('\n\n');

      const prompt = `You are a procurement expert AI. Analyze the following vendor data and procurement requirements to recommend the best vendors.

PROCUREMENT REQUIREMENTS:
- Category: ${procurementRequest.category}
- Description: ${procurementRequest.description}
- Budget: $${procurementRequest.budget}
- Urgency: ${procurementRequest.urgency}
- Quality Requirements: ${procurementRequest.qualityRequirements}
- Delivery Date: ${procurementRequest.deliveryDate}

VENDOR DATA:
${vendorData}

Please provide:
1. Top 3 vendor recommendations ranked by suitability
2. Detailed analysis for each recommended vendor
3. Risk assessment and mitigation strategies
4. Final recommendation with reasoning

Format your response clearly with vendor names, scores, and detailed explanations.`;

      const chatRequest: ChatRequest = {
        model: agent.modelId,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: agent.temperature,
        maxTokens: agent.maxTokens
      };

      const response = await clientAIProviderService.sendChatRequest(agent.providerId, chatRequest);
      const aiAnalysis = response.choices[0].message.content;
      
      setAnalysisResult(aiAnalysis);

      const structuredRecommendations = categoryVendors.map(vendor => {
        const score = calculateVendorScore(vendor, procurementRequest);
        return {
          vendor: { ...vendor, totalScore: score, aiAnalysis },
          score,
          reasoning: generateReasoning(vendor, score, procurementRequest)
        };
      }).sort((a, b) => b.score - a.score).slice(0, 3);

      setRecommendations(structuredRecommendations);

    } catch (error) {
      console.error('AI Analysis failed:', error);
      setAnalysisResult(`Error: ${error instanceof Error ? error.message : 'AI analysis failed'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateVendorScore = (vendor: Vendor, request: ProcurementRequest): number => {
    let weights = {
      onTimeDelivery: 0.4,
      qualityScore: 0.3,
      pricing: 0.2,
      rating: 0.1
    };

    if (request.urgency === 'high') {
      weights.onTimeDelivery = 0.5;
      weights.qualityScore = 0.25;
      weights.pricing = 0.15;
      weights.rating = 0.1;
    } else if (request.urgency === 'low') {
      weights.pricing = 0.4;
      weights.qualityScore = 0.3;
      weights.onTimeDelivery = 0.2;
      weights.rating = 0.1;
    }

    const onTimeScore = vendor.onTimeDelivery;
    const qualityScore = vendor.qualityScore;
    const pricingScore = Math.max(0, 100 + vendor.avgPriceVsMarket);
    const ratingScore = (vendor.rating / 5) * 100;

    let trendMultiplier = 1.0;
    switch (vendor.performanceTrend) {
      case 'improving': trendMultiplier = 1.1; break;
      case 'declining': trendMultiplier = 0.9; break;
      default: trendMultiplier = 1.0;
    }

    const score = (
      onTimeScore * weights.onTimeDelivery +
      qualityScore * weights.qualityScore +
      pricingScore * weights.pricing +
      ratingScore * weights.rating
    ) * trendMultiplier;

    return Math.round(score * 100) / 100;
  };

  const generateReasoning = (vendor: Vendor, score: number, request: ProcurementRequest): string => {
    const strengths = [];
    const concerns = [];

    if (vendor.onTimeDelivery >= 90) strengths.push('excellent delivery reliability');
    else if (vendor.onTimeDelivery < 80) concerns.push('delivery reliability issues');

    if (vendor.qualityScore >= 90) strengths.push('high quality standards');
    else if (vendor.qualityScore < 85) concerns.push('quality consistency concerns');

    if (vendor.avgPriceVsMarket <= -5) strengths.push('competitive pricing');
    else if (vendor.avgPriceVsMarket > 5) concerns.push('above-market pricing');

    if (vendor.performanceTrend === 'improving') strengths.push('improving performance trend');
    else if (vendor.performanceTrend === 'declining') concerns.push('declining performance trend');

    if (request.budget > 0) {
      if (vendor.avgPriceVsMarket <= 0) {
        strengths.push('budget-friendly pricing');
      } else if (vendor.avgPriceVsMarket > 10) {
        concerns.push('may exceed budget constraints');
      }
    }

    let reasoning = `Overall Score: ${score}/100. `;
    if (strengths.length > 0) reasoning += `Strengths: ${strengths.join(', ')}. `;
    if (concerns.length > 0) reasoning += `Concerns: ${concerns.join(', ')}.`;

    return reasoning;
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        setCsvData(csv);
        parseCSVData(csv);
      };
      reader.readAsText(file);
    }
  };

  const parseCSVData = (csv: string) => {
    setIsUploadingData(true);
    try {
      const lines = csv.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const newVendors: Vendor[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 8) {
          const vendor: Vendor = {
            id: values[0] || `V${String(Date.now() + i)}`,
            name: values[1] || `Vendor ${i}`,
            category: values[2] || 'General',
            rating: Math.min(5, Math.max(0, parseFloat(values[3]) || 3.0)),
            onTimeDelivery: Math.min(100, Math.max(0, parseFloat(values[4]) || 80)),
            qualityScore: Math.min(100, Math.max(0, parseFloat(values[5]) || 80)),
            avgPriceVsMarket: parseFloat(values[6]) || 0,
            completedOrders: Math.max(0, parseInt(values[7]) || 0),
            performanceTrend: (['improving', 'stable', 'declining'].includes(values[8]?.toLowerCase()) 
              ? values[8].toLowerCase() : 'stable') as 'improving' | 'stable' | 'declining'
          };
          newVendors.push(vendor);
        }
      }

      const updatedVendors = [...vendors, ...newVendors];
      setVendors(updatedVendors);
      saveVendorsToStorage(updatedVendors);
      alert(`Successfully imported ${newVendors.length} vendors from CSV`);
    } catch (error) {
      alert('Error parsing CSV file. Please check the format and try again.');
    } finally {
      setIsUploadingData(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Smart Vendor Selection Tool</h1>
            <p className="text-gray-600 mt-2">AI-Powered Procurement Automation System</p>
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                {showGuide ? 'Hide Guide' : 'Show Guide'}
              </Button>
            </div>
          </div>

          {showGuide && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700 space-y-2">
                <p><strong>Step 1:</strong> Create an AI Agent in the "Agents" tab if you haven't already</p>
                <p><strong>Step 2:</strong> Import your vendor data via CSV in the "Data Import" tab</p>
                <p><strong>Step 3:</strong> Select your AI agent and define procurement requirements</p>
                <p><strong>Step 4:</strong> Run AI analysis to get intelligent vendor recommendations</p>
                <p><strong>Step 5:</strong> Review recommendations in the "Recommendations" tab</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="vendors">Vendor Database</TabsTrigger>
              <TabsTrigger value="upload">Data Import</TabsTrigger>
              <TabsTrigger value="results">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Agent Selection
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select an AI agent to analyze vendor data and provide recommendations</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>Choose an AI agent to analyze vendor data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="agent">Select AI Agent</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an AI agent" />
                            </SelectTrigger>
                            <SelectContent>
                              {agents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id}>
                                  {agent.name} - {agent.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>AI agents use different models and prompts to analyze data</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {agents.length === 0 && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        No active AI agents found. Please create and activate an AI agent first in the "Agents" tab.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Procurement Requirements
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Define your specific procurement needs for AI analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <CardDescription>Define your procurement needs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Select 
                            value={procurementRequest.category} 
                            onValueChange={(value) => setProcurementRequest(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...new Set(vendors.map(v => v.category))].map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the category of items you need to procure</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Textarea
                            id="description"
                            placeholder="Describe your procurement requirements..."
                            value={procurementRequest.description}
                            onChange={(e) => setProcurementRequest(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Provide detailed requirements for better AI analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="budget">Budget ($)</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="budget"
                              type="number"
                              placeholder="0"
                              value={procurementRequest.budget || ''}
                              onChange={(e) => setProcurementRequest(prev => ({ ...prev, budget: Number(e.target.value) }))}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter your budget to help AI consider cost factors</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div>
                        <Label htmlFor="urgency">Urgency</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Select 
                              value={procurementRequest.urgency} 
                              onValueChange={(value: any) => setProcurementRequest(prev => ({ ...prev, urgency: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low - Cost Priority</SelectItem>
                                <SelectItem value="medium">Medium - Balanced</SelectItem>
                                <SelectItem value="high">High - Speed Priority</SelectItem>
                              </SelectContent>
                            </Select>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Urgency affects scoring weights: High prioritizes delivery speed</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={handleAIAnalysis} 
                          disabled={isAnalyzing || !selectedAgent || !procurementRequest.category}
                          className="w-full"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Start AI-powered vendor analysis and recommendations</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              </div>

              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{analysisResult}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Vendor Database ({vendors.length} vendors)
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current vendor performance data loaded from your system</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Current vendor performance data</CardDescription>
                </CardHeader>
                <CardContent>
                  {vendors.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendor Data</h3>
                      <p className="text-gray-500 mb-4">Import vendor data from CSV to get started</p>
                      <Button onClick={() => document.querySelector('input[type="file"]')?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Vendor Data
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {vendors.map(vendor => (
                        <div key={vendor.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{vendor.name}</h3>
                              <Badge variant="outline">{vendor.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(vendor.performanceTrend)}
                              <span className="text-sm capitalize">{vendor.performanceTrend}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Rating</div>
                              <div className="font-medium">{vendor.rating}/5</div>
                            </div>
                            <div>
                              <div className="text-gray-500">On-Time Delivery</div>
                              <div className={`font-medium ${getStatusColor(vendor.onTimeDelivery)}`}>
                                {vendor.onTimeDelivery}%
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Quality Score</div>
                              <div className={`font-medium ${getStatusColor(vendor.qualityScore)}`}>
                                {vendor.qualityScore}%
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Price vs Market</div>
                              <div className={`font-medium ${vendor.avgPriceVsMarket <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {vendor.avgPriceVsMarket > 0 ? '+' : ''}{vendor.avgPriceVsMarket}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Vendor Data
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload CSV file with vendor performance data from your ERP system</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Upload CSV file with vendor performance data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="csv-upload">CSV File</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          disabled={isUploadingData}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select a CSV file with vendor performance data</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Required CSV format:</p>
                    <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">
                      Vendor_ID,Vendor_Name,Category,Vendor_Rating,On_Time_Delivery_%,Quality_Score,Avg_Price_vs_Market,Completed_Orders,Performance_Trend
                    </code>
                    <p className="mt-2 text-xs">
                      <strong>Performance_Trend:</strong> must be "improving", "stable", or "declining"<br/>
                      <strong>Ratings:</strong> 0-5 scale, Percentages: 0-100, Price: negative is better than market
                    </p>
                  </div>

                  {csvData && (
                    <div>
                      <Label>Preview:</Label>
                      <div className="bg-gray-50 p-3 rounded text-xs max-h-40 overflow-auto">
                        <pre>{csvData.split('\n').slice(0, 5).join('\n')}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Top Vendor Recommendations</h2>
                  {recommendations.map((rec, index) => (
                    <Card key={rec.vendor.id} className={index === 0 ? 'border-green-500 border-2' : ''}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {index === 0 && <CheckCircle className="h-5 w-5 text-green-500" />}
                              #{index + 1} {rec.vendor.name}
                            </CardTitle>
                            <CardDescription>{rec.vendor.category}</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{rec.score}</div>
                            <div className="text-sm text-gray-500">Score</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">On-Time Delivery</div>
                              <Progress value={rec.vendor.onTimeDelivery} className="mt-1" />
                              <div className="text-sm font-medium">{rec.vendor.onTimeDelivery}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Quality Score</div>
                              <Progress value={rec.vendor.qualityScore} className="mt-1" />
                              <div className="text-sm font-medium">{rec.vendor.qualityScore}%</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Rating</div>
                              <div className="text-lg font-medium">{rec.vendor.rating}/5</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Orders Completed</div>
                              <div className="text-lg font-medium">{rec.vendor.completedOrders}</div>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm font-medium text-blue-800 mb-1">AI Analysis:</div>
                            <div className="text-sm text-blue-700">{rec.reasoning}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                    <p className="text-gray-500">Run an AI analysis to get vendor recommendations</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}