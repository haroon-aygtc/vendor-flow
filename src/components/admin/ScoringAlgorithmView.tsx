"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
    Calculator, Target, TrendingUp, TrendingDown, Minus,
    Zap, RefreshCw, Play, Settings
} from 'lucide-react';

interface ScoringWeights {
    onTimeDelivery: number;
    qualityScore: number;
    pricing: number;
    rating: number;
}

interface MockVendor {
    name: string;
    onTimeDelivery: number;
    qualityScore: number;
    avgPriceVsMarket: number;
    rating: number;
    performanceTrend: 'improving' | 'stable' | 'declining';
    color: string;
}

export default function ScoringAlgorithmView() {
    const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [isCalculating, setIsCalculating] = useState(false);
    const [animationStep, setAnimationStep] = useState(0);

    const mockVendors: MockVendor[] = [
        {
            name: 'TechCorp Solutions',
            onTimeDelivery: 95,
            qualityScore: 88,
            avgPriceVsMarket: -5,
            rating: 4.5,
            performanceTrend: 'improving',
            color: 'from-blue-500 to-blue-600'
        },
        {
            name: 'Global Supplies Ltd',
            onTimeDelivery: 82,
            qualityScore: 92,
            avgPriceVsMarket: 8,
            rating: 4.2,
            performanceTrend: 'stable',
            color: 'from-green-500 to-green-600'
        },
        {
            name: 'QuickServe Inc',
            onTimeDelivery: 78,
            qualityScore: 75,
            avgPriceVsMarket: -12,
            rating: 3.8,
            performanceTrend: 'declining',
            color: 'from-orange-500 to-orange-600'
        }
    ];

    const getWeights = (): ScoringWeights => {
        switch (urgencyLevel) {
            case 'high':
                return { onTimeDelivery: 50, qualityScore: 25, pricing: 15, rating: 10 };
            case 'low':
                return { onTimeDelivery: 20, qualityScore: 30, pricing: 40, rating: 10 };
            default:
                return { onTimeDelivery: 40, qualityScore: 30, pricing: 20, rating: 10 };
        }
    };

    const calculateVendorScore = (vendor: MockVendor): number => {
        const weights = getWeights();

        const onTimeScore = vendor.onTimeDelivery;
        const qualityScore = vendor.qualityScore;
        const pricingScore = Math.max(0, 100 + vendor.avgPriceVsMarket);
        const ratingScore = (vendor.rating / 5) * 100;

        let trendMultiplier = 1.0;
        switch (vendor.performanceTrend) {
            case 'improving': trendMultiplier = 1.1; break;
            case 'declining': trendMultiplier = 0.9; break;
            default: trendMultiplier = 1.0;
        }

        const weightedScore = (
            onTimeScore * (weights.onTimeDelivery / 100) +
            qualityScore * (weights.qualityScore / 100) +
            pricingScore * (weights.pricing / 100) +
            ratingScore * (weights.rating / 100)
        ) * trendMultiplier;

        return Math.round(weightedScore * 100) / 100;
    };

    const handleCalculateScores = () => {
        setIsCalculating(true);
        setAnimationStep(0);

        const interval = setInterval(() => {
            setAnimationStep(prev => {
                if (prev >= 4) {
                    clearInterval(interval);
                    setIsCalculating(false);
                    return 4;
                }
                return prev + 1;
            });
        }, 800);
    };

    const weights = getWeights();
    const rankedVendors = mockVendors
        .map(vendor => ({ ...vendor, score: calculateVendorScore(vendor) }))
        .sort((a, b) => b.score - a.score);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
            default: return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTrendMultiplier = (trend: string) => {
        switch (trend) {
            case 'improving': return '1.1x';
            case 'declining': return '0.9x';
            default: return '1.0x';
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Scoring Algorithm Visualization</h2>
                <p className="text-gray-600">Interactive demonstration of the multi-criteria vendor scoring system</p>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Algorithm Configuration</span>
                    </CardTitle>
                    <CardDescription>Adjust urgency level to see how weights change dynamically</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Urgency Level Selector */}
                        <div className="space-y-3">
                            <label className="font-medium text-sm">Urgency Level</label>
                            <div className="flex space-x-2">
                                {(['low', 'medium', 'high'] as const).map((level) => (
                                    <Button
                                        key={level}
                                        onClick={() => setUrgencyLevel(level)}
                                        variant={urgencyLevel === level ? 'default' : 'outline'}
                                        className="flex-1 capitalize"
                                    >
                                        {level} Urgency
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Weight Visualization */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {Object.entries(weights).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                        </span>
                                        <span className="text-sm font-bold">{value}%</span>
                                    </div>
                                    <Progress
                                        value={value}
                                        className="h-3"
                                        style={{
                                            transition: 'all 0.5s ease-in-out'
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={handleCalculateScores}
                            disabled={isCalculating}
                            className="w-full flex items-center space-x-2"
                        >
                            {isCalculating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            <span>{isCalculating ? 'Calculating...' : 'Run Calculation'}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Calculation Steps */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calculator className="h-5 w-5" />
                        <span>Calculation Process</span>
                    </CardTitle>
                    <CardDescription>Step-by-step scoring algorithm execution</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { step: 1, title: 'Raw Score Extraction', description: 'Extract base metrics from vendor data' },
                            { step: 2, title: 'Weight Application', description: 'Apply urgency-based weight multipliers' },
                            { step: 3, title: 'Weighted Calculation', description: 'Calculate weighted sum of all criteria' },
                            { step: 4, title: 'Trend Adjustment', description: 'Apply performance trend multipliers' },
                            { step: 5, title: 'Final Ranking', description: 'Sort vendors by final scores' }
                        ].map((item, index) => (
                            <div
                                key={item.step}
                                className={`
                  flex items-center space-x-4 p-4 border rounded-lg transition-all duration-500
                  ${animationStep >= index
                                        ? 'bg-blue-50 border-blue-200 scale-102'
                                        : 'bg-gray-50 border-gray-200'
                                    }
                `}
                            >
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${animationStep >= index
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-300 text-gray-600'
                                    }
                `}>
                                    {item.step}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm">{item.title}</h4>
                                    <p className="text-xs text-gray-600">{item.description}</p>
                                </div>
                                {animationStep >= index && (
                                    <div className="animate-pulse">
                                        <Zap className="h-5 w-5 text-blue-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Vendor Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span>Live Vendor Scoring</span>
                    </CardTitle>
                    <CardDescription>Real-time score calculation with current weights</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {rankedVendors.map((vendor, index) => (
                            <div
                                key={vendor.name}
                                className={`
                  p-6 border rounded-xl transition-all duration-500 hover:shadow-lg
                  ${index === 0 ? 'border-yellow-300 bg-yellow-50 ring-2 ring-yellow-200' : 'border-gray-200'}
                `}
                                style={{ animationDelay: `${index * 200}ms` }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-lg bg-gradient-to-r ${vendor.color}`}>
                                            <Target className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{vendor.name}</h3>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant={index === 0 ? 'default' : 'secondary'}>
                                                    Rank #{index + 1}
                                                </Badge>
                                                {getTrendIcon(vendor.performanceTrend)}
                                                <span className="text-xs text-gray-600 capitalize">
                                                    {vendor.performanceTrend} ({getTrendMultiplier(vendor.performanceTrend)})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-blue-600">{vendor.score}</div>
                                        <div className="text-sm text-gray-500">Final Score</div>
                                    </div>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500">On-Time Delivery</div>
                                        <div className="font-medium">{vendor.onTimeDelivery}%</div>
                                        <div className="text-xs text-blue-600">Weight: {weights.onTimeDelivery}%</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500">Quality Score</div>
                                        <div className="font-medium">{vendor.qualityScore}%</div>
                                        <div className="text-xs text-blue-600">Weight: {weights.qualityScore}%</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500">Price vs Market</div>
                                        <div className={`font-medium ${vendor.avgPriceVsMarket <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {vendor.avgPriceVsMarket > 0 ? '+' : ''}{vendor.avgPriceVsMarket}%
                                        </div>
                                        <div className="text-xs text-blue-600">Weight: {weights.pricing}%</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-gray-500">Rating</div>
                                        <div className="font-medium">{vendor.rating}/5</div>
                                        <div className="text-xs text-blue-600">Weight: {weights.rating}%</div>
                                    </div>
                                </div>

                                {/* Score Bar */}
                                <div className="mt-4">
                                    <Progress
                                        value={vendor.score}
                                        className={`h-2 ${index === 0 ? 'bg-yellow-200' : 'bg-gray-200'}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Algorithm Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Mathematical Formula</CardTitle>
                    <CardDescription>The complete scoring algorithm breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm space-y-2">
                        <div><strong>Step 1:</strong> Base Scores</div>
                        <div className="ml-4">• onTimeScore = onTimeDelivery</div>
                        <div className="ml-4">• qualityScore = qualityScore</div>
                        <div className="ml-4">• pricingScore = max(0, 100 + avgPriceVsMarket)</div>
                        <div className="ml-4">• ratingScore = (rating / 5) × 100</div>

                        <div className="pt-2"><strong>Step 2:</strong> Weighted Sum</div>
                        <div className="ml-4">
                            weightedSum = (onTimeScore × {weights.onTimeDelivery}%) +
                            (qualityScore × {weights.qualityScore}%) +
                            (pricingScore × {weights.pricing}%) +
                            (ratingScore × {weights.rating}%)
                        </div>

                        <div className="pt-2"><strong>Step 3:</strong> Final Score</div>
                        <div className="ml-4">finalScore = weightedSum × trendMultiplier</div>
                        <div className="ml-4 text-xs text-gray-600">
                            (improving: 1.1x, stable: 1.0x, declining: 0.9x)
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
