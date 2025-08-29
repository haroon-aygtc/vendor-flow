"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  GitBranch, 
  FileText, 
  BarChart3, 
  Bell, 
  Search, 
  Menu, 
  HelpCircle,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { UserGuide } from '@/components/ui/user-guide';
import { useAuth } from '@/contexts/AuthContext';
import { AgentConfiguration } from '@/components/agents/AgentConfiguration';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { DocumentProcessor } from '@/components/documents/DocumentProcessor';
import { VendorSelection } from '@/components/vendors/VendorSelection';
import Cookies from 'js-cookie';

interface DashboardProps {
  userName?: string;
  userAvatar?: string;
}

interface DashboardData {
  stats: {
    activeAgents: number;
    workflows: number;
    documents: number;
    uptime: number;
  };
  activities: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
  agents: Array<{
    id: string;
    name: string;
    status: string;
    lastRun?: string;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
}

interface AIProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  model?: string;
  createdAt: string;
}

const GuideTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div title={content}>
    {children}
  </div>
);

const Dashboard = ({
  userName = "User",
  userAvatar = "",
}: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showGuide, setShowGuide] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [aiProviders, setAiProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'providers') {
      fetchAIProviders();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('auth_token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIProviders = async () => {
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
        setAiProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    }
  };

  const getActivityIcon = (type: string, status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-background border-r fixed left-0 top-0 h-full z-10">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">AxonStreamAI</h1>
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
            <GuideTooltip content="Smart vendor selection and procurement">
              <Button
                variant={activeTab === "vendors" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("vendors")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Vendor Selection
              </Button>
            </GuideTooltip>
            <Separator className="my-2" />
            <GuideTooltip content="View performance metrics and execution analytics">
              <Button 
                variant={activeTab === "analytics" ? "secondary" : "ghost"} 
                className="w-full justify-start" 
                onClick={() => setActiveTab("analytics")}
                data-guide="performance-metrics"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </GuideTooltip>
            <GuideTooltip content="System architecture and visual analytics dashboard">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => window.open('/admin', '_blank')}
                data-guide="admin-panel"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            </GuideTooltip>
          </nav>
        </div>

        {/* User section */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar || userAvatar} alt={user?.name || userName} />
              <AvatarFallback>{(user?.name || userName).charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || userName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role || 'User'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
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
              <AvatarImage src={user?.avatar || userAvatar} alt={user?.name || userName} />
              <AvatarFallback>{(user?.name || userName).charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.stats.activeAgents || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      Real-time count
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Workflows</CardTitle>
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.stats.workflows || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      Total created
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.stats.documents || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      Processed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData?.stats.uptime || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      <CheckCircle className="inline h-3 w-3 mr-1 text-green-500" />
                      All systems operational
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest system activities and events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.activities?.length ? (
                        dashboardData.activities.map((activity) => (
                          <div key={activity.id} className="flex items-center space-x-4">
                            {getActivityIcon(activity.type, activity.status)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.message}</p>
                              <p className="text-xs text-gray-500">{formatTimeAgo(activity.createdAt)}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No recent activities</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Active Agents
                    </CardTitle>
                    <CardDescription>Currently running AI agents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData?.agents?.length ? (
                        dashboardData.agents.map((agent) => (
                          <div key={agent.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{agent.name}</p>
                              <p className="text-xs text-gray-500">
                                Last run: {agent.lastRun ? formatTimeAgo(agent.lastRun) : 'Never'}
                              </p>
                            </div>
                            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                              {agent.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No active agents</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="providers">
              <AIProvidersSection providers={aiProviders} onRefresh={fetchAIProviders} />
            </TabsContent>

            <TabsContent value="agents">
              <AgentConfiguration />
            </TabsContent>

            <TabsContent value="workflows">
              <WorkflowBuilder />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentProcessor />
            </TabsContent>

            <TabsContent value="vendors">
              <VendorSelection />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsSection />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* User Guide */}
      <UserGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};

// AI Providers Section Component
const AIProvidersSection = ({ providers, onRefresh }: { providers: AIProvider[], onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const addProvider = async (providerData: any) => {
    try {
      setLoading(true);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/ai-providers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providerData),
      });

      if (response.ok) {
        onRefresh();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">AI Providers</h3>
          <p className="text-sm text-gray-500">Manage your AI provider connections</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {provider.name}
                <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                  {provider.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <CardDescription>{provider.type}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Model: {provider.model || 'Default'}</p>
              <p className="text-xs text-gray-500 mt-2">
                Added: {formatTimeAgo(provider.createdAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Providers</h3>
            <p className="text-gray-500 mb-4">Connect your first AI provider to get started</p>
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Analytics Section Component
const AnalyticsSection = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Analytics & Performance</h3>
        <p className="text-sm text-gray-500">Monitor system performance and usage metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Success Rate</span>
                <span className="text-sm font-medium">
                  {analyticsData?.agentSuccessRate || 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Response Time</span>
                <span className="text-sm font-medium">
                  {analyticsData?.avgResponseTime || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Executions</span>
                <span className="text-sm font-medium">
                  {analyticsData?.totalExecutions || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Active Workflows</span>
                <span className="text-sm font-medium">
                  {analyticsData?.activeWorkflows || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completed Today</span>
                <span className="text-sm font-medium">
                  {analyticsData?.workflowsToday || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg Duration</span>
                <span className="text-sm font-medium">
                  {analyticsData?.avgWorkflowDuration || 0}s
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Processed Today</span>
                <span className="text-sm font-medium">
                  {analyticsData?.documentsToday || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Processing Rate</span>
                <span className="text-sm font-medium">
                  {analyticsData?.processingRate || 0}/min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Storage Used</span>
                <span className="text-sm font-medium">
                  {analyticsData?.storageUsed || 0}MB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;