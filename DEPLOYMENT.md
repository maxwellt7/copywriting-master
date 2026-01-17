# Deployment Guide

Production deployment instructions for Railway (backend) and Vercel (frontend).

## Overview

- **Backend**: Railway with PostgreSQL
- **Frontend**: Vercel
- **Database**: Railway PostgreSQL
- **Vector Store**: Pinecone (managed service)
- **Embeddings**: Cohere (API)
- **AI**: Anthropic Claude (API)

## Prerequisites

1. GitHub repository with the code
2. Railway account (railway.app)
3. Vercel account (vercel.com)
4. Pinecone account with index created
5. Cohere API key
6. Anthropic API key

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Node.js

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a database
4. Copy the `DATABASE_URL` from the database's variables

### Step 3: Configure Environment Variables

In Railway project settings → Variables, add:

```
DATABASE_URL=<provided by Railway PostgreSQL>
PINECONE_API_KEY=<your pinecone api key>
PINECONE_INDEX_NAME=copywriting-master
COHERE_API_KEY=<your cohere api key>
ANTHROPIC_API_KEY=<your anthropic api key>
JWT_SECRET=<generate random 32+ character string>
NODE_ENV=production
PORT=3000
FRONTEND_URL=<will update after Vercel deployment>
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Run Database Migration

1. In Railway, go to your project
2. Open the backend service
3. Click "Settings" → "Deploy"
4. Add a custom start command (temporary):
   ```
   npm run migrate && node server/index.js
   ```
5. After first successful deployment, remove `npm run migrate &&` from start command

Alternative: Use Railway CLI
```bash
railway login
railway link
railway run npm run migrate
```

### Step 5: Deploy Backend

1. Railway auto-deploys on git push
2. Monitor deployment logs
3. Once deployed, note the public URL (e.g., `https://your-app.railway.app`)

### Step 6: Test Backend

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "Copywriting Master API"
}
```

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend for Deployment

Ensure `vercel.json` exists in root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Step 2: Deploy to Vercel

#### Option A: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables:

```
VITE_API_URL=<your Railway backend URL>
```

Example:
```
VITE_API_URL=https://copywriting-master-production.railway.app
```

### Step 4: Update Backend FRONTEND_URL

1. Go back to Railway
2. Update `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=<your Vercel URL>
   ```
3. Example: `FRONTEND_URL=https://copywriting-master.vercel.app`
4. Railway will auto-redeploy with new variable

### Step 5: Test Full Stack

1. Visit your Vercel URL
2. Register a new account
3. Create a project
4. Upload a document
5. Generate copy
6. Verify all features work

## Part 3: Pinecone Setup

### Create Production Index

1. Log in to Pinecone console
2. Create new index:
   - **Name**: `copywriting-master` (or match your `PINECONE_INDEX_NAME`)
   - **Dimensions**: 1024
   - **Metric**: cosine
   - **Cloud**: AWS (recommended)
   - **Region**: us-east-1 (or closest to Railway deployment)
3. Copy API key
4. Update Railway environment variable `PINECONE_API_KEY`

## Part 4: Custom Domain (Optional)

### Backend (Railway)

1. In Railway project → Settings → Domains
2. Click "Generate Domain" or add custom domain
3. If custom domain:
   - Add domain (e.g., `api.yoursite.com`)
   - Configure DNS CNAME record
   - Wait for SSL certificate

### Frontend (Vercel)

1. In Vercel project → Settings → Domains
2. Add your custom domain (e.g., `app.yoursite.com`)
3. Configure DNS:
   - Type: CNAME
   - Name: app (or www)
   - Value: cname.vercel-dns.com
4. Wait for SSL certificate provisioning

### Update Environment Variables

After custom domains are active:

**Railway:**
```
FRONTEND_URL=https://app.yoursite.com
```

**Vercel:**
```
VITE_API_URL=https://api.yoursite.com
```

## Part 5: Monitoring & Logs

### Railway Logs

1. Project → Service → Deployments
2. Click on deployment
3. View real-time logs
4. Monitor for errors

### Vercel Logs

1. Project → Deployments
2. Click on deployment
3. View function logs
4. Monitor runtime logs

### Database Monitoring

1. Railway → PostgreSQL service
2. View metrics:
   - Connections
   - Query performance
   - Storage usage

## Part 6: Scaling Considerations

### Database

- Railway PostgreSQL auto-scales storage
- Monitor connection pool usage
- Add read replicas if needed (Railway Pro)

### Backend

- Railway auto-scales based on load
- Monitor response times
- Consider multiple instances for high traffic

### Pinecone

- Starter tier: 100k vectors
- Upgrade as knowledge base grows
- Monitor vector storage usage

### Rate Limits

- **Anthropic**: Monitor API usage, upgrade tier if needed
- **Cohere**: Track embedding generation, upgrade plan accordingly
- **Pinecone**: Watch query volume, upgrade if needed

## Part 7: Backup & Recovery

### Database Backups

Railway automatic backups:
- Enabled by default
- 7-day retention
- Point-in-time recovery

Manual backup:
```bash
railway login
railway db backup
```

### Vector Store

Pinecone handles backups automatically. For additional safety:
- Keep source documents in version control
- Re-upload can reconstruct vector store

### Environment Variables

Store all environment variables securely:
- Use password manager
- Document in private wiki
- Never commit to git

## Part 8: CI/CD Pipeline

### Automatic Deployments

**Railway:**
- Auto-deploys on git push to main
- Configure branch in Railway settings

**Vercel:**
- Auto-deploys on git push
- Preview deployments for PRs
- Production deployment on main branch

### Manual Deployments

**Railway CLI:**
```bash
railway up
```

**Vercel CLI:**
```bash
vercel --prod
```

## Part 9: Security Checklist

- [ ] Environment variables secured
- [ ] JWT_SECRET is strong random string
- [ ] Database uses SSL connections
- [ ] API endpoints require authentication
- [ ] CORS configured correctly
- [ ] File upload size limits set
- [ ] Rate limiting implemented (if high traffic)
- [ ] HTTPS enforced on all endpoints

## Part 10: Troubleshooting

### Backend Won't Start

1. Check Railway logs for errors
2. Verify all environment variables set
3. Ensure DATABASE_URL is correct
4. Check Pinecone/Cohere/Anthropic API keys

### Frontend Can't Connect

1. Verify VITE_API_URL is correct
2. Check CORS settings in backend
3. Ensure Railway service is running
4. Test API health endpoint directly

### Database Connection Errors

1. Check Railway PostgreSQL is running
2. Verify DATABASE_URL format
3. Check connection pool settings
4. Monitor active connections

### Migration Fails

1. Check database permissions
2. Verify PostgreSQL version compatibility
3. Run migration manually via Railway CLI
4. Check migration file SQL syntax

## Support

For deployment issues:
- Railway: [railway.app/help](https://railway.app/help)
- Vercel: [vercel.com/support](https://vercel.com/support)
- Pinecone: [docs.pinecone.io](https://docs.pinecone.io)

## Estimated Costs (USD/month)

- **Railway Starter**: $5 + usage
- **Vercel Hobby**: Free (or $20/mo Pro)
- **Pinecone Starter**: Free tier available
- **Cohere**: Pay per use (~$0.0001/embedding)
- **Anthropic**: Pay per use (~$3/million input tokens)

Total: ~$10-50/month for moderate usage
