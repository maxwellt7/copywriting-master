# Getting Started with Copywriting Master

Complete setup guide for deploying and using the Copywriting Master system.

## Prerequisites

### Required Accounts
1. **Pinecone** - Vector database for semantic search
2. **Cohere** - Embedding generation (embed-english-v3.0)
3. **Anthropic** - Claude Sonnet 4.5 API access
4. **Railway** - Backend hosting (with PostgreSQL)
5. **Vercel** - Frontend hosting

### Required Tools
- Node.js 20+ and npm
- Git
- PostgreSQL (for local development)

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd copywriting-master
```

## Step 2: Backend Setup (Local Development)

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/copywriting_master

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=copywriting-master

# Cohere
COHERE_API_KEY=your_cohere_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# JWT
JWT_SECRET=generate_a_random_string_here_min_32_chars

# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Set Up Pinecone Index

1. Log in to Pinecone console
2. Create new index with:
   - **Name**: `copywriting-master`
   - **Dimensions**: 1024
   - **Metric**: cosine
   - **Cloud**: Any (AWS recommended)
   - **Region**: Choose closest to your users

### Set Up PostgreSQL Database

```bash
# Create database (if using local PostgreSQL)
createdb copywriting_master

# Run migrations
npm run migrate
```

### Start Backend Server

```bash
npm run dev
```

The API should now be running at `http://localhost:3000`.

Test with:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-17T...",
  "service": "Copywriting Master API"
}
```

## Step 3: Frontend Setup (Local Development)

The frontend configuration is in the root `package.json` but runs from the `src/` directory.

### Install Frontend Dependencies

Frontend dependencies are included in the root `package.json`. If you need a separate frontend build:

1. Copy `frontend-package.json` to a new frontend directory or use the existing setup
2. Run `npm install` to install all dependencies including frontend packages

### Configure Frontend Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

### Start Frontend Dev Server

```bash
npm run dev
```

The frontend should now be running at `http://localhost:5173`.

## Step 4: Create Your First Project

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Click "New Project"
4. Enter project name (e.g., "My Marketing Campaign")
5. Click "Create"

## Step 5: Upload Knowledge Base Documents

1. Click "Upload Documents"
2. Select `.txt`, `.md`, or `.pdf` files containing:
   - Brand voice guidelines
   - Previous successful copy
   - Product/service information
   - Target audience research
   - Competitor analysis
3. Wait for AI chunking to complete
4. Documents are now embedded and searchable

## Step 6: Generate Your First Copy

1. Click "New Thread"
2. Select copy type (Ad Script, Ad Copy, Email, Landing Page, or VSL)
3. Enter your request, for example:
   ```
   Create a 30-second ad script for our SaaS product targeting busy
   marketing managers. Focus on saving time and increasing ROI.
   ```
4. Click "Generate"
5. Watch the AI workflow:
   - Retrieving context from uploaded documents
   - Creating comprehensive Copy & Funnel Brief
   - Generating initial draft
   - Evaluating quality (scoring 0-100)
   - Iterating if score < 90
   - Delivering final approved copy

## Step 7: Approve High-Quality Copy

When copy scores 90+ and you're satisfied:
1. Click "Approve & Store for Future Use"
2. Copy is embedded in Pinecone
3. Future briefs will reference this approved copy as a pattern

## Step 8: Submit Performance Metrics (Optional)

After running your copy in production:
1. Navigate to the copy output
2. Click "Submit Metrics"
3. Enter performance data:
   - CTR (click-through rate)
   - Conversion rate
   - Revenue generated
   - Notes
4. System updates Pinecone metadata
5. High-performing copy gets prioritized in future retrievals

## Next Steps

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to Railway and Vercel.

### API Integration

See [API.md](./API.md) for programmatic access to the system.

### Optimization Tips

1. **Upload Quality Documents**: Better input = better output
2. **Be Specific in Requests**: Detail target audience, tone, key points
3. **Approve Winning Copy**: Build your knowledge base over time
4. **Submit Real Metrics**: Enable the performance feedback loop

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
psql -l

# Verify DATABASE_URL format
postgresql://username:password@host:port/database
```

### Pinecone Connection Errors

- Verify API key is correct
- Ensure index name matches exactly
- Check index has 1024 dimensions

### Claude API Errors

- Verify Anthropic API key
- Check API usage limits
- Ensure model `claude-sonnet-4-5-20250929` is accessible

### Cohere Embedding Errors

- Verify Cohere API key
- Using `embed-english-v3.0` model
- Check API rate limits

### Frontend Can't Connect to Backend

- Verify backend is running on port 3000
- Check VITE_API_URL in `.env.local`
- Clear browser cache and reload

## Support

For additional help:
- Check [API.md](./API.md) for endpoint details
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production issues
- Open GitHub issues for bugs
