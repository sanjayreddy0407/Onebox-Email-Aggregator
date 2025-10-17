export interface EmailAccount {
  id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

export interface Email {
  id: string;
  accountId: string;
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  folder: string;
  category?: EmailCategory;
  attachments?: Attachment[];
  headers?: Record<string, string>;
}

export enum EmailCategory {
  INTERESTED = 'interested',
  MEETING_BOOKED = 'meeting_booked',
  NOT_INTERESTED = 'not_interested',
  SPAM = 'spam',
  OUT_OF_OFFICE = 'out_of_office',
  UNCATEGORIZED = 'uncategorized'
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}

export interface SearchQuery {
  query?: string;
  folder?: string;
  accountId?: string;
  category?: EmailCategory;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface SuggestedReply {
  reply: string;
  confidence: number;
  context: string[];
}
