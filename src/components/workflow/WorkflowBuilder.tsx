"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Plus, 
  Save, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  Bot, 
  GitBranch,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Decision,
  ArrowRight
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

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  status: 'draft' | 'active' | 'paused' | 'error';
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
}

// Custom Node Components
const AgentNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-200">
    <div className="flex items-center">
      <Bot className="h-4 w-4 mr-2 text-blue-600" />
      <div className="ml-2">
        <div className="text-lg font-bold">{data.label}</div>
        <div className="text-gray-500 text-sm">{data.agentName}</div>
      </div>
    </div>
  </div>
);

const DecisionNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-yellow-200">
    <div className="flex items-center">
      <GitBranch className="h-4 w-4 mr-2 text-yellow-600" />
      <div className="ml-2">
        <div className="text-lg font-bold">{data.label}</div>
        <div className="text-gray-500 text-sm">Decision Point</div>
      </div>
    </div>
  </div>
);

const InputNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-200">
    <div className="flex items-center">
      <ArrowRight className="h-4 w-4 mr-2 text-green-600" />
      <div className="ml-2">
        <div className="text-lg font-bold">{data.label}</div>
        <div className="text-gray-500 text-sm">Input</div>
      </div>
    </div>
  </div>
);

const OutputNode = ({ data }: { data: any }) => (
  <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-200">
    <div className="flex items-center">
      <FileText className="h-4 w-4 mr-2 text-purple-600" />
      <div className="ml-2">
        <div className="text-lg font-bold">{data.label}</div>
        <div className="text-gray-500 text-sm">Output</div>
      </div>
    </div>
  </div>
);

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  decision: DecisionNode,
  input: InputNode,
  output: OutputNode,
};

const WorkflowBuilder = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: ''
  });

  const [newNode, setNewNode] = useState({
    type: 'agent',
    label: '',
    agentId: '',
    prompt: '',
    condition: ''
  });

  useEffect(() => {
    fetchWorkflows();
    fetchAgents();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/workflows', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflow.name) {
      toast({
        title: "Validation Error",
        description: "Workflow name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newWorkflow,
          nodes: [],
          edges: []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflows([data.workflow, ...workflows]);
        setSelectedWorkflow(data.workflow);
        setNodes([]);
        setEdges([]);
        setNewWorkflow({ name: '', description: '' });
        setShowCreateDialog(false);
        toast({
          title: "Success",
          description: "Workflow created successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workflow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      setSaving(true);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/workflows', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedWorkflow.id,
          name: selectedWorkflow.name,
          description: selectedWorkflow.description,
          nodes,
          edges,
          status: selectedWorkflow.status
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkflows(workflows.map(w => w.id === data.workflow.id ? data.workflow : w));
        setSelectedWorkflow(data.workflow);
        toast({
          title: "Success",
          description: "Workflow saved successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      setExecuting(workflowId);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          initialContext: {}
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExecutionResult(data);
        
        // Update workflow execution count
        setWorkflows(workflows.map(w => 
          w.id === workflowId 
            ? { ...w, executionCount: w.executionCount + 1, lastExecuted: new Date().toISOString() }
            : w
        ));

        toast({
          title: data.success ? "Execution Successful" : "Execution Failed",
          description: data.success ? "Workflow executed successfully" : data.error,
          variant: data.success ? "default" : "destructive",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to execute workflow",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const loadWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);
  };

  const addNode = () => {
    if (!newNode.label) {
      toast({
        title: "Validation Error",
        description: "Node label is required",
        variant: "destructive",
      });
      return;
    }

    const id = `${newNode.type}_${Date.now()}`;
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    
    let nodeData: any = {
      label: newNode.label,
    };

    if (newNode.type === 'agent') {
      if (!newNode.agentId) {
        toast({
          title: "Validation Error",
          description: "Agent selection is required",
          variant: "destructive",
        });
        return;
      }
      const agent = agents.find(a => a.id === newNode.agentId);
      nodeData.agentId = newNode.agentId;
      nodeData.agentName = agent?.name;
      nodeData.prompt = newNode.prompt;
    } else if (newNode.type === 'decision') {
      nodeData.condition = newNode.condition;
    }

    const newNodeObj: Node = {
      id,
      type: newNode.type,
      position,
      data: nodeData,
    };

    setNodes((nds) => nds.concat(newNodeObj));
    setNewNode({ type: 'agent', label: '', agentId: '', prompt: '', condition: '' });
    setShowNodeDialog(false);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
    }, eds)),
    [setEdges]
  );

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
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Workflows</h2>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workflow</DialogTitle>
                  <DialogDescription>
                    Create a new AI workflow with custom logic
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="e.g., Document Analysis Pipeline"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newWorkflow.description}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                      placeholder="Describe what this workflow does..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createWorkflow} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {selectedWorkflow && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button size="sm" onClick={saveWorkflow} disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                  Save
                </Button>
                <Button size="sm" onClick={() => executeWorkflow(selectedWorkflow.id)} disabled={executing === selectedWorkflow.id}>
                  {executing === selectedWorkflow.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                  Run
                </Button>
                <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Node</DialogTitle>
                      <DialogDescription>
                        Add a new node to your workflow
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nodeType">Node Type</Label>
                        <Select value={newNode.type} onValueChange={(value) => setNewNode({ ...newNode, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="input">Input</SelectItem>
                            <SelectItem value="agent">AI Agent</SelectItem>
                            <SelectItem value="decision">Decision</SelectItem>
                            <SelectItem value="output">Output</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="nodeLabel">Label</Label>
                        <Input
                          id="nodeLabel"
                          value={newNode.label}
                          onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                          placeholder="Node name"
                        />
                      </div>
                      {newNode.type === 'agent' && (
                        <>
                          <div>
                            <Label htmlFor="agentSelect">Select Agent</Label>
                            <Select value={newNode.agentId} onValueChange={(value) => setNewNode({ ...newNode, agentId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose an agent" />
                              </SelectTrigger>
                              <SelectContent>
                                {agents.filter(agent => agent.status === 'active').map((agent) => (
                                  <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="prompt">Custom Prompt (Optional)</Label>
                            <Textarea
                              id="prompt"
                              value={newNode.prompt}
                              onChange={(e) => setNewNode({ ...newNode, prompt: e.target.value })}
                              placeholder="Additional instructions for this step..."
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                      {newNode.type === 'decision' && (
                        <div>
                          <Label htmlFor="condition">Condition</Label>
                          <Input
                            id="condition"
                            value={newNode.condition}
                            onChange={(e) => setNewNode({ ...newNode, condition: e.target.value })}
                            placeholder="e.g., result contains 'success'"
                          />
                        </div>
                      )}
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addNode}>
                          Add Node
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">{selectedWorkflow.name}</p>
                <p>{selectedWorkflow.description}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <Card 
                key={workflow.id} 
                className={`cursor-pointer transition-colors ${selectedWorkflow?.id === workflow.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => loadWorkflow(workflow)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{workflow.name}</CardTitle>
                    <Badge variant={
                      workflow.status === 'active' ? 'default' :
                      workflow.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {workflow.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-600 mb-2">{workflow.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Runs: {workflow.executionCount}</span>
                    <span>{formatTimeAgo(workflow.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        {selectedWorkflow ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Workflow Selected</h3>
              <p className="text-gray-500 mb-4">Create or select a workflow to start building</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Execution Results Dialog */}
      <Dialog open={!!executionResult} onOpenChange={() => setExecutionResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Workflow Execution Results</DialogTitle>
            <DialogDescription>
              Results from the workflow execution
            </DialogDescription>
          </DialogHeader>
          {executionResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {executionResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                </span>
                <span className="text-sm text-gray-500">
                  ({executionResult.executionTime}ms)
                </span>
              </div>

              {executionResult.result && (
                <div>
                  <h4 className="font-medium mb-2">Final Result</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {executionResult.result}
                  </div>
                </div>
              )}

              {executionResult.executionLog && (
                <div>
                  <h4 className="font-medium mb-2">Execution Log</h4>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {executionResult.executionLog.map((log: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{log.nodeLabel}</span>
                        <span className="text-gray-500">({log.executionTime}ms)</span>
                        {log.error && <span className="text-red-500 text-xs">{log.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilder;