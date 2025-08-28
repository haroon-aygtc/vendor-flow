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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Zap,
  Brain,
  Globe,
  Cpu,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AIProvider, ChatRequest } from "@/types/providers";
import { clientAIProviderService } from '@/services/clientAIProviderService';

interface ProviderManagementProps {
  onProviderSelected?: (provider: AIProvider) => void;
}

const ProviderManagement = ({ onProviderSelected = () => {} }: ProviderManagementProps) => {
  const [activeTab, setActiveTab] = useState("providers");
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Chat testing state
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [testMessage, setTestMessage] = useState("Hello! Can you help me test this AI provider connection?");
  const [chatResponse, setChatResponse] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadProviders();
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

  const handleAddProvider = async () => {
    if (!selectedProviderType || !apiKey) {
      setConnectionError("Please select a provider type and enter an API key");
      return;
    }

    setIsConnecting(true);
    setConnectionError("");

    try {
      let provider;
      switch (selectedProviderType) {
        case 'openai':
          provider = await clientAIProviderService.createOpenAIProvider(apiKey, baseUrl);
          break;
        case 'anthropic':
          provider = await clientAIProviderService.createAnthropicProvider(apiKey);
          break;
        case 'google':
          provider = await clientAIProviderService.createGoogleProvider(apiKey);
          break;
        case 'groq':
          provider = await clientAIProviderService.createGroqProvider(apiKey);
          break;
        case 'openrouter':
          provider = await clientAIProviderService.createOpenRouterProvider(apiKey);
          break;
        default:
          throw new Error('Unsupported provider type');
      }

      await loadProviders();
      setIsAddingProvider(false);
      setApiKey("");
      setBaseUrl("");
      setSelectedProviderType("");
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to provider");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    try {
      clientAIProviderService.removeProvider(providerId);
      await loadProviders();
    } catch (error) {
      console.error('Failed to remove provider:', error);
    }
  };

  const handleTestProvider = async () => {
    if (!selectedProvider || !selectedModel || !testMessage) {
      return;
    }

    setIsTesting(true);
    setChatResponse("");

    try {
      const request: ChatRequest = {
        model: selectedModel,
        messages: [
          { role: "user", content: testMessage }
        ],
        temperature: 0.7,
        maxTokens: 500
      };

      const response = await clientAIProviderService.sendChatRequest(selectedProvider, request);
      setChatResponse(response.choices[0].message.content);
    } catch (error) {
      setChatResponse(`Error: ${error instanceof Error ? error.message : "Failed to send message"}`);
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case "openai":
        return <Brain className="h-5 w-5 text-green-600" />;
      case "anthropic":
        return <MessageSquare className="h-5 w-5 text-orange-600" />;
      case "google":
        return <Globe className="h-5 w-5 text-blue-600" />;
      case "groq":
        return <Zap className="h-5 w-5 text-purple-600" />;
      case "openrouter":
        return <Cpu className="h-5 w-5 text-indigo-600" />;
      default:
        return <Brain className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-green-600 bg-green-50 border-green-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="w-full h-full bg-background">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Provider Management</CardTitle>
          <CardDescription>
            Connect and manage real AI providers including OpenAI, Anthropic, Google AI, Groq, and OpenRouter.
            Test connections and manage API configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="testing">Live Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Connected Providers</h3>
                <Dialog open={isAddingProvider} onOpenChange={setIsAddingProvider}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add AI Provider</DialogTitle>
                      <DialogDescription>
                        Connect a new AI provider by entering your API credentials.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider-type">Provider Type</Label>
                        <Select value={selectedProviderType} onValueChange={setSelectedProviderType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                            <SelectItem value="google">Google AI (Gemini)</SelectItem>
                            <SelectItem value="groq">Groq</SelectItem>
                            <SelectItem value="openrouter">OpenRouter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="relative">
                          <Input
                            id="api-key"
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {(selectedProviderType === "openai" || selectedProviderType === "groq") && (
                        <div className="space-y-2">
                          <Label htmlFor="base-url">Base URL (Optional)</Label>
                          <Input
                            id="base-url"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="Custom API endpoint (optional)"
                          />
                        </div>
                      )}

                      {connectionError && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{connectionError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddingProvider(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddProvider} disabled={isConnecting}>
                          {isConnecting ? "Connecting..." : "Connect Provider"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4">
                {providers.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Providers Connected</h3>
                      <p className="text-muted-foreground mb-4">
                        Connect your first AI provider to start building intelligent workflows.
                      </p>
                      <Button onClick={() => setIsAddingProvider(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Provider
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  providers.map((provider) => (
                    <Card key={provider.id} className="bg-background">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getProviderIcon(provider.type)}
                            <div>
                              <h4 className="font-semibold text-lg">{provider.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {provider.models.length} models available
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(provider.status)}>
                              {getStatusIcon(provider.status)}
                              <span className="ml-1 capitalize">{provider.status}</span>
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Provider</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {provider.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveProvider(provider.id)}>
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Context Length</TableHead>
                      <TableHead>Capabilities</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.flatMap(provider => 
                      provider.models.map(model => (
                        <TableRow key={`${provider.id}-${model.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-sm text-muted-foreground">{model.id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getProviderIcon(provider.type)}
                              {provider.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{model.type}</Badge>
                          </TableCell>
                          <TableCell>{model.contextLength.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {model.capabilities.slice(0, 3).map(cap => (
                                <Badge key={cap} variant="secondary" className="text-xs">
                                  {cap}
                                </Badge>
                              ))}
                              {model.capabilities.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{model.capabilities.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusIcon(provider.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Provider Testing</CardTitle>
                  <CardDescription>
                    Test your AI providers with real API calls to ensure they're working correctly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.filter(p => p.status === 'connected').map(provider => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <div className="flex items-center gap-2">
                                {getProviderIcon(provider.type)}
                                {provider.name}
                              </div>
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
                    <Label>Test Message</Label>
                    <Textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Enter a message to test the AI provider..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleTestProvider} 
                    disabled={!selectedProvider || !selectedModel || !testMessage || isTesting}
                    className="w-full"
                  >
                    {isTesting ? "Testing..." : "Send Test Message"}
                  </Button>

                  {chatResponse && (
                    <div className="space-y-2">
                      <Label>Response</Label>
                      <div className="p-4 bg-muted rounded-md">
                        <pre className="whitespace-pre-wrap text-sm">{chatResponse}</pre>
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

export default ProviderManagement;