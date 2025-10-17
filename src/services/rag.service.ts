import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { config } from '../config';
import { Email, SuggestedReply } from '../types';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class RAGService {
  private qdrant: QdrantClient;
  private openai: OpenAI;
  private logger: Logger;
  private readonly collectionName = 'product_knowledge';
  private initialized = false;

  constructor() {
    this.qdrant = new QdrantClient({ url: config.qdrant.url });
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.logger = new Logger('RAGService');
  }

  async initialize(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.qdrant.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);

      if (!exists) {
        // Create collection
        await this.qdrant.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // OpenAI embedding dimension
            distance: 'Cosine'
          }
        });

        this.logger.info('Created Qdrant collection for product knowledge');

        // Index initial product knowledge
        await this.indexProductKnowledge();
      }

      this.initialized = true;
      this.logger.info('RAG service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  private async indexProductKnowledge(): Promise<void> {
    const knowledgeBase = [
      {
        text: config.rag.outreachAgenda,
        metadata: { type: 'outreach_agenda' }
      },
      {
        text: `Product: ${config.rag.productName}. This is our main product offering.`,
        metadata: { type: 'product_info' }
      },
      {
        text: 'For scheduling meetings, always include the booking link: https://cal.com/example',
        metadata: { type: 'meeting_instructions' }
      },
      {
        text: 'When responding to interested leads, be professional, concise, and helpful. Always thank them for their interest.',
        metadata: { type: 'response_guidelines' }
      }
    ];

    for (const item of knowledgeBase) {
      await this.addToKnowledgeBase(item.text, item.metadata);
    }

    this.logger.info('Indexed product knowledge base');
  }

  private async addToKnowledgeBase(text: string, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const embedding = await this.getEmbedding(text);

      await this.qdrant.upsert(this.collectionName, {
        points: [
          {
            id: uuidv4(),
            vector: embedding,
            payload: {
              text,
              ...metadata
            }
          }
        ]
      });
    } catch (error) {
      this.logger.error('Failed to add to knowledge base:', error);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data[0].embedding;
  }

  async suggestReply(email: Email): Promise<SuggestedReply> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Create query from email content
      const query = `${email.subject}\n\n${email.body}`;
      const queryEmbedding = await this.getEmbedding(query);

      // Search for relevant context
      const searchResults = await this.qdrant.search(this.collectionName, {
        vector: queryEmbedding,
        limit: 3
      });

      const context = searchResults.map((r: any) => (r.payload?.text as string) || '').filter(Boolean) as string[];

      // Generate reply using RAG
      const reply = await this.generateReply(email, context);

      return {
        reply,
        confidence: this.calculateConfidence(searchResults),
        context
      };
    } catch (error) {
      this.logger.error('Failed to suggest reply:', error);
      throw error;
    }
  }

  private async generateReply(email: Email, context: string[]): Promise<string> {
    const contextText = context.join('\n\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant helping to draft professional email replies. Use the provided context to generate appropriate responses.

Context:
${contextText}

Guidelines:
- Be professional and concise
- Use the context information when relevant
- If the email mentions interest in scheduling, include the meeting booking link
- Maintain a friendly but professional tone
- Keep replies under 150 words`
        },
        {
          role: 'user',
          content: `Generate a reply to this email:

From: ${email.from}
Subject: ${email.subject}

${email.body}

Reply:`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }

  private calculateConfidence(results: any[]): number {
    if (results.length === 0) return 0;
    
    // Average score of top results
    const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    return Math.min(avgScore, 1);
  }

  async addCustomKnowledge(text: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    await this.addToKnowledgeBase(text, metadata);
    this.logger.info('Added custom knowledge to vector database');
  }
}
