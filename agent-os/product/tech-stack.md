# Tech Stack

## Framework & Runtime
- **Application Framework:** Next.js 15 (App Router with React Server Components)
- **Language/Runtime:** Node.js 20+ with TypeScript 5.8
- **Package Manager:** pnpm 9+ (for fast, disk-efficient dependency management)

## Frontend

### Core Framework & Libraries
- **JavaScript Framework:** React 19 (with concurrent features and transitions)
- **CSS Framework:** Tailwind CSS 4 (with custom design tokens and utility classes)
- **Font System:** Inter Variable (@fontsource-variable/inter) for consistent typography

### Animation & Motion
- **Primary Animation Library:** Framer Motion 12 (for declarative animations, layout animations, and gesture handling)
- **Advanced Motion Graphics:** GSAP 3 (for timeline-based animations and scroll-triggered effects)
- **3D Visualization:** Three.js with @react-three/fiber and @react-three/drei (for 3D photo clustering and gravity simulations)
- **Gesture Library:** @use-gesture/react (for drag, pinch, and swipe interactions)

### UI Components & Interactions
- **Component Library:** Custom components built on Radix UI primitives (@radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-tooltip)
- **Icon Library:** Lucide React (for consistent iconography across the application)
- **Utility Functions:** clsx and tailwind-merge (for conditional class name composition)
- **Masonry Layout:** react-masonry-css (for responsive photo grid layouts)

### Performance & Data Fetching
- **Virtual Scrolling:** @tanstack/react-virtual (for performant rendering of 10,000+ photos)
- **Data Fetching:** SWR 2 (for stale-while-revalidate caching and optimistic updates)
- **Client-Side Search:** Fuse.js 7 (for fuzzy search with custom scoring)

### Special Effects
- **Confetti Animations:** canvas-confetti (for celebration effects on badge unlocks)
- **Blurhash Encoding:** blurhash (for placeholder image generation)

## Backend

### Database & Storage
- **Primary Database:** Supabase (PostgreSQL 15 with pgvector extension for embeddings)
- **ORM/Query Builder:** Supabase JS SDK (@supabase/supabase-js, @supabase/ssr for server-side rendering)
- **Local Caching:** SQLite (better-sqlite3) for enrichment workflow staging
- **Vector Database:** Pinecone (@pinecone-database/pinecone) for semantic photo search with embeddings
- **Session Cache:** Upstash Redis (@upstash/redis) for rate limiting and temporary data

### AI & Machine Learning
- **Primary Vision API:** Google Gemini Vision (@google/generative-ai) for cost-efficient image analysis
- **Secondary Vision APIs:** Anthropic Claude (@anthropic-ai/sdk) and OpenAI (openai) for fallback and specialized tasks
- **Embeddings:** LangChain (@langchain/core, @langchain/openai) for vector embedding generation

### External Integrations
- **Photo Storage:** SmugMug API (oauth-1.0a for OAuth 1.0 authentication)
- **Image Optimization:** Next.js Image Optimization (built-in with loader configuration)

### API Layer
- **API Framework:** Next.js API Routes (App Router route handlers)
- **Serverless Functions:** Vercel Edge Functions (@vercel/node) for global low-latency endpoints
- **Error Tracking:** Sentry (@sentry/nextjs) for error monitoring and performance tracking

## Testing & Quality

### Testing Frameworks
- **E2E Testing:** Playwright (@playwright/test) for browser automation and visual regression testing
- **Test Framework:** Built-in testing capabilities (tests to be implemented)

### Code Quality Tools
- **Linting:** ESLint 9 (with eslint-config-next for Next.js-specific rules)
- **TypeScript Checking:** TypeScript compiler (tsc) with strict mode enabled
- **Type Definitions:** @types/node, @types/react, @types/react-dom, @types/better-sqlite3, @types/crypto-js, @types/lodash-es, @types/jspdf

## Deployment & Infrastructure

### Hosting & CDN
- **Hosting:** Vercel (recommended) with automatic preview deployments and edge network
- **CDN:** Vercel Edge Network for global content delivery
- **Image CDN:** Vercel Image Optimization for on-demand image transformations

