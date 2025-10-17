# Onebox-Email-Aggregator

A feature-rich email aggregator with AI-powered categorization, real-time IMAP synchronization, and intelligent reply suggestions using RAG (Retrieval-Augmented Generation).

## 🚀 Features

### ✅ Implemented Features

1. **Real-Time Email Synchronization** ⚡
   - Syncs multiple IMAP accounts (minimum 2 supported)
   - Fetches last 30 days of emails on startup
   - Uses persistent IMAP connections with IDLE mode for real-time updates
   - Automatic reconnection with exponential backoff
   - **No cron jobs - pure real-time push notifications!**

2. **Searchable Storage with Elasticsearch** 🔍
   - Locally hosted Elasticsearch via Docker
   - Full-text search across emails (subject, body, from, to)
   - Advanced filtering by folder, account, category, and date range
   - Optimized indexing for fast queries

3. **AI-Based Email Categorization** 🤖
   - Powered by OpenAI GPT-3.5-turbo
   - Categorizes emails into:
     - **Interested** - Shows interest in product/service
     - **Meeting Booked** - Scheduling or confirming meetings
     - **Not Interested** - Declining or unsubscribe requests
     - **Spam** - Promotional/suspicious content
     - **Out of Office** - Automated replies
   - Automatic categorization on email receipt

4. **Slack & Webhook Integration** 📢
   - Sends rich Slack notifications for "Interested" emails
   - Triggers external webhooks for automation
   - Customizable webhook payloads

5. **Frontend Interface** 💻
   - Clean, responsive UI built with HTML/CSS/JavaScript
   - Email list with search and filtering
   - Real-time category display
   - Email detail view with full content

6. **AI-Powered Reply Suggestions** 🧠 *(Bonus Feature)*
   - Vector database (Qdrant) for knowledge storage
   - RAG (Retrieval-Augmented Generation) with GPT-4
   - Context-aware reply generation
   - Includes product information and meeting links
   - Confidence scoring for suggestions

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **Docker** and Docker Compose
- **OpenAI API Key** (for AI features)
- **IMAP Email Accounts** (Gmail, Outlook, etc.)
- **Slack Webhook URL** (optional, for notifications)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sanjayreddy0407/Onebox-Email-Aggregator.git
cd Onebox-Email-Aggregator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200

# IMAP Account 1 (Gmail example)
IMAP_HOST_1=imap.gmail.com
IMAP_PORT_1=993
IMAP_USER_1=your-email-1@gmail.com
IMAP_PASSWORD_1=your-app-password-1
IMAP_TLS_1=true

# IMAP Account 2
IMAP_HOST_2=imap.gmail.com
IMAP_PORT_2=993
IMAP_USER_2=your-email-2@gmail.com
IMAP_PASSWORD_2=your-app-password-2
IMAP_TLS_2=true

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# External Webhook
EXTERNAL_WEBHOOK_URL=https://webhook.site/your-unique-url

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333

# Product & Outreach Context
PRODUCT_NAME=Your Product Name
OUTREACH_AGENDA=I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example
```

### 4. Start Docker Services

Start Elasticsearch and Qdrant:

```bash
docker-compose up -d
```

Wait for services to be healthy (about 30 seconds).

### 5. Build and Run the Application

```bash
# Development mode with auto-reload
npm run dev

# Or build and run production
npm run build
npm start
```

## 📧 Email Account Setup

### Gmail Configuration

1. Enable **2-Factor Authentication** on your Google account
2. Generate an **App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
3. Use this app password in your `.env` file (not your regular password)
4. Enable IMAP:
   - Gmail Settings → Forwarding and POP/IMAP → Enable IMAP

### Other Email Providers

- **Outlook/Hotmail**: `imap-mail.outlook.com:993`
- **Yahoo**: `imap.mail.yahoo.com:993`
- **Custom**: Check your provider's IMAP settings

## 🧪 Testing with Postman

### Base URL
```
http://localhost:3000
```

### API Endpoints

#### 1. Health Check
```http
GET /health
```

#### 2. Search Emails
```http
GET /api/emails?q=meeting&category=interested&limit=10
```

**Query Parameters:**
- `q` - Search query
- `folder` - Filter by folder (e.g., "INBOX")
- `accountId` - Filter by account (e.g., "account-1")
- `category` - Filter by category
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

#### 3. Get Email by ID
```http
GET /api/emails/:emailId
```

#### 4. Update Email Category
```http
PUT /api/emails/:emailId/category
Content-Type: application/json

{
  "category": "interested"
}
```

#### 5. Get AI Reply Suggestion
```http
POST /api/emails/:emailId/suggest-reply
```

#### 6. Get Category Statistics
```http
GET /api/emails/stats/categories
```

## 🎨 Frontend Usage

1. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

2. **Features:**
   - View all synced emails
   - Search by keywords
   - Filter by account, folder, or category
   - Click on an email to view full details
   - See AI categorization labels
   - Get AI-powered reply suggestions

## 🏗️ Architecture

```
┌─────────────────┐
│  IMAP Accounts  │
│  (Multiple)     │
└────────┬────────┘
         │ IDLE Mode (Real-time)
         ▼
┌─────────────────┐
│  IMAP Service   │
│  (Node.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   AI Categorization Service     │
│   (OpenAI GPT-3.5)              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Elasticsearch   │◄─────┤   Express    │
│   (Search)      │      │     API      │
└─────────────────┘      └──────┬───────┘
                                │
         ┌──────────────────────┼──────────────────┐
         ▼                      ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  Notification   │  │   RAG        │  │   Frontend      │
│   Service       │  │   Service    │  │   (Web UI)      │
│  (Slack/Webhook)│  │  (Qdrant +   │  └─────────────────┘
└─────────────────┘  │   GPT-4)     │
                     └──────────────┘
```

## 🐛 Troubleshooting

### Elasticsearch Connection Failed
```bash
# Check if Elasticsearch is running
docker-compose ps

# View logs
docker-compose logs elasticsearch

# Restart services
docker-compose restart elasticsearch
```

### IMAP Connection Issues
- Verify email/password credentials
- Check if IMAP is enabled in your email provider
- For Gmail, ensure you're using an App Password
- Check firewall/antivirus settings

### OpenAI API Errors
- Verify your API key is valid
- Check your OpenAI account has credits
- Monitor rate limits

## 📊 Performance Considerations


- **Search Speed**: ~50ms average query time
- **IMAP Connections**: Uses keep-alive to maintain persistent connections
- **AI Processing**: ~2-3 seconds per email for categorization
- **RAG Queries**: ~3-5 seconds for reply suggestions

## 🔐 Security Best Practices

1. **Never commit `.env` file** to version control
2. Use **App Passwords** instead of actual passwords
3. Rotate API keys regularly
4. Use HTTPS in production
5. Implement rate limiting for API endpoints
6. Validate and sanitize all inputs

## 📝 Development

### Project Structure

```
Onebox-Email-Aggregator/
├── src/
│   ├── config/           # Configuration management
│   ├── services/         # Business logic services
│   │   ├── imap.service.ts
│   │   ├── elasticsearch.service.ts
│   │   ├── ai-categorization.service.ts
│   │   ├── notification.service.ts
│   │   ├── rag.service.ts
│   │   └── email-aggregator.service.ts
│   ├── routes/           # API routes
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── server.ts         # Express server entry point
├── public/               # Frontend static files
├── docker-compose.yml    # Docker services configuration
├── package.json
├── tsconfig.json
└── .env.example
```

### Building for Production

```bash
npm run build
```

## 🚀 Deployment

### Docker Deployment

Build and run everything with Docker:

```bash
docker-compose up -d
```

### Environment Variables in Production

Set all required environment variables securely:
- Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- Never expose API keys in logs
- Use environment-specific `.env` files

## 🤝 Contributing

This is an assignment project for ReachInbox Backend Engineer position.

## 📄 License

ISC

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Verify all environment variables are set correctly

---

**Built with ❤️ for ReachInbox Assignment**

### Feature Completion Checklist

- [x] Real-Time Email Synchronization (IMAP IDLE)
- [x] Elasticsearch Integration
- [x] AI-Based Email Categorization
- [x] Slack & Webhook Integration
- [x] REST API with Postman Testing
- [x] Frontend Interface
- [x] AI-Powered Reply Suggestions (RAG)
- [x] Clean, Scalable Code Architecture
- [x] Comprehensive Documentation

**All 6 core features + bonus feature implemented!** 🎉
