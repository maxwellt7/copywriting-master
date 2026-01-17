FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies first, then prune devDependencies
RUN npm ci && npm prune --production

# Copy application files
COPY server ./server

# Set environment to production
ENV NODE_ENV=production

# Start the application (runs migrations then starts server)
CMD ["node", "server/start.js"]
