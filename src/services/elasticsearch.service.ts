import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { Email, SearchQuery } from '../types';
import { Logger } from '../utils/logger';

export class ElasticsearchService {
  private client: Client;
  private logger: Logger;
  private readonly indexName = config.elasticsearch.index;

  constructor() {
    this.client = new Client({ node: config.elasticsearch.node });
    this.logger = new Logger('ElasticsearchService');
  }

  async initialize(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                accountId: { type: 'keyword' },
                messageId: { type: 'keyword' },
                from: { type: 'text' },
                to: { type: 'text' },
                subject: { type: 'text' },
                body: { type: 'text' },
                bodyHtml: { type: 'text' },
                date: { type: 'date' },
                folder: { type: 'keyword' },
                category: { type: 'keyword' },
                headers: { type: 'object', enabled: false }
              }
            }
          }
        });
        this.logger.info('Elasticsearch index created successfully');
      } else {
        this.logger.info('Elasticsearch index already exists');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch', error);
      throw error;
    }
  }

  async indexEmail(email: Email): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: email.id,
        document: email
      });
      this.logger.debug(`Indexed email: ${email.id}`);
    } catch (error) {
      this.logger.error(`Failed to index email: ${email.id}`, error);
      throw error;
    }
  }

  async bulkIndexEmails(emails: Email[]): Promise<void> {
    if (emails.length === 0) return;

    const body = emails.flatMap(email => [
      { index: { _index: this.indexName, _id: email.id } },
      email
    ]);

    try {
      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        this.logger.warn('Some emails failed to index');
      } else {
        this.logger.info(`Bulk indexed ${emails.length} emails`);
      }
    } catch (error) {
      this.logger.error('Failed to bulk index emails', error);
      throw error;
    }
  }

  async searchEmails(query: SearchQuery): Promise<{ emails: Email[]; total: number }> {
    try {
      const must: any[] = [];

      if (query.query) {
        must.push({
          multi_match: {
            query: query.query,
            fields: ['subject^2', 'body', 'from', 'to']
          }
        });
      }

      if (query.folder) {
        must.push({ term: { folder: query.folder } });
      }

      if (query.accountId) {
        must.push({ term: { accountId: query.accountId } });
      }

      if (query.category) {
        must.push({ term: { category: query.category } });
      }

      if (query.from || query.to) {
        const range: any = {};
        if (query.from) range.gte = query.from;
        if (query.to) range.lte = query.to;
        must.push({ range: { date: range } });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: must.length > 0 ? { bool: { must } } : { match_all: {} },
          sort: [{ date: { order: 'desc' } }],
          from: query.offset || 0,
          size: query.limit || 50
        }
      });

      const emails = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._id
      })) as Email[];

      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      return { emails, total };
    } catch (error) {
      this.logger.error('Failed to search emails', error);
      throw error;
    }
  }

  async updateEmailCategory(emailId: string, category: string): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id: emailId,
        body: {
          doc: { category }
        }
      });
      this.logger.debug(`Updated category for email: ${emailId}`);
    } catch (error) {
      this.logger.error(`Failed to update email category: ${emailId}`, error);
      throw error;
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id: emailId
      });
      
      return { ...(response._source as object), id: response._id } as Email;
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      this.logger.error(`Failed to get email: ${emailId}`, error);
      throw error;
    }
  }
}
