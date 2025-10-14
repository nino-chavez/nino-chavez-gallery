# Vercel Deployment Guide

This guide walks through deploying the standalone `nino-chavez-gallery` to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- GitHub repository: `nino-chavez/nino-chavez-gallery`
- Required API credentials (see Environment Variables section)

## Deployment Steps

### 1. Remove Old Gallery Project (if exists)

If you previously deployed the gallery from the monorepo, you'll need to either:
- **Option A (Recommended):** Delete the old Vercel project and create a new one
- **Option B:** Update the existing project's Git integration

To delete via CLI:
```bash
vercel remove nino-chavez-gallery-old
```

Or via Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Find the old gallery project
3. Settings → Advanced → Delete Project

### 2. Create New Vercel Project

#### Via Vercel CLI (Recommended):

```bash
cd /path/to/nino-chavez-gallery

# Login to Vercel
vercel login

# Link to new project
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? nino-chavez-gallery
# - In which directory is your code located? ./
# - Want to modify settings? No
```

#### Via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `nino-chavez/nino-chavez-gallery`
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `pnpm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `pnpm install` (auto-detected)

### 3. Configure Environment Variables

#### Required Variables (Must Set):

```bash
# SmugMug API Credentials
SMUGMUG_API_KEY=your_key_here
SMUGMUG_API_SECRET=your_secret_here
SMUGMUG_ACCESS_TOKEN=your_token_here
SMUGMUG_ACCESS_TOKEN_SECRET=your_token_secret_here
SMUGMUG_USERNAME=ninochavez
```

#### Recommended Variables (Choose at least one):

```bash
# Vision API Provider (defaults to 'auto')
VISION_PROVIDER=auto  # Options: auto, claude, openai, gemini

# Anthropic Claude (RECOMMENDED - 64% cheaper)
ANTHROPIC_API_KEY=sk-ant-xxx

# OpenAI (Fallback)
OPENAI_API_KEY=sk-xxx

# Google Gemini (Cheapest but lower quality)
GOOGLE_API_KEY=xxx
```

#### Optional Variables (Performance):

```bash
# Pinecone Vector Database (for semantic search)
PINECONE_API_KEY=xxx
PINECONE_INDEX_NAME=gallery-photos

# Upstash Redis (for caching)
UPSTASH_REDIS_URL=redis://xxx
UPSTASH_REDIS_TOKEN=xxx

# Analytics & Monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx
SENTRY_DSN=xxx
```

#### Setting Variables via CLI:

```bash
# Add all environment variables at once
vercel env add SMUGMUG_API_KEY
vercel env add SMUGMUG_API_SECRET
vercel env add SMUGMUG_ACCESS_TOKEN
vercel env add SMUGMUG_ACCESS_TOKEN_SECRET
vercel env add SMUGMUG_USERNAME
vercel env add ANTHROPIC_API_KEY
vercel env add VISION_PROVIDER

# For each command, select:
# - Environment: Production, Preview, Development (select all 3)
# - Enter value when prompted
```

#### Setting Variables via Dashboard:

1. Go to your project: https://vercel.com/[your-username]/nino-chavez-gallery
2. Settings → Environment Variables
3. Add each variable:
   - Name: `SMUGMUG_API_KEY`
   - Value: `your_key_here`
   - Environments: Check all (Production, Preview, Development)
   - Click "Save"
4. Repeat for all variables

### 4. Deploy

#### Via CLI:

```bash
# Deploy to production
vercel --prod

# Or trigger deployment from git
git push origin main  # Vercel auto-deploys from main branch
```

#### Via Dashboard:

Push to GitHub and Vercel will automatically deploy:
```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

### 5. Verify Deployment

1. Wait for deployment to complete (2-3 minutes)
2. Visit your production URL: `https://nino-chavez-gallery.vercel.app`
3. Check deployment logs if issues occur:
   ```bash
   vercel logs --prod
   ```

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `gallery.ninochavez.com`)
3. Configure DNS:
   - Type: `CNAME`
   - Name: `gallery`
   - Value: `cname.vercel-dns.com`

