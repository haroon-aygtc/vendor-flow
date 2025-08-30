import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhooks, webhookEvents, activities } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key';

async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return true; // Allow unsigned webhooks if no secret configured

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

async function processWebhookEvent(webhook: any, eventData: any): Promise<void> {
  try {
    const { type, configuration } = webhook;
    
    switch (type) {
      case 'slack':
        await processSlackWebhook(configuration, eventData);
        break;
      case 'github':
        await processGitHubWebhook(configuration, eventData);
        break;
      case 'email-smtp':
        await processEmailWebhook(configuration, eventData);
        break;
      case 'discord-bot':
        await processDiscordWebhook(configuration, eventData);
        break;
      case 'microsoft-teams':
        await processTeamsWebhook(configuration, eventData);
        break;
      case 'jira-integration':
        await processJiraWebhook(configuration, eventData);
        break;
      case 'zapier-integration':
        await processZapierWebhook(configuration, eventData);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }
  } catch (error) {
    console.error(`Error processing webhook event for type ${webhook.type}:`, error);
    throw error;
  }
}

async function processSlackWebhook(config: any, eventData: any): Promise<void> {
  const { botToken, defaultChannel } = config;
  const channel = eventData.channel || defaultChannel || '#general';
  
  const message = {
    channel,
    text: eventData.message || 'Webhook event received',
    username: eventData.username || 'AI Assistant',
    icon_emoji: eventData.icon || ':robot_face:'
  };

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Slack API error: ${error.error}`);
  }
}

async function processGitHubWebhook(config: any, eventData: any): Promise<void> {
  const { accessToken, defaultRepo } = config;
  const repo = eventData.repository || defaultRepo;
  
  if (!repo) {
    throw new Error('Repository not specified');
  }

  // Create an issue for the webhook event
  const issue = {
    title: eventData.title || 'Webhook Event',
    body: eventData.body || JSON.stringify(eventData, null, 2),
    labels: eventData.labels || ['webhook', 'automated']
  };

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(issue),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`GitHub API error: ${error.message}`);
  }
}

async function processEmailWebhook(config: any, eventData: any): Promise<void> {
  // This would integrate with an email service like SendGrid, AWS SES, etc.
  // For now, we'll log the email that would be sent
  console.log('Email webhook processed:', {
    to: eventData.to || config.defaultRecipient,
    subject: eventData.subject || 'Webhook Notification',
    body: eventData.message || JSON.stringify(eventData, null, 2)
  });
}

async function processDiscordWebhook(config: any, eventData: any): Promise<void> {
  const { botToken, defaultChannelId } = config;
  const channelId = eventData.channelId || defaultChannelId;
  
  if (!channelId) {
    throw new Error('Discord channel ID not specified');
  }

  const message = {
    content: eventData.message || 'Webhook event received',
    embeds: eventData.embeds || []
  };

  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Discord API error: ${error.message}`);
  }
}

async function processTeamsWebhook(config: any, eventData: any): Promise<void> {
  const { webhookUrl } = config;
  
  const message = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: eventData.color || '0076D7',
    summary: eventData.title || 'Webhook Event',
    sections: [{
      activityTitle: eventData.title || 'Webhook Event',
      activitySubtitle: eventData.subtitle || 'Event received',
      text: eventData.message || JSON.stringify(eventData, null, 2)
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Teams webhook error: ${response.status} ${response.statusText}`);
  }
}

async function processJiraWebhook(config: any, eventData: any): Promise<void> {
  const { baseUrl, email, apiToken, defaultProject } = config;
  const project = eventData.project || defaultProject;
  
  if (!project) {
    throw new Error('Jira project not specified');
  }

  const issue = {
    fields: {
      project: { key: project },
      summary: eventData.title || 'Webhook Event',
      description: eventData.description || JSON.stringify(eventData, null, 2),
      issuetype: { name: eventData.issueType || 'Task' }
    }
  };

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(issue),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Jira API error: ${error.errorMessages?.join(', ') || 'Unknown error'}`);
  }
}

async function processZapierWebhook(config: any, eventData: any): Promise<void> {
  const { webhookUrl } = config;
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error(`Zapier webhook error: ${response.status} ${response.statusText}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { params } = request;
    const webhookId = params?.id as string;

    if (!webhookId) {
      return NextResponse.json(
        { message: 'Webhook ID is required' },
        { status: 400 }
      );
    }

    // Get webhook configuration
    const webhook = await db.select()
      .from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .limit(1);

    if (webhook.length === 0) {
      return NextResponse.json(
        { message: 'Webhook not found' },
        { status: 404 }
      );
    }

    const webhookConfig = webhook[0];

    if (!webhookConfig.isActive) {
      return NextResponse.json(
        { message: 'Webhook is not active' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.text();
    let eventData: any;

    try {
      eventData = JSON.parse(body);
    } catch (error) {
      eventData = { rawData: body };
    }

    // Verify webhook signature if secret is configured
    const signature = request.headers.get('x-hub-signature-256') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('signature');

    if (webhookConfig.secret) {
      const isValid = await verifyWebhookSignature(body, signature || '', webhookConfig.secret);
      if (!isValid) {
        return NextResponse.json(
          { message: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Create webhook event record
    const eventId = nanoid();
    const eventType = eventData.type || eventData.event_type || 'unknown';

    await db.insert(webhookEvents).values({
      id: eventId,
      webhookId,
      eventType,
      payload: eventData,
      status: 'pending',
      createdAt: new Date()
    });

    try {
      // Process the webhook event
      await processWebhookEvent(webhookConfig, eventData);

      // Update event status to processed
      await db.update(webhookEvents)
        .set({
          status: 'processed',
          processedAt: new Date()
        })
        .where(eq(webhookEvents.id, eventId));

      // Update webhook trigger count
      await db.update(webhooks)
        .set({
          totalTriggers: webhookConfig.totalTriggers + 1,
          lastTriggered: new Date(),
          updatedAt: new Date()
        })
        .where(eq(webhooks.id, webhookId));

      // Log activity
      await db.insert(activities).values({
        id: nanoid(),
        userId: webhookConfig.userId,
        type: 'webhook_triggered',
        message: `Webhook ${webhookConfig.name} processed event: ${eventType}`,
        status: 'success',
        metadata: { webhookId, eventId, eventType },
        createdAt: new Date()
      });

      return NextResponse.json({
        success: true,
        eventId,
        message: 'Webhook processed successfully'
      });

    } catch (processingError) {
      // Update event status to failed
      await db.update(webhookEvents)
        .set({
          status: 'failed',
          errorMessage: processingError instanceof Error ? processingError.message : 'Processing failed',
          processedAt: new Date()
        })
        .where(eq(webhookEvents.id, eventId));

      // Log failed activity
      await db.insert(activities).values({
        id: nanoid(),
        userId: webhookConfig.userId,
        type: 'webhook_processing_failed',
        message: `Webhook ${webhookConfig.name} failed to process event: ${eventType}`,
        status: 'error',
        metadata: { 
          webhookId, 
          eventId, 
          eventType, 
          error: processingError instanceof Error ? processingError.message : 'Unknown error' 
        },
        createdAt: new Date()
      });

      return NextResponse.json(
        { 
          success: false,
          eventId,
          message: processingError instanceof Error ? processingError.message : 'Webhook processing failed' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook receive error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process webhook' 
      },
      { status: 500 }
    );
  }
}