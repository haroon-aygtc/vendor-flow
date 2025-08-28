"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  Settings,
  Bell,
  Search,
  BarChart3,
  Menu,
  HelpCircle,
} from "lucide-react";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import AgentConfiguration from "@/components/agents/AgentConfiguration";
import DocumentProcessor from "@/components/documents/DocumentProcessor";
import SmartVendorSelection from '../procurement/SmartVendorSelection';
import { UserGuide, GuideTooltip, QuickTips } from "@/components/ui/user-guide";

interface DashboardProps {
  userName?: string;
  userAvatar?: string;
}

const Dashboard = ({
  userName = "John Doe",
  userAvatar = "",
}: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-background border-r fixed left-0 top-0 h-full z-10">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">AI Orchestration</h1>
            <GuideTooltip content="Open interactive user guide">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowGuide(true)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </GuideTooltip>
          </div>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="space-y-1 px-2">
            <GuideTooltip content="View dashboard overview and recent activities">
              <Button
                variant={activeTab === "overview" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("overview")}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Overview
              </Button>
            </GuideTooltip>
            <GuideTooltip content="Connect and manage AI providers (OpenAI, Anthropic, Google AI, etc.)">
              <Button
                variant={activeTab === "providers" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("providers")}
                data-guide="providers-tab"
              >
                <Settings className="mr-2 h-4 w-4" />
                AI Providers
              </Button>
            </GuideTooltip>
            <GuideTooltip content="Create and configure AI agents with custom behaviors">
              <Button
                variant={activeTab === "agents" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("agents")}
                data-guide="agents-tab"
              >
                <Users className="mr-2 h-4 w-4" />
                Agents
              </Button>
            </GuideTooltip>
            <GuideTooltip content="Build complex AI workflows with drag-and-drop interface">
              <Button
                variant={activeTab === "workflows" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("workflows")}
              >
                <GitBranch className="mr-2 h-4 w-4" />
                Workflows
              </Button>
            </GuideTooltip>
            <GuideTooltip content="Upload and process documents with AI agents">
              <Button
                variant={activeTab === "documents" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("documents")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </Button>
            </GuideTooltip>
            <Separator className="my-2" />
            <GuideTooltip content="View performance metrics and execution analytics">
              <Button variant="ghost" className="w-full justify-start" data-guide="performance-metrics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </GuideTooltip>
          </nav>
        </div>
        
        {/* User section */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        {/* Header */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 lg:px-6 sticky top-0 z-5">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold capitalize ml-2 md:ml-0">
              {activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <GuideTooltip content="Search agents, workflows, and documents">
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full md:w-[200px] pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </GuideTooltip>
            </div>
            <GuideTooltip content="View notifications and system alerts">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </GuideTooltip>
            <Avatar>
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Agents</p>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <GitBranch className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Workflows</p>
                            <p className="text-2xl font-bold text-gray-900">8</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Documents</p>
                            <p className="text-2xl font-bold text-gray-900">156</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Document Analysis Completed</p>
                            <p className="text-xs text-gray-500">2 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">New Agent Created</p>
                            <p className="text-xs text-gray-500">15 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Workflow Execution Started</p>
                            <p className="text-xs text-gray-500">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-6">
                  <QuickTips />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="mt-6">
              <AgentConfiguration />
            </TabsContent>

            <TabsContent value="providers" className="mt-6">
              <SmartVendorSelection />
            </TabsContent>

            <TabsContent value="workflows" className="mt-6">
              <WorkflowBuilder />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <DocumentProcessor />
            </TabsContent>

            <TabsContent value="procurement" className="mt-6">
              <SmartVendorSelection />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* User Guide */}
      <UserGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};

export default Dashboard;