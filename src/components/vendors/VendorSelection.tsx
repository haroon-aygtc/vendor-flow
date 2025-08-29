"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Bot, 
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Clock,
  DollarSign
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'js-cookie';

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  onTimeDelivery: number;
  qualityScore: number;
  avgPriceVsMarket: number;
  completedOrders: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
  contactInfo?: any;
  capabilities?: string[];
  createdAt: string;
  updatedAt: string;
}

interface VendorRecommendation {
  vendor: Vendor;
  score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
}

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
}

const VendorSelection = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recommendations, setRecommendations] = useState<VendorRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();

  const [newVendor, setNewVendor] = useState({
    name: '',
    category: '',
    rating: 0,
    onTimeDelivery: 0,
    qualityScore: 0,
    avgPriceVsMarket: 0,
    completedOrders: 0,
    performanceTrend: 'stable' as const,
    contactInfo: {},
    capabilities: [] as string[]
  });

  const [selectionCriteria, setSelectionCriteria] = useState({
    requirements: '',
    category: 'all',
    agentId: '',
    budget: '',
    deadline: ''
  });

  const categories = [
    'Software Development',
    'Marketing & Advertising',
    'Design & Creative',
    'Consulting',
    'Manufacturing',
    'Logistics & Supply Chain',
    'Professional Services',
    'Technology & IT',
    'Other'
  ];

  useEffect(() => {
    fetchVendors();
    fetchAgents();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`/api/vendors?category=${selectedCategory}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
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

  const addVendor = async () => {
    if (!newVendor.name || !newVendor.category) {
      toast({
        title: "Validation Error",
        description: "Name and category are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVendor),
      });

      if (response.ok) {
        const data = await response.json();
        setVendors([data.vendor, ...vendors]);
        setNewVendor({
          name: '',
          category: '',
          rating: 0,
          onTimeDelivery: 0,
          qualityScore: 0,
          avgPriceVsMarket: 0,
          completedOrders: 0,
          performanceTrend: 'stable',
          contactInfo: {},
          capabilities: []
        });
        setShowAddDialog(false);
        toast({
          title: "Success",
          description: "Vendor added successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vendor",
        variant: "destructive",
      });
    }
  };

  const performVendorSelection = async () => {
    if (!selectionCriteria.requirements || !selectionCriteria.agentId) {
      toast({
        title: "Validation Error",
        description: "Requirements and AI agent are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setAnalyzing(true);
      const token = Cookies.get('auth_token');
      const response = await fetch('/api/vendors/select', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectionCriteria),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setShowSelectionDialog(false);
        toast({
          title: "Analysis Complete",
          description: `Generated ${data.recommendations?.length || 0} vendor recommendations`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error performing vendor selection:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze vendors",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteVendor = async (vendorId: string) => {
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`/api/vendors?id=${vendorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setVendors(vendors.filter(v => v.id !== vendorId));
        toast({
          title: "Success",
          description: "Vendor deleted successfully",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete vendor",
        variant: "destructive",
      });
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchVendors();
  }, [selectedCategory, searchTerm]);

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
          <h2 className="text-2xl font-bold">Smart Vendor Selection</h2>
          <p className="text-gray-600">AI-powered vendor analysis and selection</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Bot className="h-4 w-4 mr-2" />
                AI Selection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Vendor Selection</DialogTitle>
                <DialogDescription>
                  Let AI analyze and recommend the best vendors for your requirements
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requirements">Requirements Description</Label>
                  <Textarea
                    id="requirements"
                    value={selectionCriteria.requirements}
                    onChange={(e) => setSelectionCriteria({ ...selectionCriteria, requirements: e.target.value })}
                    placeholder="Describe what you need from vendors (services, timeline, quality requirements, etc.)"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={selectionCriteria.category} onValueChange={(value) => setSelectionCriteria({ ...selectionCriteria, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="agent">AI Agent</Label>
                    <Select value={selectionCriteria.agentId} onValueChange={(value) => setSelectionCriteria({ ...selectionCriteria, agentId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI agent" />
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget (Optional)</Label>
                    <Input
                      id="budget"
                      value={selectionCriteria.budget}
                      onChange={(e) => setSelectionCriteria({ ...selectionCriteria, budget: e.target.value })}
                      placeholder="e.g., $10,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={selectionCriteria.deadline}
                      onChange={(e) => setSelectionCriteria({ ...selectionCriteria, deadline: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSelectionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={performVendorSelection} disabled={analyzing}>
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Analyze Vendors
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>
                  Add a new vendor to your database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vendor Name</Label>
                    <Input
                      id="name"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newVendor.category} onValueChange={(value) => setNewVendor({ ...newVendor, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={newVendor.rating}
                      onChange={(e) => setNewVendor({ ...newVendor, rating: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="onTimeDelivery">On-Time Delivery (%)</Label>
                    <Input
                      id="onTimeDelivery"
                      type="number"
                      min="0"
                      max="100"
                      value={newVendor.onTimeDelivery}
                      onChange={(e) => setNewVendor({ ...newVendor, onTimeDelivery: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualityScore">Quality Score (%)</Label>
                    <Input
                      id="qualityScore"
                      type="number"
                      min="0"
                      max="100"
                      value={newVendor.qualityScore}
                      onChange={(e) => setNewVendor({ ...newVendor, qualityScore: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avgPriceVsMarket">Price vs Market (%)</Label>
                    <Input
                      id="avgPriceVsMarket"
                      type="number"
                      value={newVendor.avgPriceVsMarket}
                      onChange={(e) => setNewVendor({ ...newVendor, avgPriceVsMarket: parseFloat(e.target.value) })}
                      placeholder="Negative = cheaper, Positive = more expensive"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="completedOrders">Completed Orders</Label>
                    <Input
                      id="completedOrders"
                      type="number"
                      min="0"
                      value={newVendor.completedOrders}
                      onChange={(e) => setNewVendor({ ...newVendor, completedOrders: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="performanceTrend">Performance Trend</Label>
                    <Select value={newVendor.performanceTrend} onValueChange={(value: any) => setNewVendor({ ...newVendor, performanceTrend: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="improving">Improving</SelectItem>
                        <SelectItem value="stable">Stable</SelectItem>
                        <SelectItem value="declining">Declining</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addVendor}>
                    Add Vendor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendors">All Vendors</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredVendors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Vendors Found</h3>
                <p className="text-gray-500 mb-4">Add vendors to start using AI-powered selection</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Vendor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <CardDescription>{vendor.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">On-Time Delivery:</span>
                        <span className="font-medium">{vendor.onTimeDelivery}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quality Score:</span>
                        <span className="font-medium">{vendor.qualityScore}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Price vs Market:</span>
                        <span className={`font-medium ${vendor.avgPriceVsMarket <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {vendor.avgPriceVsMarket > 0 ? '+' : ''}{vendor.avgPriceVsMarket}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Completed Orders:</span>
                        <span className="font-medium">{vendor.completedOrders}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500">Trend:</span>
                        <div className="flex items-center">
                          {getTrendIcon(vendor.performanceTrend)}
                          <span className="ml-1 font-medium capitalize">{vendor.performanceTrend}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVendor(vendor.id)}
                          className="w-full"
                        >
                          Remove Vendor
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Yet</h3>
                <p className="text-gray-500 mb-4">Use AI Selection to get vendor recommendations</p>
                <Button onClick={() => setShowSelectionDialog(true)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Start AI Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium">AI Vendor Recommendations</h3>
                <p className="text-gray-500">Ranked by AI analysis score</p>
              </div>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <Card key={rec.vendor.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{rec.vendor.name}</CardTitle>
                            <CardDescription>{rec.vendor.category}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                            {rec.score}
                          </div>
                          <div className="text-sm text-gray-500">AI Score</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Progress value={rec.score} className="w-full" />
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">AI Analysis</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {rec.reasoning}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-green-700">Strengths</h4>
                            <ul className="text-sm space-y-1">
                              {rec.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {rec.concerns.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 text-yellow-700">Considerations</h4>
                              <ul className="text-sm space-y-1">
                                {rec.concerns.map((concern, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <AlertCircle className="h-3 w-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                    {concern}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-4 pt-3 border-t text-center">
                          <div>
                            <div className="text-lg font-bold">{rec.vendor.rating.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Rating</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">{rec.vendor.onTimeDelivery}%</div>
                            <div className="text-xs text-gray-500">On-Time</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">{rec.vendor.qualityScore}%</div>
                            <div className="text-xs text-gray-500">Quality</div>
                          </div>
                          <div>
                            <div className={`text-lg font-bold ${rec.vendor.avgPriceVsMarket <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {rec.vendor.avgPriceVsMarket > 0 ? '+' : ''}{rec.vendor.avgPriceVsMarket}%
                            </div>
                            <div className="text-xs text-gray-500">Price</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorSelection;