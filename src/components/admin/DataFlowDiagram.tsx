"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText, Database, Brain, Zap, ChevronRight,
    Upload, Settings, Target, TrendingUp, Play, Pause
} from 'lucide-react';

export default function DataFlowDiagram() {
    const [isAnimating, setIsAnimating] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    const flowSteps = [
        {
            id: 'input',
            title: 'Data Input',
            description: 'CSV upload and user requirements',
            icon: <Upload className="h-5 w-5" />,
            color: 'from-blue-400 to-blue-600',
            bgColor: 'bg-blue-50',
            items: ['CSV File Upload', 'Procurement Requirements', 'AI Agent Selection']
        },
        {
            id: 'processing',
            title: 'Data Processing',
            description: 'Parsing, validation, and storage',
            icon: <Settings className="h-5 w-5" />,
            color: 'from-green-400 to-green-600',
            bgColor: 'bg-green-50',
            items: ['CSV Parsing & Validation', 'Vendor Data Storage', 'Category Filtering']
        },
        {
            id: 'ai',
            title: 'AI Analysis',
            description: 'Intelligent vendor evaluation',
            icon: <Brain className="h-5 w-5" />,
            color: 'from-purple-400 to-purple-600',
            bgColor: 'bg-purple-50',
            items: ['AI Prompt Construction', 'Provider API Request', 'Response Processing']
        },
        {
            id: 'scoring',
            title: 'Scoring Engine',
            description: 'Multi-criteria evaluation',
            icon: <Target className="h-5 w-5" />,
            color: 'from-orange-400 to-orange-600',
            bgColor: 'bg-orange-50',
            items: ['Weight Calculation', 'Score Computation', 'Trend Adjustment']
        },
        {
            id: 'output',
            title: 'Results',
            description: 'Ranked recommendations',
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'from-emerald-400 to-emerald-600',
            bgColor: 'bg-emerald-50',
            items: ['Generate Reasoning', 'Rank Vendors', 'Display Results']
        }
    ];

    useEffect(() => {
        if (!isAnimating) return;

        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % flowSteps.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isAnimating, flowSteps.length]);

    const dataPoints = [
        { label: 'Vendor Performance Data', value: 'CSV Format', type: 'input' },
        { label: 'On-time Delivery %', value: '0-100', type: 'metric' },
        { label: 'Quality Score %', value: '0-100', type: 'metric' },
        { label: 'Price vs Market %', value: 'Negative = Better', type: 'metric' },
        { label: 'Vendor Rating', value: '0-5 Scale', type: 'metric' },
        { label: 'Performance Trend', value: 'Improving/Stable/Declining', type: 'trend' }
    ];

    const scoringWeights = [
        { criteria: 'On-time Delivery', default: 40, high: 50, low: 20, color: 'bg-blue-500' },
        { criteria: 'Quality Score', default: 30, high: 25, low: 30, color: 'bg-green-500' },
        { criteria: 'Pricing', default: 20, high: 15, low: 40, color: 'bg-orange-500' },
        { criteria: 'Rating', default: 10, high: 10, low: 10, color: 'bg-purple-500' }
    ];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Data Flow Visualization</h2>
                <p className="text-gray-600">Real-time data processing pipeline with animated flow</p>

                <div className="flex justify-center mt-4">
                    <Button
                        onClick={() => setIsAnimating(!isAnimating)}
                        variant={isAnimating ? "default" : "outline"}
                        className="flex items-center space-x-2"
                    >
                        {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        <span>{isAnimating ? 'Pause' : 'Play'} Animation</span>
                    </Button>
                </div>
            </div>

            {/* Main Data Flow */}
            <Card>
                <CardHeader>
                    <CardTitle>Processing Pipeline</CardTitle>
                    <CardDescription>Step-by-step data transformation and analysis flow</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        {/* Flow Steps */}
                        <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0 lg:space-x-4">
                            {flowSteps.map((step, index) => (
                                <div key={step.id} className="flex flex-col items-center space-y-4">
                                    {/* Step Card */}
                                    <div
                                        className={`
                      relative w-48 p-4 rounded-xl border-2 transition-all duration-500
                      ${currentStep === index
                                                ? 'border-blue-500 shadow-lg scale-105 ring-4 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                      ${step.bgColor}
                    `}
                                    >
                                        {/* Animated glow effect */}
                                        {currentStep === index && (
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
                                        )}

                                        <div className="relative z-10">
                                            <div className={`p-3 rounded-lg bg-gradient-to-r ${step.color} mb-3 w-fit`}>
                                                <div className="text-white">
                                                    {step.icon}
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                                            <p className="text-xs text-gray-600 mb-3">{step.description}</p>

                                            <div className="space-y-1">
                                                {step.items.map((item, idx) => (
                                                    <div
                                                        key={item}
                                                        className={`
                              text-xs p-1 rounded transition-all duration-300
                              ${currentStep === index
                                                                ? 'bg-white shadow-sm transform translate-x-1'
                                                                : 'bg-transparent'
                                                            }
                            `}
                                                        style={{
                                                            transitionDelay: `${idx * 100}ms`,
                                                            opacity: currentStep === index ? 1 : 0.7
                                                        }}
                                                    >
                                                        • {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    {index < flowSteps.length - 1 && (
                                        <div className="hidden lg:block absolute" style={{ left: `${(index + 1) * 20}%` }}>
                                            <ChevronRight
                                                className={`
                          h-6 w-6 transition-all duration-500
                          ${currentStep === index
                                                        ? 'text-blue-500 scale-125 animate-bounce'
                                                        : 'text-gray-400'
                                                    }
                        `}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mobile arrows */}
                        <div className="lg:hidden flex flex-col items-center space-y-2 mt-4">
                            {flowSteps.slice(0, -1).map((_, index) => (
                                <ChevronRight
                                    key={index}
                                    className={`
                    h-6 w-6 rotate-90 transition-all duration-500
                    ${currentStep === index
                                            ? 'text-blue-500 scale-125 animate-bounce'
                                            : 'text-gray-400'
                                        }
                  `}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Format Specifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>Data Input Format</span>
                        </CardTitle>
                        <CardDescription>Required CSV structure and data types</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {dataPoints.map((point, index) => (
                                <div
                                    key={point.label}
                                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animation: 'fadeInLeft 0.6s ease-out both'
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Badge
                                            variant={point.type === 'input' ? 'default' : point.type === 'metric' ? 'secondary' : 'outline'}
                                            className="text-xs"
                                        >
                                            {point.type}
                                        </Badge>
                                        <span className="font-medium text-sm">{point.label}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{point.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="h-5 w-5" />
                            <span>Scoring Weights</span>
                        </CardTitle>
                        <CardDescription>Dynamic weight adjustment based on urgency</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {scoringWeights.map((weight, index) => (
                                <div key={weight.criteria} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-sm">{weight.criteria}</span>
                                        <div className="flex space-x-2 text-xs">
                                            <span className="text-gray-500">L:{weight.low}%</span>
                                            <span className="font-medium">M:{weight.default}%</span>
                                            <span className="text-gray-500">H:{weight.high}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${weight.color} transition-all duration-1000`}
                                            style={{
                                                width: `${weight.default}%`,
                                                animationDelay: `${index * 200}ms`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">
                                <strong>L</strong> = Low urgency (cost priority),
                                <strong>M</strong> = Medium urgency (balanced),
                                <strong>H</strong> = High urgency (speed priority)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
        </div>
    );
}
