import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { EventEmitter } from 'events';
import { EmailAccount, Email, EmailCategory } from '../types';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ImapService extends EventEmitter {
  private connections: Map<string, Imap> = new Map();
  private logger: Logger;
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor() {
    super();
    this.logger = new Logger('ImapService');
  }

  async connect(account: EmailAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new (Imap as any)({
        user: account.user,
        password: account.password,
        host: account.host,
        port: account.port,
        tls: account.tls,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: {
          interval: 10000,
          idleInterval: 300000,
          forceNoop: true
        }
      });

      imap.once('ready', () => {
        this.logger.info(`IMAP connected for account: ${account.id}`);
        this.connections.set(account.id, imap);
        this.reconnectAttempts.set(account.id, 0);
        
        // Fetch initial emails (last 30 days)
        this.fetchInitialEmails(account.id, imap);
        
        // Start IDLE mode for real-time updates
        this.startIdleMode(account.id, imap);
        
        resolve();
      });

      imap.once('error', (err: Error) => {
        this.logger.error(`IMAP error for account ${account.id}:`, err);
        this.handleReconnect(account);
        reject(err);
      });

      imap.once('end', () => {
        this.logger.warn(`IMAP connection ended for account: ${account.id}`);
        this.connections.delete(account.id);
        this.handleReconnect(account);
      });

      imap.connect();
    });
  }

  private handleReconnect(account: EmailAccount): void {
    const attempts = this.reconnectAttempts.get(account.id) || 0;
    
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts.set(account.id, attempts + 1);
      this.logger.info(`Attempting to reconnect account ${account.id} (attempt ${attempts + 1})`);
      
      setTimeout(() => {
        this.connect(account).catch(err => {
          this.logger.error(`Reconnection failed for account ${account.id}:`, err);
        });
      }, Math.min(1000 * Math.pow(2, attempts), 30000)); // Exponential backoff
    } else {
      this.logger.error(`Max reconnection attempts reached for account ${account.id}`);
    }
  }

  private fetchInitialEmails(accountId: string, imap: Imap): void {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        this.logger.error(`Failed to open INBOX for ${accountId}:`, err);
        return;
      }

      // Fetch emails from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const searchCriteria = [['SINCE', thirtyDaysAgo]];
      
      imap.search(searchCriteria, (err, results) => {
        if (err) {
          this.logger.error(`Search failed for ${accountId}:`, err);
          return;
        }

        if (results.length === 0) {
          this.logger.info(`No emails found for ${accountId} in the last 30 days`);
          return;
        }

        this.logger.info(`Fetching ${results.length} emails for ${accountId}`);
        this.fetchEmails(accountId, imap, results, 'INBOX');
      });
    });
  }

  private fetchEmails(accountId: string, imap: Imap, messageIds: number[], folder: string): void {
    if (messageIds.length === 0) return;

    const fetch = imap.fetch(messageIds, {
      bodies: '',
      struct: true
    });

    fetch.on('message', (msg: any, seqno: number) => {
      msg.on('body', (stream: any) => {
        simpleParser(stream as any, async (err: any, parsed: any) => {
          if (err) {
            this.logger.error(`Failed to parse email ${seqno}:`, err);
            return;
          }

          const email = this.convertParsedMailToEmail(accountId, parsed, folder);
          this.emit('email', email);
        });
      });
    });

    fetch.once('error', (err) => {
      this.logger.error(`Fetch error for ${accountId}:`, err);
    });

    fetch.once('end', () => {
      this.logger.debug(`Finished fetching emails for ${accountId}`);
    });
  }

  private startIdleMode(accountId: string, imap: Imap): void {
    imap.openBox('INBOX', false, (err) => {
      if (err) {
        this.logger.error(`Failed to open INBOX for IDLE mode ${accountId}:`, err);
        return;
      }

      // Listen for new emails
      imap.on('mail', (numNewMsgs: number) => {
        this.logger.info(`${numNewMsgs} new email(s) received for ${accountId}`);
        
        // Search for unseen messages
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            this.logger.error(`Failed to search for new emails ${accountId}:`, err);
            return;
          }
          
          if (results.length > 0) {
            this.fetchEmails(accountId, imap, results, 'INBOX');
          }
        });
      });

      // Start IDLE
      const startIdle = () => {
        if (imap.state === 'authenticated') {
          (imap as any).idle((err: any) => {
            if (err) {
              this.logger.error(`IDLE error for ${accountId}:`, err);
            }
          });
        }
      };

      // Re-IDLE every 29 minutes (before 30-minute timeout)
      const idleInterval = setInterval(() => {
        if (!this.connections.has(accountId)) {
          clearInterval(idleInterval);
          return;
        }
        
        imap.end();
        startIdle();
      }, 29 * 60 * 1000);

      startIdle();
      this.logger.info(`IDLE mode started for ${accountId}`);
    });
  }

  private convertParsedMailToEmail(accountId: string, parsed: ParsedMail, folder: string): Email {
    const getAddressText = (addr: any): string => {
      if (!addr) return '';
      if (Array.isArray(addr)) return addr[0]?.text || '';
      return addr.text || '';
    };

    return {
      id: uuidv4(),
      accountId,
      messageId: parsed.messageId || uuidv4(),
      from: getAddressText(parsed.from),
      to: parsed.to ? [getAddressText(parsed.to)] : [],
      subject: parsed.subject || '(No Subject)',
      body: parsed.text || '',
      bodyHtml: parsed.html ? String(parsed.html) : undefined,
      date: parsed.date || new Date(),
      folder,
      category: EmailCategory.UNCATEGORIZED,
      attachments: parsed.attachments?.map(att => ({
        filename: att.filename || 'unknown',
        contentType: att.contentType,
        size: att.size,
        content: att.content
      })),
      headers: parsed.headers ? this.headersToObject(parsed.headers) : undefined
    };
  }

  private headersToObject(headers: any): Record<string, string> {
    const obj: Record<string, string> = {};
    for (const [key, value] of headers) {
      obj[key] = Array.isArray(value) ? value.join(', ') : value;
    }
    return obj;
  }

  disconnect(accountId: string): void {
    const imap = this.connections.get(accountId);
    if (imap) {
      imap.end();
      this.connections.delete(accountId);
      this.logger.info(`Disconnected account: ${accountId}`);
    }
  }

  disconnectAll(): void {
    for (const accountId of this.connections.keys()) {
      this.disconnect(accountId);
    }
  }
}
