# Copywriting Master

An AI-powered multi-agent copywriting system that uses Claude Sonnet 4.5 to generate high-quality marketing copy through specialized AI agents with quality control loops and performance feedback.

## Features

- **Multi-Agent Architecture**: Copy Chief orchestrator + 5 specialized copywriter agents
- **Quality Control Loop**: Automated evaluation and iteration until 90/100 quality threshold
- **Performance Feedback System**: Metrics-based learning from approved copy
- **Semantic Search**: Pinecone-powered context retrieval
- **Project Isolation**: Each project has its own knowledge base
- **Thread-based Conversations**: Organized chat history
- **Document Upload & AI Chunking**: Smart document processing

## Architecture

```
Frontend (Vercel)          Backend (Railway)           AI Services
├── React + TypeScript     ├── Node.js + Express      ├── Anthropic Claude
├── Zustand State          ├── PostgreSQL             ├── Pinecone (vectors)
└── Tailwind CSS           ├── JWT Auth               └── Cohere (embeddings)
                           └── Multi-agent System
```

## Copy Types Supported

1. **Ad Script** (15-60 second video ads)
2. **Ad Copy** (Google, Facebook, LinkedIn text ads)
3. **Email** (Conversion-focused email campaigns)
4. **Landing Page** (High-converting web copy)
5. **VSL** (10-45 minute video sales letters)

## AI Agent System

### Copy Chief
- Creates comprehensive Copy & Funnel Briefs
- Routes to appropriate specialist copywriter
- Evaluates quality (0-100 scoring)
- Enforces 90/100 threshold with iteration loop

### Specialist Copywriters
Each agent follows proven frameworks:
- **Ad Script**: Hook-Value-CTA
- **Ad Copy**: AIDA (Attention-Interest-Desire-Action)
- **Email**: PAS (Problem-Agitate-Solution)
- **Landing Page**: PASTOR framework
- **VSL**: Storytelling-based conversion architecture

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (Railway)
- Pinecone (vector database)
- Cohere (embeddings - 1024d)
- Anthropic Claude Sonnet 4.5

### Frontend
- React 18 + TypeScript
- Vite
- Zustand (state management)
- Tailwind CSS
- React Router

## Getting Started

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed setup instructions.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

## API Documentation

See [API.md](./API.md) for complete API reference.

## Project Structure

```
copywriting-master/
├── server/                 # Backend (Node.js + Express)
│   ├── config/            # Database, Pinecone, Cohere, Anthropic clients
│   ├── middleware/        # Auth, error handling
│   ├── routes/            # API endpoints
│   ├── services/          # AI agents, chunking, retrieval
│   ├── utils/             # Prompts, helpers
│   └── migrations/        # Database schema
├── src/                   # Frontend (React + TypeScript)
│   ├── components/        # Reusable UI components
│   ├── pages/             # Route pages
│   ├── services/          # API client
│   ├── store/             # Zustand state
│   └── types/             # TypeScript definitions
└── docs/                  # Documentation
```

## Quality Control

The system enforces a 90/100 quality score through:
- Brief Adherence (20 points)
- Psychological Impact (20 points)
- Voice Consistency (20 points)
- Structural Integrity (20 points)
- Conversion Optimization (20 points)

Failed evaluations trigger automatic revision with specific feedback.

## Performance Feedback Loop

When users submit performance metrics (CTR, conversion rate, revenue):
1. Metrics stored in PostgreSQL
2. Pinecone metadata updated with avg_performance
3. High-performing copy gets retrieval boost
4. Future briefs reference successful patterns

This creates a compounding knowledge base that improves over time.

## License

MIT

## Support

For issues and questions, open a GitHub issue or contact support.
