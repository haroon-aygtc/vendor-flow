"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Bot, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'js-cookie';

interface Agent {
  id: string;
  name: string;
  description: string;
  prompt: string;
  provider: string;
  model: string;
  status: 'active' | 'inactive' | 'error';
  totalRuns: number;
  successfulRuns: number;
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
}

interface AIProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  model?: string;
}

const AgentConfiguration = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    prompt: '',
    provider: '',
    model: ''
  });

  useEffect(() => {
    fetchAgents();
    fetchProviders();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/ai-providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const createAgent = async () => {
    if (!newAgent.name || !newAgent.prompt || !newAgent.provider) {
      toast({
        title: "Validation Error",
        description: "Name, prompt, and provider are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent),
      });

      if (response.ok) {
        const data = await response.json();
        setAgents([data.agent, ...agents]);
        setNewAgent({ name: '', description: '', prompt: '', provider: '', model: '' });
        setShowCreateDialog(false);
        toast({
          title: "Success",
          description: "Agent created successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const testAgent = async (agentId: string) => {
    if (!testMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a test message",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(agentId);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/agents/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          message: testMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
        
        // Update agent stats in the list
        setAgents(agents.map(agent => 
          agent.id === agentId ? data.agent : agent
        ));

        toast({
          title: data.success ? "Test Successful" : "Test Failed",
          description: data.success ? "Agent responded successfully" : data.error,
          variant: data.success ? "default" : "destructive",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error testing agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test agent",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`/api/agents?id=${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAgents(agents.filter(agent => agent.id !== agentId));
        toast({
          title: "Success",
          description: "Agent deleted successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Agents</h2>
          <p className="text-gray-600">Create and manage your AI agents</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Configure your AI agent with custom behavior and capabilities
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g., Document Analyzer"
                  />
                </div>
                <div>
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={newAgent.provider} onValueChange={(value) => setNewAgent({ ...newAgent, provider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.filter(p => p.isActive).map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} ({provider.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="Brief description of what this agent does"
                />
              </div>
              <div>
                <Label htmlFor="model">Model (Optional)</Label>
                <Input
                  id="model"
                  value={newAgent.model}
                  onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                  placeholder="e.g., gpt-4, claude-3-sonnet-20240229"
                />
              </div>
              <div>
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={newAgent.prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                  placeholder="Define the agent's behavior, role, and instructions..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createAgent} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Providers</h3>
            <p className="text-gray-500 mb-4">You need to add AI providers before creating agents</p>
            <Button variant="outline">
              Go to AI Providers
            </Button>
          </CardContent>
        </Card>
      )}

      {agents.length === 0 && providers.length > 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Created</h3>
            <p className="text-gray-500 mb-4">Create your first AI agent to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <Badge variant={agent.status === 'active' ? 'default' : agent.status === 'error' ? 'destructive' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription>{agent.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Provider:</span>
                    <span className="font-medium">
                      {providers.find(p => p.id === agent.provider)?.name || agent.provider}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model:</span>
                    <span className="font-medium">{agent.model || 'Default'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Runs:</span>
                    <span className="font-medium">{agent.totalRuns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Success Rate:</span>
                    <span className="font-medium">
                      {agent.totalRuns > 0 ? Math.round((agent.successfulRuns / agent.totalRuns) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Run:</span>
                    <span className="font-medium">
                      {agent.lastRun ? formatTimeAgo(agent.lastRun) : 'Never'}
                    </span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter test message..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && testAgent(agent.id)}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => testAgent(agent.id)}
                          disabled={testing === agent.id}
                          className="flex-1"
                        >
                          {testing === agent.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAgent(agent)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteAgent(agent.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {testResult && testResult.agent?.id === agent.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        {testResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className="text-sm font-medium">
                          {testResult.success ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {testResult.processingTime}ms
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                        {testResult.response}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentConfiguration;