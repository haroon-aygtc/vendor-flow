"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit, 
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Webhook,
  ExternalLink,
  Copy,
  TestTube
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
import { TOOLS_LIBRARY, getToolById, validateToolConfiguration } from '@/lib/tools-library';
import Cookies from 'js-cookie';

interface WebhookConfig {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  configuration: Record<string, any>;
  events: string[];
  lastTriggered?: string;
  totalTriggers: number;
  createdAt: string;
  updatedAt: string;
}

const WEBHOOK_INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications to channels',
    icon: '💬',
    status: 'connected',
    channels: ['#procurement', '#alerts'],
    quickSetup: true
  },
  {
    id: 'email-smtp',
    name: 'Email (SMTP)',
    description: 'Email notifications & reports',
    icon: '📧',
    status: 'connected',
    email: 'admin@company.com',
    quickSetup: true
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Create issues & updates',
    icon: '🐙',
    status: 'disconnected',
    quickSetup: true
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Team notifications',
    icon: '👥',
    status: 'connected',
    team: 'Procurement Team',
    quickSetup: true
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect 5000+ apps',
    icon: '⚡',
    status: 'disconnected',
    quickSetup: true
  },
  {
    id: 'rest-api-client',
    name: 'Custom REST API',
    description: 'Any HTTP endpoint',
    icon: '🔄',
    status: 'configure',
    quickSetup: false
  },
  {
    id: 'discord-bot',
    name: 'Discord',
    description: 'Bot notifications',
    icon: '🎮',
    status: 'disconnected',
    quickSetup: true
  },
  {
    id: 'jira-integration',
    name: 'Jira',
    description: 'Create & update tickets',
    icon: '📋',
    status: 'disconnected',
    quickSetup: true
  }
];

const WebhookConfiguration = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const [configuration, setConfiguration] = useState<Record<string, any>>({});

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

  const openConfiguration = (integration: any) => {
    setSelectedIntegration(integration);
    const tool = getToolById(integration.id);
    if (tool) {
      // Initialize configuration with default values
      const defaultConfig: Record<string, any> = {};
      Object.entries(tool.configuration).forEach(([key, config]) => {
        defaultConfig[key] = '';
      });
      setConfiguration(defaultConfig);
    }
    setShowConfigDialog(true);
  };

  const saveConfiguration = async () => {
    if (!selectedIntegration) return;

    const tool = getToolById(selectedIntegration.id);
    if (!tool) return;

    const validation = validateToolConfiguration(tool, configuration);
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      setConfiguring(selectedIntegration.id);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedIntegration.name,
          type: selectedIntegration.id,
          configuration,
          events: ['all'] // Default to all events
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks([data.webhook, ...webhooks]);
        setShowConfigDialog(false);
        setConfiguration({});
        toast({
          title: "Success",
          description: `${selectedIntegration.name} configured successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error configuring webhook:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to configure webhook",
        variant: "destructive",
      });
    } finally {
      setConfiguring(null);
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
            message: 'Test notification from AI Agent Platform',
            timestamp: new Date().toISOString(),
            type: 'test'
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
        toast({
          title: data.success ? "Test Successful" : "Test Failed",
          description: data.success ? "Webhook is working correctly" : data.error,
          variant: data.success ? "default" : "destructive",
        });
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
          description: "Webhook configuration deleted",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  const copyWebhookUrl = (webhookId: string) => {
    const url = `${window.location.origin}/api/webhooks/receive/${webhookId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Click to Connect</Badge>;
      case 'configure':
        return <Badge variant="secondary">Configure</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderConfigurationField = (key: string, config: any) => {
    const value = configuration[key] || '';
    
    switch (config.type) {
      case 'password':
        return (
          <Input
            type="password"
            value={value}
            onChange={(e) => setConfiguration({ ...configuration, [key]: e.target.value })}
            placeholder={config.placeholder}
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setConfiguration({ ...configuration, [key]: e.target.value })}
            placeholder={config.placeholder}
            rows={3}
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => setConfiguration({ ...configuration, [key]: val })}>
            <SelectTrigger>
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'boolean':
        return (
          <Switch
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => setConfiguration({ ...configuration, [key]: checked })}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setConfiguration({ ...configuration, [key]: e.target.value })}
            placeholder={config.placeholder}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setConfiguration({ ...configuration, [key]: e.target.value })}
            placeholder={config.placeholder}
          />
        );
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
    <div className="space-y-6 bg-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhook Configuration</h2>
          <p className="text-gray-600">Connect external services and configure notifications</p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Available Integrations</TabsTrigger>
          <TabsTrigger value="configured">Configured Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WEBHOOK_INTEGRATIONS.map((integration) => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {integration.status === 'connected' && (
                      <div className="space-y-2">
                        {integration.channels && (
                          <div className="text-sm">
                            <span className="text-gray-500">Channels:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {integration.channels.map((channel) => (
                                <Badge key={channel} variant="outline" className="text-xs">
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {integration.email && (
                          <div className="text-sm">
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-2 font-medium">{integration.email}</span>
                          </div>
                        )}
                        {integration.team && (
                          <div className="text-sm">
                            <span className="text-gray-500">Team:</span>
                            <span className="ml-2 font-medium">{integration.team}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      {integration.status === 'connected' ? (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                          <Button size="sm" variant="outline">
                            <TestTube className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => openConfiguration(integration)}
                          disabled={configuring === integration.id}
                        >
                          {configuring === integration.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {integration.status === 'disconnected' ? 'Connect' : 'Configure'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configured" className="space-y-6">
          {webhooks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhooks Configured</h3>
                <p className="text-gray-500 mb-4">Configure your first webhook integration to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">
                          {WEBHOOK_INTEGRATIONS.find(i => i.id === webhook.type)?.icon || '🔗'}
                        </span>
                        <div>
                          <CardTitle className="text-lg">{webhook.name}</CardTitle>
                          <CardDescription>
                            {webhook.totalTriggers} triggers • Last: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : 'Never'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={
                        webhook.status === 'connected' ? 'default' :
                        webhook.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {webhook.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <span className="text-gray-500">Webhook URL:</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 truncate">
                            {`${window.location.origin}/api/webhooks/receive/${webhook.id}`}
                          </code>
                          <Button size="sm" variant="outline" onClick={() => copyWebhookUrl(webhook.id)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="text-gray-500">Events:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testWebhook(webhook.id)}
                          disabled={testing === webhook.id}
                        >
                          {testing === webhook.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <TestTube className="h-3 w-3 mr-1" />
                          )}
                          Test
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Logs
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4">
              {(() => {
                const tool = getToolById(selectedIntegration.id);
                if (!tool) return <div>Tool configuration not found</div>;

                return Object.entries(tool.configuration).map(([key, config]) => (
                  <div key={key}>
                    <Label htmlFor={key}>
                      {config.label}
                      {config.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderConfigurationField(key, config)}
                    {config.description && (
                      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                    )}
                  </div>
                ));
              })()}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveConfiguration} disabled={configuring === selectedIntegration?.id}>
                  {configuring === selectedIntegration?.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Configuration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebhookConfiguration;
export { WebhookConfiguration };