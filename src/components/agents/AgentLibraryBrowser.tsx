"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Bot, 
  Plus, 
  Star, 
  Clock, 
  Zap,
  BookOpen,
  Copy,
  CheckCircle,
  Loader2
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
import { 
  AGENT_LIBRARY, 
  AGENT_CATEGORIES, 
  getAgentsByCategory, 
  searchAgents, 
  createAgentFromTemplate,
  type AgentTemplate 
} from '@/lib/agents-library';
import Cookies from 'js-cookie';

interface AIProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

const AgentLibraryBrowser = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [customization, setCustomization] = useState({
    name: '',
    description: '',
    prompt: '',
    provider: '',
    model: ''
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      setCustomization({
        name: selectedAgent.name,
        description: selectedAgent.description,
        prompt: selectedAgent.prompt,
        provider: '',
        model: selectedAgent.suggestedModel
      });
    }
  }, [selectedAgent]);

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

  const createAgentFromLibrary = async () => {
    if (!selectedAgent || !customization.provider) {
      toast({
        title: "Validation Error",
        description: "Please select an AI provider",
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
        body: JSON.stringify({
          name: customization.name,
          description: customization.description,
          prompt: customization.prompt,
          provider: customization.provider,
          model: customization.model
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateDialog(false);
        setSelectedAgent(null);
        toast({
          title: "Success",
          description: `Agent "${customization.name}" created successfully`,
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

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copied",
      description: "Prompt copied to clipboard",
    });
  };

  const filteredAgents = AGENT_LIBRARY.filter(agent => {
    const matchesSearch = searchTerm === '' || 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || agent.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Agent Library</h2>
          <p className="text-gray-600">Browse and deploy pre-built AI agents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {AGENT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription className="text-sm">{agent.category}</CardDescription>
                  </div>
                </div>
                <Badge className={getDifficultyColor(agent.difficulty)}>
                  {agent.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-700">{agent.description}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {agent.estimatedSetupTime}
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    {agent.suggestedModel}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {agent.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {agent.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="pt-3 border-t flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setShowCreateDialog(true);
                    }}
                    className="flex-1"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Deploy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <BookOpen className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Agent Details Dialog */}
      <Dialog open={!!selectedAgent && !showCreateDialog} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">{selectedAgent?.icon}</span>
              <span>{selectedAgent?.name}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedAgent?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 font-medium">{selectedAgent.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Difficulty:</span>
                  <Badge className={`ml-2 ${getDifficultyColor(selectedAgent.difficulty)}`}>
                    {selectedAgent.difficulty}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Setup Time:</span>
                  <span className="ml-2 font-medium">{selectedAgent.estimatedSetupTime}</span>
                </div>
                <div>
                  <span className="text-gray-500">Suggested Model:</span>
                  <span className="ml-2 font-medium">{selectedAgent.suggestedModel}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Capabilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability) => (
                    <Badge key={capability} variant="secondary">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">System Prompt</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyPrompt(selectedAgent.prompt)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {selectedAgent.prompt}
                  </pre>
                </div>
              </div>

              {selectedAgent.requiredTools && (
                <div>
                  <h4 className="font-medium mb-2">Required Tools</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.requiredTools.map((tool) => (
                      <Badge key={tool} variant="outline">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedAgent(null)}>
                  Close
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Deploy Agent
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deploy Agent: {selectedAgent?.name}</DialogTitle>
            <DialogDescription>
              Customize and deploy this agent to your workspace
            </DialogDescription>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={customization.name}
                    onChange={(e) => setCustomization({ ...customization, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="provider">AI Provider</Label>
                  <Select value={customization.provider} onValueChange={(value) => setCustomization({ ...customization, provider: value })}>
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
                  value={customization.description}
                  onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="model">Model (Optional)</Label>
                <Input
                  id="model"
                  value={customization.model}
                  onChange={(e) => setCustomization({ ...customization, model: e.target.value })}
                  placeholder={selectedAgent.suggestedModel}
                />
              </div>

              <div>
                <Label htmlFor="prompt">System Prompt</Label>
                <Textarea
                  id="prompt"
                  value={customization.prompt}
                  onChange={(e) => setCustomization({ ...customization, prompt: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createAgentFromLibrary} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Deploy Agent
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentLibraryBrowser;
export { AgentLibraryBrowser };