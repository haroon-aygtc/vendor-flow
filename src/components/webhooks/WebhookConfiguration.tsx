"use client";

import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  Settings, 
  Plus, 
  Check, 
  X, 
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  MessageSquare,
  Mail,
  Github,
  Users,
  Bot
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'js-cookie';

interface WebhookConfig {
  id: string;
  name: string;
  type: 'slack' | 'github' | 'email' | 'teams' | 'zapier' | 'discord' | 'jira' | 'custom';
  url: string;
  isActive: boolean;
  events: string[];
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'api_key' | 'basic';
    value: string;
  };
  configuration: Record<string, any>;
  lastTriggered?: string;
  successCount: number;
  errorCount: number;
  createdAt: string;
}

const WEBHOOK_TYPES = [
  {
    id: 'slack',
    name: 'Slack',
    icon: MessageSquare,
    description: 'Send notifications to Slack channels',
    color: 'bg-purple-100 text-purple-700',
    events: ['agent_completed', 'workflow_finished', 'document_processed', 'error_occurred'],
    configFields: [
      { name: 'webhook_url', label: 'Webhook URL', type: 'url', required: true },
      { name: 'channel', label: 'Channel', type: 'text', required: true, placeholder: '#general' },
      { name: 'username', label: 'Bot Username', type: 'text', required: false, placeholder: 'AI Agent' }
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    description: 'Create issues and updates',
    color: 'bg-gray-100 text-gray-700',
    events: ['error_occurred', 'workflow_failed', 'security_alert'],
    configFields: [
      { name: 'token', label: 'GitHub Token', type: 'password', required: true },
      { name: 'owner', label: 'Repository Owner', type: 'text', required: true },
      { name: 'repo', label: 'Repository Name', type: 'text', required: true }
    ]
  },
  {
    id: 'email',
    name: 'Email (SMTP)',
    icon: Mail,
    description: 'Email notifications & reports',
    color: 'bg-blue-100 text-blue-700',
    events: ['daily_report', 'error_occurred', 'workflow_finished', 'agent_completed'],
    configFields: [
      { name: 'smtp_host', label: 'SMTP Host', type: 'text', required: true },
      { name: 'smtp_port', label: 'SMTP Port', type: 'number', required: true, placeholder: '587' },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'from_email', label: 'From Email', type: 'email', required: true },
      { name: 'to_email', label: 'To Email', type: 'email', required: true }
    ]
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: Users,
    description: 'Team notifications',
    color: 'bg-indigo-100 text-indigo-700',
    events: ['workflow_finished', 'agent_completed', 'error_occurred'],
    configFields: [
      { name: 'webhook_url', label: 'Teams Webhook URL', type: 'url', required: true },
      { name: 'team_name', label: 'Team Name', type: 'text', required: false }
    ]
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: Zap,
    description: 'Connect 5000+ apps',
    color: 'bg-orange-100 text-orange-700',
    events: ['agent_completed', 'workflow_finished', 'document_processed', 'data_updated'],
    configFields: [
      { name: 'webhook_url', label: 'Zapier Webhook URL', type: 'url', required: true }
    ]
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: Bot,
    description: 'Bot notifications',
    color: 'bg-violet-100 text-violet-700',
    events: ['agent_completed', 'workflow_finished', 'error_occurred'],
    configFields: [
      { name: 'webhook_url', label: 'Discord Webhook URL', type: 'url', required: true },
      { name: 'username', label: 'Bot Username', type: 'text', required: false, placeholder: 'AI Agent' }
    ]
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: Settings,
    description: 'Create & update issues',
    color: 'bg-blue-100 text-blue-700',
    events: ['error_occurred', 'workflow_failed', 'security_alert'],
    configFields: [
      { name: 'domain', label: 'Jira Domain', type: 'text', required: true, placeholder: 'company.atlassian.net' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'api_token', label: 'API Token', type: 'password', required: true },
      { name: 'project_key', label: 'Project Key', type: 'text', required: true }
    ]
  },
  {
    id: 'custom',
    name: 'Custom REST API',
    icon: ExternalLink,
    description: 'Any HTTP endpoint',
    color: 'bg-green-100 text-green-700',
    events: ['agent_completed', 'workflow_finished', 'document_processed', 'error_occurred', 'custom_event'],
    configFields: [
      { name: 'endpoint_url', label: 'Endpoint URL', type: 'url', required: true },
      { name: 'method', label: 'HTTP Method', type: 'select', required: true, options: ['POST', 'PUT', 'PATCH'] },
      { name: 'api_key', label: 'API Key', type: 'password', required: false },
      { name: 'custom_headers', label: 'Custom Headers (JSON)', type: 'textarea', required: false }
    ]
  }
];

const AVAILABLE_EVENTS = [
  { id: 'agent_completed', name: 'Agent Completed', description: 'When an AI agent finishes execution' },
  { id: 'workflow_finished', name: 'Workflow Finished', description: 'When a workflow completes' },
  { id: 'document_processed', name: 'Document Processed', description: 'When document processing completes' },
  { id: 'error_occurred', name: 'Error Occurred', description: 'When any error happens' },
  { id: 'workflow_failed', name: 'Workflow Failed', description: 'When a workflow fails' },
  { id: 'security_alert', name: 'Security Alert', description: 'Security-related events' },
  { id: 'daily_report', name: 'Daily Report', description: 'Daily summary reports' },
  { id: 'data_updated', name: 'Data Updated', description: 'When data is updated' },
  { id: 'custom_event', name: 'Custom Event', description: 'Custom defined events' }
];

const WebhookConfiguration = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
    name: '',
    type: 'slack' as any,
    url: '',
    isActive: true,
    events: [],
    configuration: {},
    headers: {},
    successCount: 0,
    errorCount: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/webhooks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch webhook configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.type || !newWebhook.url) {
      toast({
        title: "Validation Error",
        description: "Name, type, and URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebhook),
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks([data.webhook, ...webhooks]);
        setNewWebhook({
          name: '',
          type: 'slack' as any,
          url: '',
          isActive: true,
          events: [],
          configuration: {},
          headers: {},
          successCount: 0,
          errorCount: 0
        });
        setShowCreateDialog(false);
        toast({
          title: "Success",
          description: "Webhook configured successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create webhook",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      setTesting(webhookId);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhookId,
          testData: {
            event: 'test_event',
            message: 'This is a test notification from your AI Agent Platform',
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: data.success ? "Test Successful" : "Test Failed",
          description: data.success ? "Webhook test completed successfully" : data.error,
          variant: data.success ? "default" : "destructive",
        });

        // Update webhook stats
        if (data.success) {
          setWebhooks(webhooks.map(w => 
            w.id === webhookId 
              ? { ...w, successCount: w.successCount + 1, lastTriggered: new Date().toISOString() }
              : w
          ));
        }
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test webhook",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/webhooks', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: webhookId,
          isActive
        }),
      });

      if (response.ok) {
        setWebhooks(webhooks.map(w => 
          w.id === webhookId ? { ...w, isActive } : w
        ));
        toast({
          title: "Success",
          description: `Webhook ${isActive ? 'enabled' : 'disabled'} successfully`,
        });
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`/api/webhooks?id=${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setWebhooks(webhooks.filter(w => w.id !== webhookId));
        toast({
          title: "Success",
          description: "Webhook deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const getWebhookTypeConfig = (type: string) => {
    return WEBHOOK_TYPES.find(t => t.id === type);
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
          <h2 className="text-2xl font-bold">Webhook Configuration</h2>
          <p className="text-gray-600">Connect your AI agents to external services and notifications</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure New Webhook</DialogTitle>
              <DialogDescription>
                Connect to external services for notifications and integrations
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="type" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="type">1. Select Type</TabsTrigger>
                <TabsTrigger value="config">2. Configure</TabsTrigger>
                <TabsTrigger value="events">3. Events</TabsTrigger>
              </TabsList>

              <TabsContent value="type" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {WEBHOOK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card 
                        key={type.id}
                        className={`cursor-pointer transition-colors ${
                          selectedType === type.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => {
                          setSelectedType(type.id);
                          setNewWebhook({ ...newWebhook, type: type.id as any });
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded ${type.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-sm">{type.name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <div>
                  <Label htmlFor="name">Webhook Name</Label>
                  <Input
                    id="name"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>

                {selectedType && getWebhookTypeConfig(selectedType)?.configFields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'select' ? (
                      <Select 
                        value={newWebhook.configuration?.[field.name] || ''}
                        onValueChange={(value) => setNewWebhook({
                          ...newWebhook,
                          configuration: { ...newWebhook.configuration, [field.name]: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={newWebhook.configuration?.[field.name] || ''}
                        onChange={(e) => setNewWebhook({
                          ...newWebhook,
                          configuration: { ...newWebhook.configuration, [field.name]: e.target.value }
                        })}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={newWebhook.configuration?.[field.name] || ''}
                        onChange={(e) => {
                          const value = field.type === 'number' ? parseInt(e.target.value) : e.target.value;
                          setNewWebhook({
                            ...newWebhook,
                            configuration: { ...newWebhook.configuration, [field.name]: value }
                          });
                          if (field.name === 'webhook_url' || field.name === 'endpoint_url') {
                            setNewWebhook({ ...newWebhook, url: e.target.value });
                          }
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <div>
                  <Label>Select Events to Trigger This Webhook</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {AVAILABLE_EVENTS.filter(event => 
                      !selectedType || getWebhookTypeConfig(selectedType)?.events.includes(event.id)
                    ).map((event) => (
                      <div key={event.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={newWebhook.events?.includes(event.id) || false}
                          onChange={(e) => {
                            const events = newWebhook.events || [];
                            if (e.target.checked) {
                              setNewWebhook({ ...newWebhook, events: [...events, event.id] });
                            } else {
                              setNewWebhook({ ...newWebhook, events: events.filter(e => e !== event.id) });
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={event.id} className="text-sm font-medium">
                          {event.name}
                        </Label>
                        <span className="text-xs text-gray-500">- {event.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createWebhook} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Webhook
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhooks Configured</h3>
            <p className="text-gray-500 mb-4">Connect your AI agents to external services</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Configure Your First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {webhooks.map((webhook) => {
            const typeConfig = getWebhookTypeConfig(webhook.type);
            const Icon = typeConfig?.icon || Webhook;
            
            return (
              <Card key={webhook.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded ${typeConfig?.color || 'bg-gray-100 text-gray-700'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{webhook.name}</CardTitle>
                        <CardDescription>{typeConfig?.name}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <div className="flex items-center">
                        {webhook.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-500 mr-1" />
                        )}
                        <span className={webhook.isActive ? 'text-green-600' : 'text-gray-500'}>
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Success Rate:</span>
                      <span className="font-medium">
                        {webhook.successCount + webhook.errorCount > 0 
                          ? Math.round((webhook.successCount / (webhook.successCount + webhook.errorCount)) * 100)
                          : 0}%
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Calls:</span>
                      <span className="font-medium">{webhook.successCount + webhook.errorCount}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Triggered:</span>
                      <span className="font-medium">
                        {webhook.lastTriggered ? formatTimeAgo(webhook.lastTriggered) : 'Never'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm text-gray-500">Events:</span>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 3).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {AVAILABLE_EVENTS.find(e => e.id === event)?.name || event}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={testing === webhook.id}
                        className="flex-1"
                      >
                        {testing === webhook.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Zap className="h-3 w-3 mr-1" />
                        )}
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyWebhookUrl(webhook.url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WebhookConfiguration;