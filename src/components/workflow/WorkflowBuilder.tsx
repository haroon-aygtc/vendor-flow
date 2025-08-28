"use client";

import React, { useState, useCallback } from "react";
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

interface NodeData {
  label: string;
  type: string;
  description?: string;
  config?: Record<string, any>;
}

const initialNodes: Node<NodeData>[] = [
  {
    id: "1",
    type: "input",
    data: {
      label: "Start",
      type: "start",
      description: "Entry point of workflow",
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
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("canvas");

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
      id: `${nodes.length + 1}`,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
        type,
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

    // Update the selected node reference
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
    // Placeholder for saving workflow
    console.log("Saving workflow:", {
      workflowName,
      workflowDescription,
      nodes,
      edges,
    });
    // In a real implementation, this would send data to an API
  };

  const runWorkflow = () => {
    setIsRunning(true);
    // Placeholder for workflow execution
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
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
        <div className="flex gap-2">
          <GuideTooltip content="Save your workflow configuration">
            <Button variant="outline" onClick={saveWorkflow}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </GuideTooltip>
          <GuideTooltip content="Execute the workflow with current configuration">
            <Button onClick={runWorkflow} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? "Running..." : "Run Workflow"}
            </Button>
          </GuideTooltip>
        </div>
      </div>

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
                <GuideTooltip content="Workflow execution and notification settings">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </GuideTooltip>
              </TabsList>
            </div>

            <TabsContent value="canvas" className="flex-1 p-0 m-0">
              <div className="h-full w-full" data-guide="workflow-canvas">
                <ReactFlow
                  nodes={nodes}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={deleteSelectedNode}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                        <div>
                          <Label htmlFor="agent-provider">AI Provider</Label>
                          <Select
                            onValueChange={(value) =>
                              updateNodeData("provider", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">
                                Anthropic
                              </SelectItem>
                              <SelectItem value="google">Google AI</SelectItem>
                              <SelectItem value="mistral">
                                Mistral AI
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedNode.data.type === "tool" && (
                        <div>
                          <Label htmlFor="tool-type">Tool Type</Label>
                          <Select
                            onValueChange={(value) =>
                              updateNodeData("toolType", value)
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
                          <Label htmlFor="decision-type">Decision Type</Label>
                          <Select
                            onValueChange={(value) =>
                              updateNodeData("decisionType", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select decision type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="condition">
                                Condition
                              </SelectItem>
                              <SelectItem value="switch">Switch</SelectItem>
                              <SelectItem value="ai">AI-based</SelectItem>
                            </SelectContent>
                          </Select>
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