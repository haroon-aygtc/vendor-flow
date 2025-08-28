"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Layers, Database, Brain, Zap, Globe, FileText,
    Settings, ChevronRight, Activity, Cpu, Cloud
} from 'lucide-react';

export default function SystemArchitecture() {
    const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
    const [animationStep, setAnimationStep] = useState(0);

    useEffect(() => {
        // Animate layers one by one on mount
        const timer = setInterval(() => {
            setAnimationStep(prev => prev < 4 ? prev + 1 : prev);
        }, 800);

        return () => clearInterval(timer);
    }, []);

    const layers = [
        {
            id: 'presentation',
            name: 'Presentation Layer',
            color: 'from-orange-400 to-red-500',
            textColor: 'text-orange-700',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            components: [
                { name: 'AI Analysis Tab', icon: <Brain className="h-4 w-4" />, status: 'active' },
                { name: 'Vendor Database Tab', icon: <Database className="h-4 w-4" />, status: 'active' },
                { name: 'Data Import Tab', icon: <FileText className="h-4 w-4" />, status: 'active' },
                { name: 'Recommendations Tab', icon: <Activity className="h-4 w-4" />, status: 'active' }
            ],
            description: 'User interface components providing interactive dashboards and data visualization'
        },
        {
            id: 'business',
            name: 'Business Logic Layer',
            color: 'from-green-400 to-emerald-500',
            textColor: 'text-green-700',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            components: [
                { name: 'Procurement Requirements', icon: <Settings className="h-4 w-4" />, status: 'active' },
                { name: 'Vendor Filtering', icon: <Database className="h-4 w-4" />, status: 'active' },
                { name: 'Weight Calculation', icon: <Cpu className="h-4 w-4" />, status: 'active' },
                { name: 'Recommendation Ranking', icon: <Activity className="h-4 w-4" />, status: 'active' }
            ],
            description: 'Core business processes handling vendor evaluation and recommendation logic'
        },
        {
            id: 'ai',
            name: 'AI Processing Layer',
            color: 'from-purple-400 to-pink-500',
            textColor: 'text-purple-700',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            components: [
                { name: 'AI Analysis Engine', icon: <Brain className="h-4 w-4" />, status: 'active' },
                { name: 'Scoring Algorithm', icon: <Zap className="h-4 w-4" />, status: 'active' },
                { name: 'Reasoning Generator', icon: <FileText className="h-4 w-4" />, status: 'active' },
                { name: 'Provider Integration', icon: <Cloud className="h-4 w-4" />, status: 'active' }
            ],
            description: 'Artificial intelligence components providing intelligent analysis and scoring'
        },
        {
            id: 'data',
            name: 'Data Layer',
            color: 'from-blue-400 to-cyan-500',
            textColor: 'text-blue-700',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            components: [
                { name: 'Vendor Database', icon: <Database className="h-4 w-4" />, status: 'active' },
                { name: 'AI Agents Storage', icon: <Brain className="h-4 w-4" />, status: 'active' },
                { name: 'CSV Import System', icon: <FileText className="h-4 w-4" />, status: 'active' },
                { name: 'Configuration Cache', icon: <Settings className="h-4 w-4" />, status: 'active' }
            ],
            description: 'Data persistence and storage systems managing all application state'
        }
    ];

    const externalIntegrations = [
        { name: 'OpenAI', icon: '🤖', status: 'connected', description: 'GPT-4, GPT-3.5 Turbo' },
        { name: 'Anthropic', icon: '🧠', status: 'connected', description: 'Claude 3.5 Sonnet' },
        { name: 'Google AI', icon: '🔍', status: 'connected', description: 'Gemini 1.5 Pro' },
        { name: 'Groq', icon: '⚡', status: 'connected', description: 'Ultra-fast inference' }
    ];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">System Architecture Overview</h2>
                <p className="text-gray-600">Interactive visualization of the Smart Vendor Selection system layers</p>
            </div>

            {/* Architecture Diagram */}
            <div className="relative">
                <div className="space-y-4">
                    {layers.map((layer, index) => (
                        <div
                            key={layer.id}
                            className={`
                relative transition-all duration-1000 transform
                ${animationStep > index ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
                ${selectedLayer === layer.id ? 'scale-102 shadow-lg' : 'hover:scale-101'}
              `}
                            style={{ transitionDelay: `${index * 200}ms` }}
                        >
                            <Card
                                className={`
                  cursor-pointer transition-all duration-300 
                  ${layer.borderColor} ${selectedLayer === layer.id ? 'ring-2 ring-blue-500' : ''}
                  hover:shadow-md
                `}
                                onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
                            >
                                <CardHeader className={`${layer.bgColor} border-b ${layer.borderColor}`}>
                                    <CardTitle className={`flex items-center justify-between ${layer.textColor}`}>
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 bg-gradient-to-r ${layer.color} rounded-lg`}>
                                                <Layers className="h-5 w-5 text-white" />
                                            </div>
                                            <span>{layer.name}</span>
                                        </div>
                                        <ChevronRight
                                            className={`h-5 w-5 transition-transform duration-300 ${selectedLayer === layer.id ? 'rotate-90' : ''
                                                }`}
                                        />
                                    </CardTitle>
                                    <CardDescription>{layer.description}</CardDescription>
                                </CardHeader>

                                {selectedLayer === layer.id && (
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {layer.components.map((component, idx) => (
                                                <div
                                                    key={component.name}
                                                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    <div className="p-2 bg-gray-100 rounded-md">
                                                        {component.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-sm">{component.name}</span>
                                                            <Badge
                                                                variant={component.status === 'active' ? 'default' : 'secondary'}
                                                                className="text-xs"
                                                            >
                                                                {component.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Connection lines */}
                            {index < layers.length - 1 && (
                                <div className="flex justify-center py-2">
                                    <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-transparent"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Data Flow Arrows */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-8">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="w-8 h-8 flex items-center justify-center"
                            style={{
                                animation: `pulse 2s infinite ${i * 0.3}s`,
                            }}
                        >
                            <ChevronRight className="h-5 w-5 text-blue-500" />
                        </div>
                    ))}
                </div>
            </div>

            {/* External Integrations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5" />
                        <span>External AI Provider Integrations</span>
                    </CardTitle>
                    <CardDescription>Real-time API connections to leading AI providers</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {externalIntegrations.map((provider, index) => (
                            <div
                                key={provider.name}
                                className="p-4 border rounded-lg text-center hover:shadow-md transition-all duration-300 hover:scale-105"
                                style={{
                                    animationDelay: `${index * 150}ms`,
                                    animation: animationStep >= 4 ? `fadeInUp 0.6s ease-out ${index * 150}ms both` : 'none'
                                }}
                            >
                                <div className="text-3xl mb-2">{provider.icon}</div>
                                <h4 className="font-semibold text-sm">{provider.name}</h4>
                                <p className="text-xs text-gray-600 mt-1">{provider.description}</p>
                                <div className="mt-3">
                                    <Badge
                                        variant={provider.status === 'connected' ? 'default' : 'secondary'}
                                        className="text-xs"
                                    >
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                        {provider.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }
      `}</style>
        </div>
    );
}
