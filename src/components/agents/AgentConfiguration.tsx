"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Bot,
  Brain,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIProvider, ChatRequest } from "@/types/providers";
import { clientAIProviderService } from '@/services/clientAIProviderService';
import { GuideTooltip } from "@/components/ui/user-guide";

interface Agent {
  id: string;
  name: string;
  description: string;
  providerId: string;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  status: "active" | "inactive" | "running";
  createdAt: Date;
  lastRun?: Date;
  totalRuns: number;
}

interface AgentConfigurationProps {
  onAgentCreated?: (agent: Agent) => void;
}

const AgentConfiguration = ({ onAgentCreated = () => {} }: AgentConfigurationProps) => {
  const [activeTab, setActiveTab] = useState("agents");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  
  // Agent creation form state
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant. Respond clearly and concisely to user queries.");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  
  // Testing state
  const [testingAgentId, setTestingAgentId] = useState("");
  const [testMessage, setTestMessage] = useState("Hello! Can you introduce yourself?");
  const [testResponse, setTestResponse] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadProviders();
    loadAgents();
  }, []);

  const loadProviders = async () => {
    try {
      const providers = clientAIProviderService.getProviders();
      setProviders(providers.filter(p => p.status === 'connected'));
    } catch (error) {
      console.error('Failed to load providers:', error);
      setProviders([]);
    }
  };

  const loadAgents = async () => {
    try {
      // Load agents from localStorage for now
      const savedAgents = localStorage.getItem('ai-agents');
      if (savedAgents) {
        const agentsData = JSON.parse(savedAgents);
        setAgents(agentsData);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAgents([]);
    }
  };

  const saveAgents = (updatedAgents: Agent[]) => {
    localStorage.setItem('ai-agents', JSON.stringify(updatedAgents));
    setAgents(updatedAgents);
  };

  const handleCreateAgent = async () => {
    if (!agentName || !selectedProvider || !selectedModel) {
      return;
    }

    try {
      const newAgent: Agent = {
        id: 'agent-' + Date.now(),
        name: agentName,
        description: agentDescription,
        providerId: selectedProvider,
        modelId: selectedModel,
        systemPrompt,
        temperature,
        maxTokens,
        status: "active",
        createdAt: new Date(),
        totalRuns: 0
      };

      const updatedAgents = [...agents, newAgent];
      localStorage.setItem('ai-agents', JSON.stringify(updatedAgents));
      setAgents(updatedAgents);
      onAgentCreated(newAgent);
      
      // Reset form
      setAgentName("");
      setAgentDescription("");
      setSelectedProvider("");
      setSelectedModel("");
      setSystemPrompt("You are a helpful AI assistant. Respond clearly and concisely to user queries.");
      setTemperature(0.7);
      setMaxTokens(1000);
      setIsCreatingAgent(false);
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const handleTestAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !testMessage) return;

    setIsTesting(true);
    setTestResponse("");

    try {
      const request: ChatRequest = {
        model: agent.modelId,
        messages: [
          { role: "system", content: agent.systemPrompt },
          { role: "user", content: testMessage }
        ],
        temperature: agent.temperature,
        maxTokens: agent.maxTokens
      };

      const response = await clientAIProviderService.sendChatRequest(agent.providerId, request);
      setTestResponse(response.choices[0].message.content);
      
      // Update agent stats
      const updatedAgents = agents.map(a => 
        a.id === agentId 
          ? { ...a, totalRuns: a.totalRuns + 1, lastRun: new Date() }
          : a
      );
      localStorage.setItem('ai-agents', JSON.stringify(updatedAgents));
      setAgents(updatedAgents);
    } catch (error) {
      setTestResponse(`Error: ${error instanceof Error ? error.message : "Failed to send message"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    const updatedAgents = agents.filter(a => a.id !== agentId);
    saveAgents(updatedAgents);
  };

  const toggleAgentStatus = (agentId: string) => {
    const updatedAgents = agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === "active" ? "inactive" : "active" as const }
        : agent
    );
    saveAgents(updatedAgents);
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || "Unknown Provider";
  };

  const getModelName = (providerId: string, modelId: string) => {
    const provider = providers.find(p => p.id === providerId);
    const model = provider?.models.find(m => m.id === modelId);
    return model?.name || modelId;
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="w-full h-full bg-background">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>
            Create and manage AI agents with real provider integrations. Configure system prompts, 
            parameters, and test agent responses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="agents">My Agents</TabsTrigger>
              <GuideTooltip content="Create new AI agents with custom configurations">
                <TabsTrigger value="create" data-guide="create-agent">Create Agent</TabsTrigger>
              </GuideTooltip>
              <GuideTooltip content="Test your agents with sample messages">
                <TabsTrigger value="testing" data-guide="test-agent">Test Agents</TabsTrigger>
              </GuideTooltip>
            </TabsList>

            <TabsContent value="agents" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Configured Agents</h3>
                <GuideTooltip content="Create your first AI agent">
                  <Button onClick={() => setIsCreatingAgent(true)} data-guide="create-agent">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Agent
                  </Button>
                </GuideTooltip>
              </div>

              {agents.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Agents Created</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first AI agent to start building intelligent workflows.
                    </p>
                    <Button onClick={() => setActiveTab("create")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Agent
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="bg-background">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                              <Bot className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{agent.name}</h4>
                              <p className="text-sm text-muted-foreground">{agent.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={agent.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {agent.status === "active" ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <Clock className="mr-1 h-3 w-3" />
                              )}
                              {agent.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAgentStatus(agent.id)}
                            >
                              {agent.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteAgent(agent.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Provider:</span>
                            <p className="font-medium">{getProviderName(agent.providerId)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Model:</span>
                            <p className="font-medium">{getModelName(agent.providerId, agent.modelId)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Runs:</span>
                            <p className="font-medium">{agent.totalRuns}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Run:</span>
                            <p className="font-medium">
                              {agent.lastRun ? new Date(agent.lastRun).toLocaleDateString() : "Never"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Agent</CardTitle>
                  <CardDescription>
                    Configure a new AI agent with specific provider, model, and behavior settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {providers.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No AI providers connected. Please add and connect providers first in the AI Providers tab.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-name">Agent Name</Label>
                      <Input
                        id="agent-name"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g., Document Analyzer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agent-description">Description</Label>
                      <Input
                        id="agent-description"
                        value={agentDescription}
                        onChange={(e) => setAgentDescription(e.target.value)}
                        placeholder="Brief description of agent purpose"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>AI Provider</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map(provider => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProviderData?.models.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <GuideTooltip content="Define how your agent behaves and responds to users">
                      <Label htmlFor="system-prompt">System Prompt</Label>
                    </GuideTooltip>
                    <Textarea
                      id="system-prompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Define the agent's role and behavior..."
                      rows={4}
                      data-guide="system-prompt"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <GuideTooltip content="Controls randomness: 0 = focused, 2 = creative">
                        <Label htmlFor="temperature">Temperature: {temperature}</Label>
                      </GuideTooltip>
                      <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness (0 = focused, 2 = creative)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <GuideTooltip content="Maximum number of tokens in the response">
                        <Label htmlFor="max-tokens">Max Tokens</Label>
                      </GuideTooltip>
                      <Input
                        id="max-tokens"
                        type="number"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        min="1"
                        max="4000"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateAgent} 
                    disabled={!agentName || !selectedProvider || !selectedModel}
                    className="w-full"
                  >
                    Create Agent
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Agent Responses</CardTitle>
                  <CardDescription>
                    Send test messages to your agents to verify their behavior and responses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Agent</Label>
                    <Select value={testingAgentId} onValueChange={setTestingAgentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an agent to test" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} ({getProviderName(agent.providerId)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Test Message</Label>
                    <Textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Enter a message to test the agent..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={() => handleTestAgent(testingAgentId)} 
                    disabled={!testingAgentId || !testMessage || isTesting}
                    className="w-full"
                  >
                    {isTesting ? "Testing..." : "Send Test Message"}
                  </Button>

                  {testResponse && (
                    <div className="space-y-2">
                      <Label>Agent Response</Label>
                      <div className="p-4 bg-muted rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">{testResponse}</pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentConfiguration;