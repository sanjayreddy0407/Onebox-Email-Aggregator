import { IncomingWebhook } from '@slack/webhook';
import axios from 'axios';
import { config } from '../config';
import { Email } from '../types';
import { Logger } from '../utils/logger';

export class NotificationService {
  private slackWebhook: IncomingWebhook | null = null;
  private logger: Logger;

  constructor() {
    if (config.slack.webhookUrl) {
      this.slackWebhook = new IncomingWebhook(config.slack.webhookUrl);
    }
    this.logger = new Logger('NotificationService');
  }

  async sendSlackNotification(email: Email): Promise<void> {
    if (!this.slackWebhook) {
      this.logger.warn('Slack webhook URL not configured');
      return;
    }

    try {
      await this.slackWebhook.send({
        text: '🎯 New Interested Email Received!',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Email'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${email.from}`
              },
              {
                type: 'mrkdwn',
                text: `*Subject:*\n${email.subject}`
              },
              {
                type: 'mrkdwn',
                text: `*Date:*\n${new Date(email.date).toLocaleString()}`
              },
              {
                type: 'mrkdwn',
                text: `*Account:*\n${email.accountId}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${email.body.substring(0, 200)}${email.body.length > 200 ? '...' : ''}`
            }
          }
        ]
      });

      this.logger.info(`Slack notification sent for email: ${email.id}`);
    } catch (error) {
      this.logger.error('Failed to send Slack notification:', error);
    }
  }

  async triggerWebhook(email: Email): Promise<void> {
    if (!config.webhook.externalUrl) {
      this.logger.warn('External webhook URL not configured');
      return;
    }

    try {
      await axios.post(config.webhook.externalUrl, {
        event: 'email.interested',
        timestamp: new Date().toISOString(),
        data: {
          emailId: email.id,
          from: email.from,
          subject: email.subject,
          date: email.date,
          accountId: email.accountId,
          category: email.category,
          preview: email.body.substring(0, 200)
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OneBox-Email-Aggregator/1.0'
        },
        timeout: 5000
      });

      this.logger.info(`Webhook triggered for email: ${email.id}`);
    } catch (error) {
      this.logger.error('Failed to trigger webhook:', error);
    }
  }

  async notifyInterestedEmail(email: Email): Promise<void> {
    await Promise.all([
      this.sendSlackNotification(email),
      this.triggerWebhook(email)
    ]);
  }
}
