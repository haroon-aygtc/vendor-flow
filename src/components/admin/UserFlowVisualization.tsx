"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    User, Brain, Database, Upload, Settings, BarChart3,
    CheckCircle, ArrowRight, Play, RotateCcw, Clock
} from 'lucide-react';

export default function UserFlowVisualization() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [completedSteps, setCompletedSteps] = useState(new Set());

    const userFlowSteps = [
        {
            id: 'start',
            title: 'System Entry',
            description: 'User opens Smart Vendor Selection',
            icon: <User className="h-5 w-5" />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            actions: ['Navigate to application', 'View dashboard overview'],
            duration: 2
        },
        {
            id: 'setup-agents',
            title: 'AI Agent Setup',
            description: 'Create or select AI agents',
            icon: <Brain className="h-5 w-5" />,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            actions: ['Check existing agents', 'Create new agent if needed', 'Configure prompts & parameters'],
            duration: 3
        },
        {
            id: 'data-import',
            title: 'Vendor Data Import',
            description: 'Upload vendor performance data',
            icon: <Upload className="h-5 w-5" />,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            actions: ['Upload CSV file', 'Validate data format', 'Store vendor information'],
            duration: 2
        },
        {
            id: 'requirements',
            title: 'Define Requirements',
            description: 'Specify procurement needs',
            icon: <Settings className="h-5 w-5" />,
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            actions: ['Select category', 'Enter description & budget', 'Set urgency level'],
            duration: 2
        },
        {
            id: 'analysis',
            title: 'AI Analysis',
            description: 'Run intelligent vendor evaluation',
            icon: <BarChart3 className="h-5 w-5" />,
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            actions: ['Execute AI analysis', 'Calculate vendor scores', 'Generate reasoning'],
            duration: 4
        },
        {
            id: 'results',
            title: 'Review Results',
            description: 'Analyze recommendations',
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            actions: ['View top 3 vendors', 'Read AI analysis', 'Make final decision'],
            duration: 3
        }
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentStep(prev => {
                    const nextStep = (prev + 1) % userFlowSteps.length;
                    if (nextStep === 0) {
                        setCompletedSteps(new Set());
                    } else {
                        setCompletedSteps(prevCompleted => new Set([...prevCompleted, prev]));
                    }
                    return nextStep;
                });
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [isPlaying, userFlowSteps.length]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStep(0);
        setCompletedSteps(new Set());
    };

    const progress = ((currentStep + 1) / userFlowSteps.length) * 100;

    return (
        <div className="space-y-6">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">User Journey Visualization</h2>
                <p className="text-gray-600">Interactive walkthrough of the complete user experience</p>

                {/* Controls */}
                <div className="flex justify-center items-center space-x-4">
                    <Button
                        onClick={handlePlayPause}
                        variant={isPlaying ? "default" : "outline"}
                        className="flex items-center space-x-2"
                    >
                        <Play className="h-4 w-4" />
                        <span>{isPlaying ? 'Pause' : 'Play'} Journey</span>
                    </Button>

                    <Button onClick={handleReset} variant="outline" className="flex items-center space-x-2">
                        <RotateCcw className="h-4 w-4" />
                        <span>Reset</span>
                    </Button>
                </div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Step {currentStep + 1} of {userFlowSteps.length}</span>
                        <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            {/* User Flow Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {userFlowSteps.map((step, index) => {
                    const isActive = currentStep === index;
                    const isCompleted = completedSteps.has(index);
                    const isUpcoming = index > currentStep;

                    return (
                        <Card
                            key={step.id}
                            className={`
                relative transition-all duration-500 transform
                ${isActive ? 'scale-105 shadow-xl ring-2 ring-blue-500' : 'hover:scale-102'}
                ${isCompleted ? 'opacity-75' : ''}
                ${isUpcoming ? 'opacity-50' : ''}
                ${step.borderColor}
              `}
                        >
                            {/* Status Indicator */}
                            <div className="absolute -top-2 -right-2 z-10">
                                {isCompleted && (
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                )}
                                {isActive && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Animated Background */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 opacity-10 animate-pulse"></div>
                            )}

                            <CardHeader className={`${step.bgColor} relative z-10`}>
                                <CardTitle className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-r ${step.color}`}>
                                        <div className="text-white">
                                            {step.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-semibold">{step.title}</span>
                                            <Badge variant="outline" className="text-xs">
                                                Step {index + 1}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardTitle>
                                <CardDescription>{step.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="relative z-10">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-gray-700">Actions:</h4>
                                    {step.actions.map((action, actionIndex) => (
                                        <div
                                            key={action}
                                            className={`
                        flex items-center space-x-2 p-2 rounded transition-all duration-300
                        ${isActive
                                                    ? 'bg-white shadow-sm transform translate-x-1'
                                                    : 'bg-transparent'
                                                }
                      `}
                                            style={{
                                                transitionDelay: `${actionIndex * 150}ms`,
                                                opacity: isActive ? 1 : 0.7
                                            }}
                                        >
                                            <div className={`
                        w-2 h-2 rounded-full transition-colors duration-300
                        ${isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300'}
                      `}></div>
                                            <span className="text-xs">{action}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Duration Indicator */}
                                <div className="mt-4 flex items-center space-x-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                        ~{step.duration} minute{step.duration > 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Active Step Animation */}
                                {isActive && (
                                    <div className="mt-3">
                                        <Progress
                                            value={100}
                                            className="h-1 bg-blue-100"
                                            style={{
                                                animation: 'progress-fill 3s ease-in-out infinite'
                                            }}
                                        />
                                    </div>
                                )}
                            </CardContent>

                            {/* Connection Arrow */}
                            {index < userFlowSteps.length - 1 && (
                                <div className="hidden xl:block absolute -right-12 top-1/2 transform -translate-y-1/2 z-20">
                                    <ArrowRight
                                        className={`
                      h-8 w-8 transition-all duration-500
                      ${isActive
                                                ? 'text-blue-500 scale-125 animate-bounce'
                                                : isCompleted
                                                    ? 'text-green-500'
                                                    : 'text-gray-300'
                                            }
                    `}
                                    />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Journey Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Journey Summary</CardTitle>
                    <CardDescription>Complete user experience overview</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-blue-600">
                                {userFlowSteps.reduce((total, step) => total + step.duration, 0)}
                            </div>
                            <div className="text-sm text-gray-600">Total Minutes</div>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-green-600">{userFlowSteps.length}</div>
                            <div className="text-sm text-gray-600">Key Steps</div>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-3xl font-bold text-purple-600">4</div>
                            <div className="text-sm text-gray-600">Main Tabs</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            <strong>Key Success Factors:</strong> The user journey is designed to be intuitive and guided,
                            with clear visual feedback at each step. The system provides real-time validation and
                            helpful tooltips to ensure users can complete their vendor selection efficiently.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <style jsx>{`
        @keyframes progress-fill {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `}</style>
        </div>
    );
}
