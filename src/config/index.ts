import dotenv from 'dotenv';
import { EmailAccount } from '../types';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    index: 'emails'
  },
  
  emailAccounts: [
    {
      id: 'account-1',
      host: process.env.IMAP_HOST_1 || '',
      port: parseInt(process.env.IMAP_PORT_1 || '993', 10),
      user: process.env.IMAP_USER_1 || '',
      password: process.env.IMAP_PASSWORD_1 || '',
      tls: process.env.IMAP_TLS_1 === 'true'
    },
    {
      id: 'account-2',
      host: process.env.IMAP_HOST_2 || '',
      port: parseInt(process.env.IMAP_PORT_2 || '993', 10),
      user: process.env.IMAP_USER_2 || '',
      password: process.env.IMAP_PASSWORD_2 || '',
      tls: process.env.IMAP_TLS_2 === 'true'
    }
  ] as EmailAccount[],
  
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || ''
  },
  
  webhook: {
    externalUrl: process.env.EXTERNAL_WEBHOOK_URL || ''
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY
  },
  
  rag: {
    productName: process.env.PRODUCT_NAME || 'Your Product',
    outreachAgenda: process.env.OUTREACH_AGENDA || ''
  }
};
