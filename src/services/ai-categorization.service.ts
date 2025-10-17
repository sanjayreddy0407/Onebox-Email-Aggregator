import OpenAI from 'openai';
import { config } from '../config';
import { Email, EmailCategory } from '../types';
import { Logger } from '../utils/logger';

export class AICategorizationService {
  private openai: OpenAI;
  private logger: Logger;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.logger = new Logger('AICategorizationService');
  }

  async categorizeEmail(email: Email): Promise<EmailCategory> {
    try {
      const prompt = this.buildCategorizationPrompt(email);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that categorizes emails into one of these categories:
- interested: The sender shows interest in the product/service or wants to continue the conversation
- meeting_booked: The sender is scheduling or confirming a meeting
- not_interested: The sender is declining, not interested, or asking to unsubscribe
- spam: Promotional content, suspicious links, or irrelevant messages
- out_of_office: Automated out-of-office or vacation replies

Respond with ONLY the category name in lowercase.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 20
      });

      const category = response.choices[0]?.message?.content?.trim().toLowerCase() || 'uncategorized';
      return this.mapCategoryString(category);
    } catch (error) {
      this.logger.error('Failed to categorize email with AI:', error);
      return EmailCategory.UNCATEGORIZED;
    }
  }

  async batchCategorizeEmails(emails: Email[]): Promise<Map<string, EmailCategory>> {
    const categories = new Map<string, EmailCategory>();
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(async email => {
        const category = await this.categorizeEmail(email);
        categories.set(email.id, category);
      });
      
      await Promise.all(promises);
      
      // Small delay to avoid rate limiting
      if (i + batchSize < emails.length) {
        await this.delay(1000);
      }
    }
    
    return categories;
  }

  private buildCategorizationPrompt(email: Email): string {
    return `Email Details:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}

Categorize this email.`;
  }

  private mapCategoryString(category: string): EmailCategory {
    const mapping: Record<string, EmailCategory> = {
      'interested': EmailCategory.INTERESTED,
      'meeting_booked': EmailCategory.MEETING_BOOKED,
      'not_interested': EmailCategory.NOT_INTERESTED,
      'spam': EmailCategory.SPAM,
      'out_of_office': EmailCategory.OUT_OF_OFFICE
    };

    return mapping[category] || EmailCategory.UNCATEGORIZED;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