### CI/CD
- **Version Control:** Git with GitHub
- **CI/CD:** GitHub Actions (inferred from package scripts and deployment workflow)
- **Build System:** Next.js build system with custom build wrappers (scripts/build-wrapper.js)

### Environment Management
- **Environment Variables:** dotenv for local development configuration
- **Secrets Management:** Vercel Environment Variables for production secrets

## Utilities & Helper Libraries

### Data Manipulation
- **Utility Functions:** lodash-es (tree-shakeable utility functions)
- **Date Handling:** date-fns 4 (for date formatting and manipulation)
- **Encryption:** crypto-js (for secure token handling)

### PDF Generation
- **PDF Library:** jsPDF (@types/jspdf) for story export to PDF format

### CLI & Build Tools
- **CLI Progress:** cli-progress (for enrichment script progress bars)
- **CLI Styling:** chalk 5 (for colored terminal output)
- **TypeScript Runner:** tsx 4 (for executing TypeScript scripts directly)

### Development Tools
- **PostCSS:** autoprefixer, postcss, @tailwindcss/postcss (for CSS processing)
- **Build Tools:** Custom scripts for context building and incremental updates

## Third-Party Services

### AI Providers
- **Vision Analysis:** Google Gemini Vision API (primary), Anthropic Claude Vision, OpenAI Vision (fallback)
- **Embeddings:** OpenAI Embeddings API via LangChain

### Data & Authentication
- **Authentication:** Supabase Auth (built into Supabase platform)
- **Database:** Supabase (managed PostgreSQL with real-time subscriptions)
- **Vector Search:** Pinecone (managed vector database)
- **Caching:** Upstash Redis (serverless Redis)

### Monitoring & Analytics
- **Error Tracking:** Sentry (application monitoring and error tracking)
- **Performance Monitoring:** Sentry Performance (built into @sentry/nextjs)

### Photo Management
- **Photo Storage:** SmugMug (third-party photo hosting with OAuth API)

## Development Scripts

### Available Commands
- `pnpm dev` - Start Next.js development server with hot reload
- `pnpm build` - Production build with context generation
- `pnpm build:context` - Generate AI context files for enrichment
- `pnpm build:force-context` - Force rebuild AI context files
- `pnpm enrich` - Run local photo enrichment workflow
- `pnpm enrich:smugmug` - Run SmugMug photo enrichment workflow
- `pnpm sync:metadata` - Sync enriched metadata from SQLite to Supabase
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint on codebase
- `pnpm type-check` - Run TypeScript compiler without emitting files
- `pnpm clean` - Remove build artifacts and cache

## Architecture Patterns

### Frontend Architecture
- **Rendering Strategy:** Hybrid (React Server Components for data fetching, Client Components for interactivity)
- **State Management:** React hooks (useState, useReducer) with SWR for server state
- **Styling Approach:** Utility-first with Tailwind CSS and CSS modules for complex animations
- **Component Pattern:** Composition over inheritance with prop drilling minimized via context

### Backend Architecture
- **API Design:** RESTful endpoints with Next.js route handlers
- **Data Flow:** Server Components -> API Routes -> Supabase/Pinecone -> Response
- **Enrichment Pipeline:** SmugMug -> SQLite (staging) -> AI Vision APIs -> Supabase (production)

### Performance Optimizations
- **Code Splitting:** Automatic with Next.js dynamic imports and React.lazy
- **Image Optimization:** Next.js Image component with automatic format selection (WebP/AVIF)
- **Caching Strategy:** SWR for client-side caching, Redis for server-side rate limiting, CDN edge caching
- **Virtual Rendering:** Tanstack Virtual for large photo collections

## Security Considerations
- **Environment Variables:** Never commit secrets (enforced via .gitignore)
- **API Authentication:** Supabase Row Level Security (RLS) policies for data access
- **CORS Configuration:** Restricted to allowed origins in production
- **Content Security Policy:** Next.js security headers configured for XSS protection
