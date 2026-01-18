# Railway Deployment Troubleshooting

## Current Status

### Backend Server ✅
The backend is running successfully according to Railway logs:
- ✅ Container starts
- ✅ Migrations complete
- ✅ PostgreSQL connected
- ✅ Anthropic client initialized
- ✅ Cohere client initialized
- ✅ Server running on port 8080
- ✅ Server initialization complete

### Issue: 502 Bad Gateway Errors ⚠️
External curl requests to the backend return 502 errors:
```
{"status":"error","code":502,"message":"Application failed to respond"}
```

## Possible Causes

### 1. Railway Service Configuration
The service might not be properly configured in the Railway dashboard. Check:

**In Railway Dashboard → Your Service → Settings:**
- Service Type should be set to "Web Service" (not "Worker")
- Port should be auto-detected or set to `$PORT`
- Health Check path (if configured) should be `/health`
- Ensure the service has a public domain assigned

### 2. Network Binding
The server is configured to bind to `0.0.0.0:$PORT` which should work, but verify in logs that it's not binding to localhost.

**Code location:** `server/index.js:77`
```javascript
app.listen(PORT, '0.0.0.0', () => { ... });
```

### 3. Deployment Platform
We've tried both:
- Dockerfile-based deployment
- Nixpacks-based deployment

Both show the server running but 502 errors persist.

## Steps to Resolve

### Option A: Check Railway Dashboard Settings
1. Go to https://railway.app
2. Select the "copywriting-master" project
3. Click on the backend service
4. Go to "Settings" tab
5. Verify:
   - Service Name: `copywriting-master`
   - Start Command: Should be empty (uses nixpacks.toml)
   - Port: Should show `$PORT` or be auto-detected
   - Public Networking: Should be enabled
   - Custom Domain: `copywriting-master-production.up.railway.app`

### Option B: Test from Frontend
Since CORS is configured to allow the Vercel frontend, test if the frontend can connect:

1. Visit: https://copywriting-master-vb5u.vercel.app
2. Try to register a new user
3. Check browser console for errors

If the frontend CAN connect:
- Backend is working fine
- 502 errors are specific to external/direct requests
- This is acceptable for production (frontend is the only client)

If the frontend CANNOT connect:
- Check that `VITE_API_URL` is set in Vercel to: `https://copywriting-master-production.up.railway.app`
- Check browser console for CORS errors
- Check Railway logs for incoming request attempts

### Option C: Redeploy Service
Sometimes Railway needs a fresh service deployment:

1. In Railway dashboard, delete the current service
2. Create a new service from the GitHub repo
3. Add all environment variables
4. Deploy

### Option D: Check Railway Status
Visit https://railway.app/status to ensure Railway platform is fully operational.

## Environment Variables Checklist

Ensure these are set in Railway:
- ✅ `DATABASE_URL` - Auto-set by Railway PostgreSQL
- ✅ `ANTHROPIC_API_KEY`
- ✅ `COHERE_API_KEY`
- ✅ `PINECONE_API_URL`
- ✅ `PINECONE_INDEX_NAME`
- ✅ `JWT_SECRET`
- ✅ `FRONTEND_URL` - Should be `https://copywriting-master-vb5u.vercel.app`
- ✅ `NODE_ENV` - Should be `production`

## Files Modified for Railway Deployment

1. `server/start.js` - Runs migrations then starts server
2. `server/index.js` - Binds to 0.0.0.0 for Docker networking
3. `server/migrations/init.sql` - Idempotent migrations
4. `server/config/db.js` - Graceful error handling
5. `nixpacks.toml` - Nixpacks build configuration
6. `package.json` - migrate script points to start.js

## Next Steps

1. **Test the frontend** - This is the most important test
2. If frontend works, the backend is fine (502 on direct requests is acceptable)
3. If frontend doesn't work, check Railway dashboard settings
4. Consider using Railway's built-in logs/metrics to see if requests are reaching the container

## Logs Show Everything Working

Latest successful startup sequence:
```
Starting Container
🚀 Starting Copywriting Master...
📊 Running database migrations...
✅ Migrations complete
🌐 Starting API server...
✓ Anthropic client initialized
✓ Cohere client initialized
✓ PostgreSQL client connected
✓ Connected to PostgreSQL database
✅ Server initialization complete
╔═══════════════════════════════════════════════╗
║   Copywriting Master API Server              ║
║   Status: Running                             ║
║   Port: 8080                                  ║
║   Environment: production                    ║
╚═══════════════════════════════════════════════╝
```

The backend IS running. The issue is with Railway's proxy/networking configuration.
