"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Activity, Database, Brain, Zap, TrendingUp, Clock,
    CheckCircle, AlertCircle, Server, Cpu, BarChart3
} from 'lucide-react';

export default function SystemMetrics() {
    const [realtimeData, setRealtimeData] = useState({
        systemLoad: 12,
        memoryUsage: 68,
        activeConnections: 4,
        responseTime: 245
    });

    const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);

    useEffect(() => {
        // Simulate real-time data updates
        const interval = setInterval(() => {
            setRealtimeData(prev => ({
                systemLoad: Math.max(5, Math.min(95, prev.systemLoad + (Math.random() - 0.5) * 10)),
                memoryUsage: Math.max(40, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 8)),
                activeConnections: Math.max(1, Math.min(10, prev.activeConnections + Math.floor((Math.random() - 0.5) * 3))),
                responseTime: Math.max(50, Math.min(500, prev.responseTime + (Math.random() - 0.5) * 50))
            }));

            setPerformanceHistory(prev => {
                const newHistory = [...prev, Math.random() * 100];
                return newHistory.length > 20 ? newHistory.slice(1) : newHistory;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Get system statistics from localStorage
    const getSystemStats = () => {
        const vendors = JSON.parse(localStorage.getItem('vendor-database') || '[]');
        const agents = JSON.parse(localStorage.getItem('ai-agents') || '[]');

        const totalAnalyses = agents.reduce((total: number, agent: any) => total + (agent.totalRuns || 0), 0);
        const activeAgents = agents.filter((a: any) => a.status === 'active').length;

        return {
            totalVendors: vendors.length,
            activeAgents,
            totalAnalyses,
            avgVendorRating: vendors.length > 0
                ? vendors.reduce((sum: number, v: any) => sum + (v.rating || 0), 0) / vendors.length
                : 0
        };
    };

    const stats = getSystemStats();

    const systemHealth = [
        {
            component: 'AI Processing Engine',
            status: 'operational',
            uptime: '99.9%',
            lastCheck: '2 mins ago',
            icon: <Brain className="h-5 w-5" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            component: 'Scoring Algorithm',
            status: 'operational',
            uptime: '100%',
            lastCheck: '1 min ago',
            icon: <Zap className="h-5 w-5" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            component: 'Data Pipeline',
            status: 'operational',
            uptime: '99.7%',
            lastCheck: '30 secs ago',
            icon: <Database className="h-5 w-5" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            component: 'API Integrations',
            status: 'degraded',
            uptime: '98.2%',
            lastCheck: '5 mins ago',
            icon: <Server className="h-5 w-5" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        }
    ];

    const performanceMetrics = [
        {
            name: 'Analysis Accuracy',
            value: 94.8,
            target: 95,
            unit: '%',
            trend: 'up',
            color: 'bg-blue-500'
        },
        {
            name: 'Processing Speed',
            value: 1.2,
            target: 2.0,
            unit: 's',
            trend: 'up',
            color: 'bg-green-500'
        },
        {
            name: 'User Satisfaction',
            value: 4.6,
            target: 4.5,
            unit: '/5',
            trend: 'up',
            color: 'bg-purple-500'
        },
        {
            name: 'Cost Efficiency',
            value: 87.3,
            target: 85,
            unit: '%',
            trend: 'up',
            color: 'bg-orange-500'
        }
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'operational':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'degraded':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">System Overview & Metrics</h2>
                <p className="text-gray-600">Real-time monitoring and performance analytics</p>
            </div>

            {/* Key Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 text-sm font-medium">Vendor Database</p>
                                <p className="text-3xl font-bold text-blue-700">{stats.totalVendors}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Avg Rating: {stats.avgVendorRating.toFixed(1)}/5
                                </p>
                            </div>
                            <Database className="h-12 w-12 text-blue-500 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 text-sm font-medium">Active AI Agents</p>
                                <p className="text-3xl font-bold text-purple-700">{stats.activeAgents}</p>
                                <p className="text-xs text-purple-600 mt-1">Ready for analysis</p>
                            </div>
                            <Brain className="h-12 w-12 text-purple-500 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-medium">Total Analyses</p>
                                <p className="text-3xl font-bold text-green-700">{stats.totalAnalyses}</p>
                                <p className="text-xs text-green-600 mt-1">Completed successfully</p>
                            </div>
                            <BarChart3 className="h-12 w-12 text-green-500 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium">System Load</p>
                                <p className="text-3xl font-bold text-orange-700">{Math.round(realtimeData.systemLoad)}%</p>
                                <p className="text-xs text-orange-600 mt-1">Current utilization</p>
                            </div>
                            <Cpu className="h-12 w-12 text-orange-500 opacity-80" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Health Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>System Health Dashboard</span>
                    </CardTitle>
                    <CardDescription>Real-time monitoring of all system components</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {systemHealth.map((component, index) => (
                            <div
                                key={component.component}
                                className={`
                  p-4 border rounded-lg transition-all duration-300 hover:shadow-md
                  ${component.bgColor} ${component.borderColor}
                `}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg bg-white ${component.color}`}>
                                            {component.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">{component.component}</h4>
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(component.status)}
                                                <span className="text-xs capitalize font-medium">{component.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {component.uptime}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Last Check: {component.lastCheck}</span>
                                    <span className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3" />
                                        <span>Monitoring</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>Performance Metrics</span>
                    </CardTitle>
                    <CardDescription>Key performance indicators and targets</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {performanceMetrics.map((metric, index) => (
                            <div key={metric.name} className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{metric.name}</span>
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-2xl font-bold">
                                            {metric.value}{metric.unit}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Target: {metric.target}{metric.unit}
                                        </span>
                                    </div>

                                    <Progress
                                        value={(metric.value / (metric.target * 1.2)) * 100}
                                        className="h-2"
                                    />

                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-500">0</span>
                                        <span className="text-gray-500">{metric.target * 1.2}{metric.unit}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Real-time Monitoring */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Real-time System Resources</CardTitle>
                        <CardDescription>Current system utilization metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>CPU Usage</span>
                                <span>{Math.round(realtimeData.systemLoad)}%</span>
                            </div>
                            <Progress value={realtimeData.systemLoad} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Memory Usage</span>
                                <span>{Math.round(realtimeData.memoryUsage)}%</span>
                            </div>
                            <Progress value={realtimeData.memoryUsage} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Active Connections</span>
                                <span>{realtimeData.activeConnections}/10</span>
                            </div>
                            <Progress value={(realtimeData.activeConnections / 10) * 100} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Response Time</span>
                                <span>{Math.round(realtimeData.responseTime)}ms</span>
                            </div>
                            <Progress value={Math.min((realtimeData.responseTime / 500) * 100, 100)} className="h-2" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Activity Timeline</CardTitle>
                        <CardDescription>Recent system events and activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { time: '2 mins ago', event: 'AI analysis completed', type: 'success' },
                                { time: '5 mins ago', event: 'Vendor data imported', type: 'info' },
                                { time: '12 mins ago', event: 'New agent created', type: 'success' },
                                { time: '18 mins ago', event: 'System backup completed', type: 'info' },
                                { time: '25 mins ago', event: 'Performance optimization', type: 'warning' }
                            ].map((activity, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <div className={`
                    w-3 h-3 rounded-full
                    ${activity.type === 'success' ? 'bg-green-500' :
                                            activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}
                  `}></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{activity.event}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
