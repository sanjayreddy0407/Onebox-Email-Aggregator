# OneBox Email Aggregator - API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently, no authentication is required. In production, implement JWT or OAuth2.

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "OneBox Email Aggregator"
}
```

---

### 2. Get All Emails

**GET** `/api/emails`

Retrieve emails with optional filtering and pagination.

**Query Parameters:**
- `q` (string, optional) - Search query for subject, body, from, or to fields
- `folder` (string, optional) - Filter by folder name (e.g., "INBOX")
- `accountId` (string, optional) - Filter by account ID (e.g., "account-1")
- `category` (string, optional) - Filter by category (interested, meeting_booked, not_interested, spam, out_of_office, uncategorized)
- `limit` (number, optional, default: 50) - Number of results per page
- `offset` (number, optional, default: 0) - Pagination offset

**Example Request:**
```
GET /api/emails?q=meeting&category=interested&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "uuid-here",
        "accountId": "account-1",
        "messageId": "<message-id@example.com>",
        "from": "john@example.com",
        "to": ["you@example.com"],
        "subject": "Meeting Request",
        "body": "Hi, I'd like to schedule a meeting...",
        "date": "2024-01-01T10:00:00.000Z",
        "folder": "INBOX",
        "category": "interested"
      }
    ],
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

---

### 3. Get Email by ID

**GET** `/api/emails/:id`

Retrieve a specific email by its ID.

**Example Request:**
```
GET /api/emails/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "accountId": "account-1",
    "messageId": "<message-id@example.com>",
    "from": "john@example.com",
    "to": ["you@example.com"],
    "subject": "Meeting Request",
    "body": "Hi, I'd like to schedule a meeting...",
    "date": "2024-01-01T10:00:00.000Z",
    "folder": "INBOX",
    "category": "interested",
    "headers": {
      "content-type": "text/plain"
    }
  }
}
```

---

### 4. Update Email Category

**PUT** `/api/emails/:id/category`

Update the category of an email.

**Request Body:**
```json
{
  "category": "interested"
}
```

**Valid Categories:**
- `interested`
- `meeting_booked`
- `not_interested`
- `spam`
- `out_of_office`
- `uncategorized`

**Response:**
```json
{
  "success": true,
  "message": "Category updated successfully"
}
```

---

### 5. Get AI Reply Suggestion

**POST** `/api/emails/:id/suggest-reply`

Get an AI-powered reply suggestion using RAG (Retrieval-Augmented Generation).

**Example Request:**
```
POST /api/emails/123e4567-e89b-12d3-a456-426614174000/suggest-reply
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "Thank you for your interest! I'd be happy to schedule a meeting. You can book a slot here: https://cal.com/example",
    "confidence": 0.92,
    "context": [
      "I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example",
      "For scheduling meetings, always include the booking link: https://cal.com/example"
    ]
  }
}
```

---

### 6. Get Category Statistics

**GET** `/api/emails/stats/categories`

Get email count by category.

**Response:**
```json
{
  "success": true,
  "data": {
    "interested": 45,
    "meeting_booked": 12,
    "not_interested": 8,
    "spam": 156,
    "out_of_office": 23,
    "uncategorized": 89
  }
}
```

---

### 7. Add Custom Knowledge

**POST** `/api/knowledge`

Add custom knowledge to the RAG vector database for better reply suggestions.

**Request Body:**
```json
{
  "text": "Our product pricing starts at $99/month with a 14-day free trial.",
  "metadata": {
    "type": "pricing",
    "category": "sales"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Knowledge added successfully"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing with Postman

1. Import the provided Postman collection: `OneBox-API.postman_collection.json`
2. Set the base URL variable: `http://localhost:3000`
3. Run the "Get All Emails" request to get email IDs
4. Update the `emailId` variable with a real email ID
5. Test other endpoints

---

## Rate Limiting

Currently, no rate limiting is implemented. For production:
- Implement rate limiting (e.g., 100 requests/minute)
- Use API keys for authentication
- Add request logging and monitoring

---

## WebSocket Support (Future Enhancement)

For real-time updates, consider implementing WebSocket connections:
```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.on('new_email', (email) => {
  console.log('New email received:', email);
});
```

---

## Examples

### Search for emails about "interview" that are interested
```bash
curl "http://localhost:3000/api/emails?q=interview&category=interested"
```

### Get AI reply suggestion
```bash
curl -X POST "http://localhost:3000/api/emails/YOUR_EMAIL_ID/suggest-reply"
```

### Update email category
```bash
curl -X PUT "http://localhost:3000/api/emails/YOUR_EMAIL_ID/category" \
  -H "Content-Type: application/json" \
  -d '{"category": "interested"}'
```

### Add custom knowledge
```bash
curl -X POST "http://localhost:3000/api/knowledge" \
  -H "Content-Type: application/json" \
  -d '{"text": "Our support team is available 24/7", "metadata": {"type": "support"}}'
```
