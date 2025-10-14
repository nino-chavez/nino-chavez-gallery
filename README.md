# SmugMug Gallery - AI-Augmented Photo Discovery Platform

**Status**: In Development
**Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, OpenAI, Pinecone, Upstash Redis

---

## Overview

An intelligent photo gallery frontend for SmugMug that transforms photo discovery through AI-powered semantic search, predictive prefetching, and automated metadata enrichment.

### Key Features

- 🔍 **Semantic Search**: Natural language queries ("dramatic BMX backflip at sunset")
- 🤖 **Predictive Prefetching**: AI learns user behavior to preload content
- 📸 **Metadata Enrichment**: GPT-4 Vision generates rich photo metadata
- 🎯 **Event Clustering**: Automatic grouping by temporal proximity
- ⚡ **Performance Optimized**: 99% cost reduction through intelligent caching
- 🔐 **Secure Proxy**: Server-side OAuth handling, no client-side credentials

### Architecture

```
Browser → Next.js API Routes → RAG Layer → SmugMug API
         ↑ Persistent state     ↑ Semantic cache
         ↑ AI memory            ↑ Vector embeddings
         ↑ Predictive engine    ↑ Token optimization
         ↑ Caching layer        ↑ 100x faster queries
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- SmugMug API credentials
- OpenAI API key
- Pinecone account
- Upstash Redis account

### Installation

```bash
# Clone repository
git clone git@github.com:nino-chavez/nino-chavez-gallery.git
cd nino-chavez-gallery

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# (See SETUP.md for detailed instructions)

# Start development server
pnpm dev
```

### First-Time Setup

1. **Enrich Existing SmugMug Photos** (one-time):
   ```bash
   pnpm run enrich:smugmug --all
   ```

2. **Build Gallery Context**:
   ```bash
   pnpm run build:context
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

---

## Workflow Integration

### Lightroom → SmugMug Workflow

For ongoing photo enrichment:

```bash
# After exporting from Lightroom:
pnpm run enrich ~/Photos/exports/latest/

# Then upload to SmugMug via SmugMug Uploader
```

Or use automated watch mode:

```bash
# Watch Lightroom export folder for new photos
pnpm run enrich:watch ~/Photos/exports/
```

---

## Documentation

- [SETUP.md](./docs/SETUP.md) - Detailed setup instructions
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [ENRICHMENT.md](./docs/ENRICHMENT.md) - Metadata enrichment workflow
- [API.md](./docs/API.md) - API route documentation

---

## Cost Projections

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| OpenAI Embeddings | 20 photos/day | $0.01 |
| Pinecone | 1,247 vectors | $0 (free tier) |
| Upstash Redis | 10K commands/day | $0 (free tier) |
| GPT-4o Reranking | 200 queries/day | $0.60 |
| Vercel Hosting | Hobby plan | $0 |
| **Total** | | **$0.61/month** |

**Comparison**: Traditional approach costs ~$150/month

---

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/smugmug/       # API proxy routes
│   ├── album/[key]/       # Album detail pages
│   └── search/            # Search results
├── lib/
│   ├── smugmug/           # SmugMug API client
│   ├── ai/                # RAG pipeline, embeddings
│   ├── cache/             # Redis caching
│   └── analytics/         # Predictive engine
├── components/
│   ├── gallery/           # Gallery UI components
│   └── search/            # Search interface
└── scripts/
    ├── enrich-smugmug.ts  # Enrich existing photos
    └── enrich-local.ts    # Enrich before upload
```

### Available Scripts

```bash
# Development
pnpm dev                          # Start dev server
pnpm build                        # Build for production
pnpm start                        # Start production server

# Enrichment
pnpm run enrich:smugmug --all     # Enrich all SmugMug photos (one-time)
pnpm run enrich:smugmug --since 7d  # Enrich last 7 days
pnpm run enrich ~/Photos/exports/ # Enrich local photos
pnpm run enrich:watch ~/Photos/   # Watch folder for new photos

# Gallery Context
pnpm run build:context            # Generate gallery-context.json
pnpm run update:context           # Incremental update

# Testing
pnpm test                         # Run tests
pnpm type-check                   # TypeScript validation
pnpm lint                         # ESLint
```

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Required for production:

```bash
# SmugMug API
SMUGMUG_API_KEY
SMUGMUG_API_SECRET
SMUGMUG_ACCESS_TOKEN
SMUGMUG_ACCESS_TOKEN_SECRET
SMUGMUG_USERNAME

# AI Services
OPENAI_API_KEY
PINECONE_API_KEY
PINECONE_INDEX_NAME

# Caching
UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN
```

---

## Roadmap

### Phase 1: MVP ✅
- [x] SmugMug API proxy
- [x] Basic gallery UI
- [x] Semantic search foundation

### Phase 2: AI Enhancement (In Progress)
- [x] RAG pipeline
- [x] Metadata enrichment scripts
- [ ] Predictive prefetching
- [ ] User behavior analytics

### Phase 3: Advanced Features
- [ ] Multi-modal search
- [ ] Event storytelling
- [ ] Photographer's assistant mode
- [ ] Facial recognition

---

## License

MIT

## Author

Nino Chavez - [nino.photos](https://nino.photos)

---

**Built with**: Next.js 15, React 19, TypeScript, Tailwind CSS, OpenAI, Pinecone, Upstash Redis