### Performance Monitoring

- Enable Vercel Analytics: Project Settings → Analytics
- Configure Sentry (optional): Add `SENTRY_DSN` environment variable

### Build Optimizations

The project is pre-configured with:
- ✅ Next.js standalone output
- ✅ Image optimization for SmugMug photos
- ✅ React 19 optimizations
- ✅ Automatic static optimization
- ✅ Edge runtime support
- ✅ Built-in caching headers

## Troubleshooting

### Build Failures

**Problem:** `Build failed with error: Module not found`

**Solution:** Ensure all dependencies are in `package.json`:
```bash
pnpm install
git add package.json pnpm-lock.yaml
git commit -m "Update dependencies"
git push
```

**Problem:** `Error: Cannot find module 'tsx'`

**Solution:** `tsx` is a dev dependency and should be available during build:
```bash
vercel env add NODE_ENV
# Set value: production
```

### API Errors

**Problem:** `Error: SmugMug API authentication failed`

**Solution:** Verify environment variables are set correctly:
```bash
vercel env ls
# Check that all SMUGMUG_* variables are present
```

**Problem:** `Error: Vision API rate limit exceeded`

**Solution:** Switch to a different provider or upgrade your API plan:
```bash
vercel env add VISION_PROVIDER
# Set value: claude (or openai, gemini)
```

### Performance Issues

**Problem:** Slow initial page loads

**Solution:** Enable Upstash Redis caching:
```bash
vercel env add UPSTASH_REDIS_URL
vercel env add UPSTASH_REDIS_TOKEN
```

**Problem:** Image loading slowly

**Solution:** Verify Next.js image optimization is enabled (it should be by default):
- Check `next.config.ts` has `images.remotePatterns` configured
- Ensure `photos.smugmug.com` is in allowed domains

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
vercel logs --prod --follow

# Recent logs
vercel logs --prod --since 1h

# Filter by function
vercel logs --prod --output build
```

### Performance Metrics

- **Vercel Dashboard:** https://vercel.com/[username]/nino-chavez-gallery/analytics
- **Lighthouse Scores:** Run `npx lighthouse https://your-url.vercel.app`
- **Core Web Vitals:** Vercel Analytics tab shows LCP, FID, CLS

## Cost Estimates

### Vercel Hosting
- **Hobby Plan (Free):**
  - 100 GB bandwidth/month
  - 100 hours build time/month
  - 6,000 minutes Edge Function execution
  - **Sufficient for:** Personal galleries with <10k monthly visitors

- **Pro Plan ($20/month):**
  - 1 TB bandwidth/month
  - 400 hours build time/month
  - 1,000,000 minutes Edge Function execution
  - **Needed for:** Professional galleries with >10k monthly visitors

### API Costs (per 1,000 photos)
- **Anthropic Claude:** ~$3.60 (RECOMMENDED)
- **Google Gemini:** ~$1.00 (cheapest but lower quality)
- **OpenAI GPT-4:** ~$10.00 (most expensive)
- **Pinecone:** ~$0.10 (vector database)
- **Upstash Redis:** Free tier covers most use cases

### Estimated Monthly Cost
- **Minimal (Hobby):** $0 (Vercel free + Gemini API)
- **Recommended (Pro):** $25/month (Vercel Pro + Claude API + Redis)
- **Professional (Full):** $45/month (Vercel Pro + Claude + Pinecone + Sentry)

## Next Steps

1. **Test the deployment:** Visit your production URL
2. **Monitor performance:** Check Vercel Analytics
3. **Configure custom domain:** (Optional) Add `gallery.ninochavez.com`
4. **Enable analytics:** Set up Vercel Analytics and/or Sentry
5. **Optimize caching:** Configure Upstash Redis for better performance

## Support

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **SmugMug API Docs:** https://api.smugmug.com/api/v2/doc
- **Project Issues:** https://github.com/nino-chavez/nino-chavez-gallery/issues
