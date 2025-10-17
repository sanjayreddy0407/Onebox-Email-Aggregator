import { ImapService } from './imap.service';
import { ElasticsearchService } from './elasticsearch.service';
import { AICategorizationService } from './ai-categorization.service';
import { NotificationService } from './notification.service';
import { RAGService } from './rag.service';
import { config } from '../config';
import { Email, EmailCategory } from '../types';
import { Logger } from '../utils/logger';

export class EmailAggregatorService {
  private imapService: ImapService;
  private elasticsearchService: ElasticsearchService;
  private aiService: AICategorizationService;
  private notificationService: NotificationService;
  private ragService: RAGService;
  private logger: Logger;

  constructor() {
    this.imapService = new ImapService();
    this.elasticsearchService = new ElasticsearchService();
    this.aiService = new AICategorizationService();
    this.notificationService = new NotificationService();
    this.ragService = new RAGService();
    this.logger = new Logger('EmailAggregatorService');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Email Aggregator Service...');

    // Initialize Elasticsearch
    await this.elasticsearchService.initialize();

    // Initialize RAG service
    await this.ragService.initialize();

    // Set up email event handler
    this.imapService.on('email', async (email: Email) => {
      await this.handleNewEmail(email);
    });

    // Connect all IMAP accounts
    for (const account of config.emailAccounts) {
      if (account.user && account.password) {
        try {
          await this.imapService.connect(account);
          this.logger.info(`Connected to account: ${account.id}`);
        } catch (error) {
          this.logger.error(`Failed to connect account ${account.id}:`, error);
        }
      }
    }

    this.logger.info('Email Aggregator Service initialized successfully');
  }

  private async handleNewEmail(email: Email): Promise<void> {
    try {
      this.logger.info(`Processing new email: ${email.subject} from ${email.from}`);

      // Categorize email with AI
      const category = await this.aiService.categorizeEmail(email);
      email.category = category;

      // Index in Elasticsearch
      await this.elasticsearchService.indexEmail(email);

      // Send notifications if email is categorized as "interested"
      if (category === EmailCategory.INTERESTED) {
        await this.notificationService.notifyInterestedEmail(email);
      }

      this.logger.info(`Email processed successfully: ${email.id}`);
    } catch (error) {
      this.logger.error('Failed to process email:', error);
    }
  }

  getElasticsearchService(): ElasticsearchService {
    return this.elasticsearchService;
  }

  getAIService(): AICategorizationService {
    return this.aiService;
  }

  getRAGService(): RAGService {
    return this.ragService;
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Email Aggregator Service...');
    this.imapService.disconnectAll();
    this.logger.info('Shutdown complete');
  }
}
