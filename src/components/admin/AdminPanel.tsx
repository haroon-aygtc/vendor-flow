"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    BarChart3, Brain, Database, Zap, TrendingUp, Users,
    GitBranch, FileText, Settings, ChevronRight, Activity,
    Layers, Workflow, Target, Clock, CheckCircle
} from 'lucide-react';
import SystemArchitecture from './SystemArchitecture';
import DataFlowDiagram from './DataFlowDiagram';
import UserFlowVisualization from './UserFlowVisualization';
import ScoringAlgorithmView from './ScoringAlgorithmView';
import SystemMetrics from './SystemMetrics';

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState("overview");
    const [systemStats, setSystemStats] = useState({
        totalVendors: 0,
        activeAgents: 0,
        totalAnalyses: 0,
        systemUptime: "99.9%"
    });

    useEffect(() => {
        // Load system statistics
        loadSystemStats();
    }, []);

    const loadSystemStats = () => {
        // Get data from localStorage to show real stats
        const vendors = JSON.parse(localStorage.getItem('vendor-database') || '[]');
        const agents = JSON.parse(localStorage.getItem('ai-agents') || '[]');

        setSystemStats({
            totalVendors: vendors.length,
            activeAgents: agents.filter((a: any) => a.status === 'active').length,
            totalAnalyses: agents.reduce((total: number, agent: any) => total + (agent.totalRuns || 0), 0),
            systemUptime: "99.9%"
        });
    };

    const systemComponents = [
        {
            name: "AI Processing Layer",
            status: "active",
            description: "OpenAI, Anthropic, Google AI, Groq integrations",
            icon: <Brain className="h-5 w-5 text-purple-500" />,
            metrics: "4 providers connected"
        },
        {
            name: "Scoring Engine",
            status: "active",
            description: "Multi-criteria vendor evaluation algorithm",
            icon: <Target className="h-5 w-5 text-green-500" />,
            metrics: "Dynamic weight calculation"
        },
        {
            name: "Data Pipeline",
            status: "active",
            description: "CSV import and vendor data processing",
            icon: <Database className="h-5 w-5 text-blue-500" />,
            metrics: `${systemStats.totalVendors} vendors loaded`
        },
        {
            name: "User Interface",
            status: "active",
            description: "React-based interactive dashboard",
            icon: <Activity className="h-5 w-5 text-orange-500" />,
            metrics: "4 main modules"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                            <Layers className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Smart Vendor Selection
                            </h1>
                            <p className="text-lg text-gray-600">System Architecture & Analytics Dashboard</p>
                        </div>
                    </div>

                    {/* Real-time system status */}
                    <div className="flex items-center justify-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-700">System Online</span>
                        </div>
                        <div className="text-sm text-gray-500">Uptime: {systemStats.systemUptime}</div>
                        <div className="text-sm text-gray-500">Last Updated: {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-600 text-sm font-medium">Total Vendors</p>
                                    <p className="text-3xl font-bold text-blue-700">{systemStats.totalVendors}</p>
                                </div>
                                <Database className="h-12 w-12 text-blue-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-600 text-sm font-medium">Active Agents</p>
                                    <p className="text-3xl font-bold text-purple-700">{systemStats.activeAgents}</p>
                                </div>
                                <Brain className="h-12 w-12 text-purple-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-600 text-sm font-medium">Total Analyses</p>
                                    <p className="text-3xl font-bold text-green-700">{systemStats.totalAnalyses}</p>
                                </div>
                                <BarChart3 className="h-12 w-12 text-green-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-600 text-sm font-medium">System Health</p>
                                    <p className="text-2xl font-bold text-orange-700">Excellent</p>
                                </div>
                                <CheckCircle className="h-12 w-12 text-orange-500 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* System Components Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Workflow className="h-5 w-5" />
                            <span>System Components</span>
                        </CardTitle>
                        <CardDescription>Real-time status of all system components</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {systemComponents.map((component, index) => (
                                <div
                                    key={component.name}
                                    className="p-4 border rounded-lg hover:shadow-md transition-all duration-300"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-start space-x-3">
                                        {component.icon}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-medium text-sm">{component.name}</h4>
                                                <Badge
                                                    variant={component.status === 'active' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {component.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{component.description}</p>
                                            <p className="text-xs text-blue-600 font-medium mt-2">{component.metrics}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <Card>
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="px-6 pt-6">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="overview" className="flex items-center space-x-2">
                                        <BarChart3 className="h-4 w-4" />
                                        <span>Overview</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="architecture" className="flex items-center space-x-2">
                                        <Layers className="h-4 w-4" />
                                        <span>Architecture</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="dataflow" className="flex items-center space-x-2">
                                        <GitBranch className="h-4 w-4" />
                                        <span>Data Flow</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="userflow" className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span>User Flow</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="algorithm" className="flex items-center space-x-2">
                                        <Zap className="h-4 w-4" />
                                        <span>Algorithm</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="p-6">
                                <TabsContent value="overview" className="mt-0">
                                    <SystemMetrics />
                                </TabsContent>

                                <TabsContent value="architecture" className="mt-0">
                                    <SystemArchitecture />
                                </TabsContent>

                                <TabsContent value="dataflow" className="mt-0">
                                    <DataFlowDiagram />
                                </TabsContent>

                                <TabsContent value="userflow" className="mt-0">
                                    <UserFlowVisualization />
                                </TabsContent>

                                <TabsContent value="algorithm" className="mt-0">
                                    <ScoringAlgorithmView />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
