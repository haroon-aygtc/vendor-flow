"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  PlusCircle,
  Save,
  Play,
  Settings,
  Trash2,
  Wrench,
  Bot,
  FileText,
  Database,
  GitBranch,
  StopCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { GuideTooltip } from "@/components/ui/user-guide";
import { clientAIProviderService } from '@/services/clientAIProviderService';
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

interface NodeData {
  label: string;
  type: string;
  description?: string;
  config?: Record<string, any>;
  status?: 'idle' | 'running' | 'completed' | 'error';
  result?: any;
}

interface WorkflowExecution {
  id: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  currentNode?: string;
  results: Record<string, any>;
  logs: Array<{
    timestamp: Date;
    nodeId: string;
    message: string;
    type: 'info' | 'error' | 'success';
  }>;
}

const initialNodes: Node<NodeData>[] = [
  {
    id: "1",
    type: "input",
    data: {
      label: "Start",
      type: "start",
      description: "Entry point of workflow",
      status: 'idle'
    },
    position: { x: 250, y: 5 },
  },
];

const initialEdges: Edge[] = [];

const nodeTypes = [
  { id: "agent", label: "Agent", icon: <Bot className="h-4 w-4" /> },
  { id: "tool", label: "Tool", icon: <Wrench className="h-4 w-4" /> },
  {
    id: "decision",
    label: "Decision",
    icon: <GitBranch className="h-4 w-4" />,
  },
  { id: "document", label: "Document", icon: <FileText className="h-4 w-4" /> },
  { id: "data", label: "Data Source", icon: <Database className="h-4 w-4" /> },
];

const WorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [activeTab, setActiveTab] = useState("canvas");
  const [execution, setExecution] = useState<WorkflowExecution>({
    id: '',
    status: 'idle',
    results: {},
    logs: []
  });
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    loadWorkflows();
    loadAgents();
    loadProviders();
  }, []);

  const loadWorkflows = () => {
    try {
      const saved = localStorage.getItem('workflows');
      if (saved) {
        setSavedWorkflows(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadAgents = () => {
    try {
      const saved = localStorage.getItem('ai-agents');
      if (saved) {
        setAgents(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadProviders = () => {
    try {
      const providers = clientAIProviderService.getProviders();
      setProviders(providers.filter(p => p.status === 'connected'));
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setActiveTab("properties");
  }, []);

  const addNode = (type: string) => {
    const newNode = {
      id: `${Date.now()}`,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
        type,
        status: 'idle' as const
      },
      position: { x: 250, y: 100 + nodes.length * 80 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (key: string, value: string) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: { ...node.data, [key]: value },
          };
        }
        return node;
      }),
    );

    setSelectedNode((prev) =>
      prev
        ? {
            ...prev,
            data: { ...prev.data, [key]: value },
          }
        : null,
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id,
      ),
    );
    setSelectedNode(null);
  };

  const saveWorkflow = () => {
    try {
      const workflow = {
        id: Date.now().toString(),
        name: workflowName,
        description: workflowDescription,
        nodes,
        edges,
        createdAt: new Date(),
        status: 'active'
      };

      const existingWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
      const updatedWorkflows = [...existingWorkflows, workflow];
      localStorage.setItem('workflows', JSON.stringify(updatedWorkflows));
      setSavedWorkflows(updatedWorkflows);

      // Log activity
      const activities = JSON.parse(localStorage.getItem('recent-activities') || '[]');
      activities.unshift({
        id: `workflow-save-${Date.now()}`,
        type: 'success',
        message: `Workflow "${workflowName}" saved successfully`,
        timestamp: new Date()
      });
      localStorage.setItem('recent-activities', JSON.stringify(activities.slice(0, 50)));

      console.log("Workflow saved successfully");
    } catch (error) {
      console.error('Failed to save workflow:', error);
    }
  };

  const executeWorkflow = async () => {
    if (nodes.length <= 1) {
      console.error('Workflow must have at least one action node');
      return;
    }

    const executionId = `exec-${Date.now()}`;
    setExecution({
      id: executionId,
      status: 'running',
      startTime: new Date(),
      results: {},
      logs: [{
        timestamp: new Date(),
        nodeId: 'system',
        message: 'Workflow execution started',
        type: 'info'
      }]
    });

    try {
      // Reset all node statuses
      setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, status: 'idle' }
      })));

      // Execute nodes in order based on connections
      const executionOrder = getExecutionOrder();
      
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.data.type === 'start') continue;

        await executeNode(node);
      }

      setExecution(prev => ({
        ...prev,
        status: 'completed',
        endTime: new Date(),
        logs: [...prev.logs, {
          timestamp: new Date(),
          nodeId: 'system',
          message: 'Workflow execution completed successfully',
          type: 'success'
        }]
      }));

      // Log activity
      const activities = JSON.parse(localStorage.getItem('recent-activities') || '[]');
      activities.unshift({
        id: `workflow-exec-${Date.now()}`,
        type: 'success',
        message: `Workflow "${workflowName}" executed successfully`,
        timestamp: new Date()
      });
      localStorage.setItem('recent-activities', JSON.stringify(activities.slice(0, 50)));

    } catch (error) {
      setExecution(prev => ({
        ...prev,
        status: 'error',
        endTime: new Date(),
        logs: [...prev.logs, {
          timestamp: new Date(),
          nodeId: 'system',
          message: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        }]
      }));
    }
  };

  const getExecutionOrder = (): string[] => {
    // Simple topological sort based on edges
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Find all nodes that this node connects to
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      outgoingEdges.forEach(edge => visit(edge.target));
      
      order.unshift(nodeId);
    };

    // Start from the start node
    const startNode = nodes.find(n => n.data.type === 'start');
    if (startNode) {
      visit(startNode.id);
    }

    return order;
  };

  const executeNode = async (node: Node<NodeData>): Promise<any> => {
    // Update node status to running
    setNodes(nds => nds.map(n => 
      n.id === node.id 
        ? { ...n, data: { ...n.data, status: 'running' } }
        : n
    ));

    setExecution(prev => ({
      ...prev,
      currentNode: node.id,
      logs: [...prev.logs, {
        timestamp: new Date(),
        nodeId: node.id,
        message: `Executing ${node.data.label}`,
        type: 'info'
      }]
    }));

    try {
      let result;

      switch (node.data.type) {
        case 'agent':
          result = await executeAgentNode(node);
          break;
        case 'tool':
          result = await executeToolNode(node);
          break;
        case 'decision':
          result = await executeDecisionNode(node);
          break;
        case 'document':
          result = await executeDocumentNode(node);
          break;
        case 'data':
          result = await executeDataNode(node);
          break;
        default:
          result = { success: true, message: 'Node executed' };
      }

      // Update node status to completed
      setNodes(nds => nds.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'completed', result } }
          : n
      ));

      setExecution(prev => ({
        ...prev,
        results: { ...prev.results, [node.id]: result },
        logs: [...prev.logs, {
          timestamp: new Date(),
          nodeId: node.id,
          message: `${node.data.label} completed successfully`,
          type: 'success'
        }]
      }));

      return result;
    } catch (error) {
      // Update node status to error
      setNodes(nds => nds.map(n => 
        n.id === node.id 
          ? { ...n, data: { ...n.data, status: 'error' } }
          : n
      ));

      setExecution(prev => ({
        ...prev,
        logs: [...prev.logs, {
          timestamp: new Date(),
          nodeId: node.id,
          message: `${node.data.label} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        }]
      }));

      throw error;
    }
  };

  const executeAgentNode = async (node: Node<NodeData>) => {
    const agentId = node.data.config?.agentId;
    const message = node.data.config?.message || 'Execute task';
    
    if (!agentId) {
      throw new Error('No agent selected for this node');
    }

    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Selected agent not found');
    }

    // Execute the agent
    const request = {
      model: agent.modelId,
      messages: [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: message }
      ],
      temperature: agent.temperature,
      maxTokens: agent.maxTokens
    };

    const response = await clientAIProviderService.sendChatRequest(agent.providerId, request);
    return {
      success: true,
      response: response.choices[0].message.content,
      agent: agent.name
    };
  };

  const executeToolNode = async (node: Node<NodeData>) => {
    const toolType = node.data.config?.toolType;
    
    switch (toolType) {
      case 'http':
        const url = node.data.config?.url;
        const method = node.data.config?.method || 'GET';
        
        if (!url) throw new Error('No URL configured for HTTP tool');
        
        const response = await fetch(url, { method });
        const data = await response.json();
        
        return {
          success: true,
          data,
          statusCode: response.status
        };
        
      case 'function':
        // Execute custom function
        const functionCode = node.data.config?.functionCode;
        if (!functionCode) throw new Error('No function code provided');
        
        // Simple function execution (in production, use a sandboxed environment)
        const func = new Function('input', functionCode);
        const result = func(execution.results);
        
        return {
          success: true,
          result
        };
        
      default:
        return {
          success: true,
          message: 'Tool executed'
        };
    }
  };

  const executeDecisionNode = async (node: Node<NodeData>) => {
    const decisionType = node.data.config?.decisionType;
    const condition = node.data.config?.condition;
    
    // Simple condition evaluation
    if (condition) {
      // In production, use a proper expression evaluator
      const result = eval(condition.replace(/\$\{(\w+)\}/g, (match, key) => {
        return JSON.stringify(execution.results[key] || null);
      }));
      
      return {
        success: true,
        decision: result,
        condition
      };
    }
    
    return {
      success: true,
      decision: true
    };
  };

  const executeDocumentNode = async (node: Node<NodeData>) => {
    // Process document (placeholder for real document processing)
    return {
      success: true,
      message: 'Document processed',
      extractedData: {
        entities: ['Sample Entity'],
        summary: 'Document summary'
      }
    };
  };

  const executeDataNode = async (node: Node<NodeData>) => {
    const dataSource = node.data.config?.dataSource;
    
    // Fetch data from configured source
    return {
      success: true,
      data: {
        source: dataSource,
        records: []
      }
    };
  };

  const stopExecution = () => {
    setExecution(prev => ({
      ...prev,
      status: 'error',
      endTime: new Date(),
      logs: [...prev.logs, {
        timestamp: new Date(),
        nodeId: 'system',
        message: 'Workflow execution stopped by user',
        type: 'info'
      }]
    }));

    // Reset all node statuses
    setNodes(nds => nds.map(node => ({
      ...node,
      data: { ...node.data, status: 'idle' }
    })));
  };

  const getNodeStatusColor = (status?: string) => {
    switch (status) {
      case 'running': return 'border-yellow-500 bg-yellow-50';
      case 'completed': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex flex-col">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-bold bg-transparent border-none h-auto p-0 focus-visible:ring-0"
          />
          <Input
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Add workflow description..."
            className="text-sm text-muted-foreground bg-transparent border-none h-auto p-0 focus-visible:ring-0"
          />
        </div>
        <div className="flex gap-2 items-center">
          {execution.status === 'running' && (
            <Badge variant="secondary" className="animate-pulse">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Running...
            </Badge>
          )}
          <GuideTooltip content="Save your workflow configuration">
            <Button variant="outline" onClick={saveWorkflow}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </GuideTooltip>
          <GuideTooltip content="Execute the workflow with current configuration">
            <Button 
              onClick={execution.status === 'running' ? stopExecution : executeWorkflow} 
              disabled={execution.status === 'running' && !execution.currentNode}
              variant={execution.status === 'running' ? "destructive" : "default"}
            >
              {execution.status === 'running' ? (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Workflow
                </>
              )}
            </Button>
          </GuideTooltip>
        </div>
      </div>

      {/* Execution Status */}
      {execution.status !== 'idle' && (
        <div className="px-4 py-2 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {execution.status === 'running' && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>}
              {execution.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {execution.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="text-sm font-medium capitalize">{execution.status}</span>
              {execution.currentNode && (
                <span className="text-sm text-muted-foreground">
                  - {nodes.find(n => n.id === execution.currentNode)?.data.label}
                </span>
              )}
            </div>
            {execution.startTime && (
              <span className="text-xs text-muted-foreground">
                {execution.endTime 
                  ? `Completed in ${Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)}s`
                  : `Running for ${Math.round((new Date().getTime() - execution.startTime.getTime()) / 1000)}s`
                }
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Node Types */}
        <div className="w-64 border-r p-4 overflow-y-auto">
          <GuideTooltip content="Drag these node types to build your workflow">
            <h3 className="font-medium mb-4" data-guide="node-types">Node Types</h3>
          </GuideTooltip>
          <div className="space-y-2">
            {nodeTypes.map((nodeType) => (
              <GuideTooltip 
                key={nodeType.id}
                content={`Add ${nodeType.label} node to your workflow`}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => addNode(nodeType.id)}
                >
                  {nodeType.icon}
                  <span className="ml-2">{nodeType.label}</span>
                </Button>
              </GuideTooltip>
            ))}
          </div>

          {/* Saved Workflows */}
          {savedWorkflows.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Saved Workflows</h3>
              <div className="space-y-1">
                {savedWorkflows.slice(0, 5).map((workflow) => (
                  <div key={workflow.id} className="text-xs p-2 bg-muted rounded">
                    <div className="font-medium truncate">{workflow.name}</div>
                    <div className="text-muted-foreground">
                      {new Date(workflow.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas and Properties Panel */}
        <div className="flex-1 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList>
                <GuideTooltip content="Visual workflow builder canvas">
                  <TabsTrigger value="canvas" data-guide="workflow-canvas">Canvas</TabsTrigger>
                </GuideTooltip>
                <GuideTooltip content="Configure selected node properties">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                </GuideTooltip>
                <GuideTooltip content="View execution logs and results">
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                </GuideTooltip>
                <GuideTooltip content="Workflow execution and notification settings">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </GuideTooltip>
              </TabsList>
            </div>

            <TabsContent value="canvas" className="flex-1 p-0 m-0">
              <div className="h-full w-full" data-guide="workflow-canvas">
                <ReactFlow
                  nodes={nodes.map(node => ({
                    ...node,
                    className: getNodeStatusColor(node.data.status)
                  }))}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                  <Panel position="top-right">
                    <GuideTooltip content="Open node properties panel">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("properties")}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Properties
                      </Button>
                    </GuideTooltip>
                  </Panel>
                </ReactFlow>
              </div>
            </TabsContent>

            <TabsContent
              value="properties"
              className="flex-1 p-4 overflow-y-auto"
            >
              {selectedNode ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Node Properties</span>
                      <div className="flex gap-2">
                        {selectedNode.data.status && (
                          <Badge variant={
                            selectedNode.data.status === 'completed' ? 'default' :
                            selectedNode.data.status === 'running' ? 'secondary' :
                            selectedNode.data.status === 'error' ? 'destructive' : 'outline'
                          }>
                            {selectedNode.data.status}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={deleteSelectedNode}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="node-label">Label</Label>
                        <Input
                          id="node-label"
                          value={selectedNode.data.label || ""}
                          onChange={(e) =>
                            updateNodeData("label", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="node-description">Description</Label>
                        <Input
                          id="node-description"
                          value={selectedNode.data.description || ""}
                          onChange={(e) =>
                            updateNodeData("description", e.target.value)
                          }
                        />
                      </div>

                      <Separator />

                      {selectedNode.data.type === "agent" && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="agent-select">Select Agent</Label>
                            <Select
                              value={selectedNode.data.config?.agentId || ""}
                              onValueChange={(value) =>
                                updateNodeData("config", JSON.stringify({
                                  ...selectedNode.data.config,
                                  agentId: value
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select agent" />
                              </SelectTrigger>
                              <SelectContent>
                                {agents.map(agent => (
                                  <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="agent-message">Message/Task</Label>
                            <Input
                              id="agent-message"
                              value={selectedNode.data.config?.message || ""}
                              onChange={(e) =>
                                updateNodeData("config", JSON.stringify({
                                  ...selectedNode.data.config,
                                  message: e.target.value
                                }))
                              }
                              placeholder="Task for the agent to execute"
                            />
                          </div>
                        </div>
                      )}

                      {selectedNode.data.type === "tool" && (
                        <div>
                          <Label htmlFor="tool-type">Tool Type</Label>
                          <Select
                            value={selectedNode.data.config?.toolType || ""}
                            onValueChange={(value) =>
                              updateNodeData("config", JSON.stringify({
                                ...selectedNode.data.config,
                                toolType: value
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select tool type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="http">HTTP Request</SelectItem>
                              <SelectItem value="function">Function</SelectItem>
                              <SelectItem value="openapi">OpenAPI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedNode.data.type === "decision" && (
                        <div>
                          <Label htmlFor="decision-condition">Condition</Label>
                          <Input
                            id="decision-condition"
                            value={selectedNode.data.config?.condition || ""}
                            onChange={(e) =>
                              updateNodeData("config", JSON.stringify({
                                ...selectedNode.data.config,
                                condition: e.target.value
                              }))
                            }
                            placeholder="e.g., ${previousResult.success} === true"
                          />
                        </div>
                      )}

                      {selectedNode.data.result && (
                        <div>
                          <Label>Execution Result</Label>
                          <div className="p-3 bg-muted rounded-md">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(selectedNode.data.result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Select a node to view and edit its properties</p>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="execution"
              className="flex-1 p-4 overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Execution Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  {execution.logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No execution logs yet. Run the workflow to see logs.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {execution.logs.map((log, index) => (
                        <div key={index} className={`p-2 rounded text-sm ${
                          log.type === 'error' ? 'bg-red-50 text-red-700' :
                          log.type === 'success' ? 'bg-green-50 text-green-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{log.message}</span>
                            <span className="text-xs opacity-70">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          {log.nodeId !== 'system' && (
                            <div className="text-xs opacity-70 mt-1">
                              Node: {nodes.find(n => n.id === log.nodeId)?.data.label || log.nodeId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="settings"
              className="flex-1 p-4 overflow-y-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="execution">
                      <AccordionTrigger>Execution Settings</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="timeout">Timeout (seconds)</Label>
                            <Input
                              id="timeout"
                              type="number"
                              defaultValue="300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="retries">Max Retries</Label>
                            <Input
                              id="retries"
                              type="number"
                              defaultValue="3"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="notifications">
                      <AccordionTrigger>Notifications</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="notify-completion" />
                            <Label htmlFor="notify-completion">
                              Notify on completion
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="notify-failure" />
                            <Label htmlFor="notify-failure">
                              Notify on failure
                            </Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="permissions">
                      <AccordionTrigger>Permissions</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="visibility">Visibility</Label>
                            <Select defaultValue="private">
                              <SelectTrigger id="visibility">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;