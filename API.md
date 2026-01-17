# API Documentation

Complete reference for the Copywriting Master REST API.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-backend.railway.app/api`

## Authentication

All endpoints (except auth) require JWT authentication.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register New User

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt_token_here"
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt_token_here"
}
```

### Get Current User

```http
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-17T..."
  }
}
```

---

## Project Endpoints

### List All Projects

```http
GET /api/projects
```

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "My Marketing Campaign",
      "pinecone_namespace": "project-uuid",
      "created_at": "2024-01-17T...",
      "updated_at": "2024-01-17T..."
    }
  ]
}
```

### Get Single Project

```http
GET /api/projects/:projectId
```

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Marketing Campaign",
    "pinecone_namespace": "project-uuid",
    "created_at": "2024-01-17T...",
    "updated_at": "2024-01-17T..."
  }
}
```

### Create Project

```http
POST /api/projects
```

**Request Body:**
```json
{
  "name": "New Marketing Campaign"
}
```

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "New Marketing Campaign",
    "pinecone_namespace": "project-uuid",
    ...
  }
}
```

### Update Project

```http
PUT /api/projects/:projectId
```

**Request Body:**
```json
{
  "name": "Updated Campaign Name"
}
```

### Delete Project

```http
DELETE /api/projects/:projectId
```

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

---

## Document Endpoints

### List Documents

```http
GET /api/documents/:projectId
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "filename": "brand-guidelines.pdf",
      "file_type": "application/pdf",
      "upload_date": "2024-01-17T...",
      "chunk_count": 15
    }
  ]
}
```

### Upload Document

```http
POST /api/documents/:projectId/upload
```

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File (.txt, .md, .pdf)

**Response:**
```json
{
  "message": "Document uploaded and processed successfully",
  "document": {
    "id": "uuid",
    "filename": "brand-guidelines.pdf",
    "chunk_count": 15
  }
}
```

**Process:**
1. File uploaded and text extracted
2. AI chunking creates semantic segments
3. Cohere generates embeddings (1024d)
4. Vectors stored in Pinecone with project namespace
5. Metadata saved to PostgreSQL

### Delete Document

```http
DELETE /api/documents/:projectId/:documentId
```

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

---

## Chat Endpoints

### List Threads

```http
GET /api/chat/:projectId/threads
```

**Response:**
```json
{
  "threads": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "title": "Ad Script for Product Launch",
      "created_at": "2024-01-17T...",
      "updated_at": "2024-01-17T..."
    }
  ]
}
```

### Create Thread

```http
POST /api/chat/:projectId/threads
```

**Request Body:**
```json
{
  "title": "New Conversation"  // Optional
}
```

**Response:**
```json
{
  "thread": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "New Conversation",
    ...
  }
}
```

### Get Thread Messages

```http
GET /api/chat/threads/:threadId/messages
```

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "thread_id": "uuid",
      "role": "user",
      "content": "Create a 30-second ad script...",
      "created_at": "2024-01-17T..."
    },
    {
      "id": "uuid",
      "thread_id": "uuid",
      "role": "assistant",
      "content": "I've generated ad_script copy for you...",
      "created_at": "2024-01-17T..."
    }
  ]
}
```

### Send Message & Generate Copy

```http
POST /api/chat/threads/:threadId/messages
```

**Request Body:**
```json
{
  "content": "Create a 30-second ad script for our SaaS product...",
  "copyType": "ad_script"
}
```

**Copy Types:**
- `ad_script`: 15-60 second video ads
- `ad_copy`: Text ads (Google, Facebook, LinkedIn)
- `email`: Email campaigns
- `landing_page`: Web copy
- `vsl`: Video sales letters

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "I've generated ad_script copy for you.\n\nQuality Score: 92/100..."
  },
  "copyOutput": {
    "id": "uuid",
    "draft": {
      "script": "Full ad script...",
      "metadata": {
        "word_count": 85,
        "estimated_runtime": "28 seconds",
        ...
      }
    },
    "brief": {
      "offer_summary": {...},
      "prospect_analysis": {...},
      ...
    },
    "evaluation": {
      "scores": {
        "brief_adherence": 18,
        "psychological_impact": 19,
        ...
      },
      "total_score": 92,
      "feedback": "",
      "approved": true
    },
    "attempts": 2,
    "warning": null
  }
}
```

**Workflow:**
1. Retrieve context from Pinecone (semantic search)
2. Copy Chief creates comprehensive brief
3. Specialist copywriter generates draft
4. Copy Chief evaluates (0-100 score)
5. If score < 90, iterate with feedback (max 5 attempts)
6. Return final copy when score ≥ 90

### Delete Thread

```http
DELETE /api/chat/threads/:threadId
```

---

## Copy Output Endpoints

### Get Copy Output

```http
GET /api/copy/:copyId
```

**Response:**
```json
{
  "copy": {
    "id": "uuid",
    "thread_id": "uuid",
    "copy_type": "ad_script",
    "content": {...},
    "quality_score": 92,
    "copy_brief": {...},
    "approved": false,
    "created_at": "2024-01-17T..."
  }
}
```

### Approve Copy

```http
POST /api/copy/:copyId/approve
```

**Process:**
1. Marks copy as approved in database
2. Generates Cohere embedding
3. Stores in Pinecone with metadata
4. Links Pinecone ID to copy record

**Response:**
```json
{
  "message": "Copy approved successfully",
  "pinecone_id": "uuid"
}
```

**Pinecone Metadata:**
```json
{
  "type": "approved_copy",
  "project_id": "uuid",
  "copy_type": "ad_script",
  "quality_score": 92,
  "has_metrics": false,
  "content": "Full copy text...",
  "created_at": "2024-01-17T..."
}
```

### List Copy by Thread

```http
GET /api/copy/thread/:threadId
```

**Response:**
```json
{
  "copies": [
    {
      "id": "uuid",
      "copy_type": "ad_script",
      "content": {...},
      "quality_score": 92,
      ...
    }
  ]
}
```

---

## Metrics Endpoints

### Submit Performance Metrics

```http
POST /api/metrics/:copyId
```

**Request Body:**
```json
{
  "metricType": "ctr",
  "metricValue": 3.5,
  "notes": "Facebook campaign, audience: 25-40 professionals"
}
```

**Common Metric Types:**
- `ctr`: Click-through rate (%)
- `conversion_rate`: Conversion rate (%)
- `revenue`: Revenue generated ($)
- `roas`: Return on ad spend
- `engagement_rate`: Engagement rate (%)

**Process:**
1. Saves metric to database
2. Calculates average performance for copy
3. Updates Pinecone metadata:
   ```json
   {
     "has_metrics": true,
     "avg_performance": 3.5,
     "updated_at": "2024-01-17T..."
   }
   ```
4. High-performing copy gets retrieval boost

**Response:**
```json
{
  "message": "Metrics submitted successfully",
  "metric": {
    "id": "uuid",
    "metric_type": "ctr",
    "metric_value": 3.5
  }
}
```

### Get Metrics for Copy

```http
GET /api/metrics/:copyId
```

**Response:**
```json
{
  "metrics": [
    {
      "id": "uuid",
      "copy_output_id": "uuid",
      "metric_type": "ctr",
      "metric_value": 3.5,
      "notes": "Facebook campaign...",
      "recorded_at": "2024-01-17T..."
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error formats:

### 400 Bad Request
```json
{
  "error": "Message content and copy type required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "stack": "..." // Only in development
}
```

---

## Rate Limiting

No built-in rate limiting currently implemented. Consider adding:
- express-rate-limit middleware
- Redis for distributed rate limiting
- API key-based tiered access

---

## Webhooks (Future)

Potential webhook events:
- `copy.generated`: Copy generation completed
- `copy.approved`: Copy approved by user
- `metrics.submitted`: Performance metrics received
- `document.processed`: Document chunking completed

---

## SDKs

Currently no official SDKs. Use standard HTTP clients:

**JavaScript/TypeScript:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-backend.railway.app/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const project = await api.post('/projects', { name: 'New Project' });
```

**Python:**
```python
import requests

headers = {'Authorization': f'Bearer {token}'}
response = requests.post(
    'https://your-backend.railway.app/api/projects',
    json={'name': 'New Project'},
    headers=headers
)
```

**cURL:**
```bash
curl -X POST https://your-backend.railway.app/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Project"}'
```

---

## Testing

Use the included Postman collection or create requests:

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Create Project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project"}'
```
