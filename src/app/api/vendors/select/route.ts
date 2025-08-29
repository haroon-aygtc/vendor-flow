import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors, agents, activities } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

interface VendorScore {
  vendor: any;
  score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
}

async function analyzeVendorWithAI(vendor: any, requirements: string, agentId: string): Promise<VendorScore> {
  // Get agent details
  const agentResult = await db.select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (agentResult.length === 0) {
    throw new Error('Agent not found');
  }

  const agent = agentResult[0];

  const analysisPrompt = `${agent.prompt}

Analyze this vendor for the given procurement requirements:

Vendor Details:
- Name: ${vendor.name}
- Category: ${vendor.category}
- Rating: ${vendor.rating}/5
- On-time Delivery: ${vendor.onTimeDelivery}%
- Quality Score: ${vendor.qualityScore}%
- Price vs Market: ${vendor.avgPriceVsMarket}% (negative means cheaper)
- Completed Orders: ${vendor.completedOrders}
- Performance Trend: ${vendor.performanceTrend}

Requirements:
${requirements}

Please analyze this vendor and respond in JSON format:
{
  "score": 85,
  "reasoning": "Brief explanation of the score",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"]
}

Score should be 0-100 based on how well the vendor matches the requirements.`;

  try {
    // Call AI provider
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a procurement expert. Always respond with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    return {
      vendor,
      score: aiResponse.score || 50,
      reasoning: aiResponse.reasoning || 'AI analysis completed',
      strengths: aiResponse.strengths || [],
      concerns: aiResponse.concerns || []
    };
  } catch (error) {
    console.error('AI analysis error:', error);

    // Fallback scoring algorithm
    let score = 0;

    // Base score from rating (0-25 points)
    score += (vendor.rating / 5) * 25;

    // On-time delivery (0-25 points)
    score += (vendor.onTimeDelivery / 100) * 25;

    // Quality score (0-25 points)
    score += (vendor.qualityScore / 100) * 25;

    // Price competitiveness (0-25 points)
    if (vendor.avgPriceVsMarket <= -10) score += 25; // Very competitive
    else if (vendor.avgPriceVsMarket <= 0) score += 20; // Competitive
    else if (vendor.avgPriceVsMarket <= 10) score += 15; // Fair
    else score += 10; // Expensive

    // Performance trend bonus/penalty
    if (vendor.performanceTrend === 'improving') score += 5;
    else if (vendor.performanceTrend === 'declining') score -= 5;

    // Experience bonus
    if (vendor.completedOrders > 100) score += 5;
    else if (vendor.completedOrders > 50) score += 3;

    return {
      vendor,
      score: Math.min(100, Math.max(0, score)),
      reasoning: 'Algorithmic scoring based on vendor metrics',
      strengths: [
        vendor.rating >= 4 ? 'High customer rating' : null,
        vendor.onTimeDelivery >= 90 ? 'Excellent delivery record' : null,
        vendor.qualityScore >= 85 ? 'High quality standards' : null,
        vendor.avgPriceVsMarket <= 0 ? 'Competitive pricing' : null
      ].filter(Boolean),
      concerns: [
        vendor.rating < 3 ? 'Low customer rating' : null,
        vendor.onTimeDelivery < 80 ? 'Delivery reliability concerns' : null,
        vendor.qualityScore < 70 ? 'Quality concerns' : null,
        vendor.avgPriceVsMarket > 15 ? 'Above market pricing' : null
      ].filter(Boolean)
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { requirements, category, agentId, budget, deadline } = await request.json();

    if (!requirements || !agentId) {
      return NextResponse.json(
        { message: 'Requirements and agent ID are required' },
        { status: 400 }
      );
    }

    // Get vendors based on category
    let vendorQuery = db.select().from(vendors).where(eq(vendors.userId, userId));

    if (category && category !== 'all') {
      vendorQuery = vendorQuery.where(and(eq(vendors.userId, userId), eq(vendors.category, category)));
    }

    // Filter by minimum quality standards
    vendorQuery = vendorQuery.where(and(
      eq(vendors.userId, userId),
      gte(vendors.rating, 2.5),
      gte(vendors.onTimeDelivery, 60)
    ));

    const availableVendors = await vendorQuery;

    if (availableVendors.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: 'No vendors found matching the criteria'
      });
    }

    // Analyze each vendor with AI
    const vendorAnalyses: VendorScore[] = [];

    for (const vendor of availableVendors) {
      try {
        const analysis = await analyzeVendorWithAI(vendor, requirements, agentId);
        vendorAnalyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing vendor ${vendor.name}:`, error);
        // Continue with other vendors
      }
    }

    // Sort by score (highest first)
    vendorAnalyses.sort((a, b) => b.score - a.score);

    // Take top 5 recommendations
    const recommendations = vendorAnalyses.slice(0, 5);

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'vendor_selection_completed',
      message: `AI vendor selection completed - ${recommendations.length} recommendations generated`,
      status: 'success',
      metadata: {
        agentId,
        category,
        vendorsAnalyzed: availableVendors.length,
        topScore: recommendations[0]?.score || 0
      },
      createdAt: new Date()
    });

    return NextResponse.json({
      recommendations,
      totalVendorsAnalyzed: availableVendors.length,
      analysisTimestamp: new Date().toISOString(),
      criteria: {
        requirements,
        category,
        budget,
        deadline
      }
    });

  } catch (error) {
    console.error('Vendor selection error:', error);
    return NextResponse.json(
      { message: 'Failed to perform vendor selection' },
      { status: 500 }
    );
  }
}