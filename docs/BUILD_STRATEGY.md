# Gallery Build Strategy

## Overview

The gallery uses an **intelligent build system** that avoids regenerating `gallery-context.json` on every deployment, dramatically speeding up production builds.

## How It Works

### 1. Committed Context (Default)
- `gallery-context.json` is **committed to git**
- Production builds use the committed file (fast ~2-3 minutes)
- No SmugMug API calls during deployment

### 2. Conditional Regeneration
- Only regenerates when explicitly requested
- Triggered via environment variable or specific command
- Used when albums have been added/updated

## Build Commands

### Standard Build (Uses Committed Context)
```bash
pnpm build
```
- Uses existing `gallery-context.json`
- Fast deployment (~2-3 minutes)
- **Use this for code changes**

### Force Context Regeneration
```bash
# Option 1: Environment variable
REBUILD_CONTEXT=true pnpm build

# Option 2: Explicit command
pnpm build:force-context
```
- Regenerates `gallery-context.json` from SmugMug API
- Fetches all 294+ albums with pagination
- Slow (~15-30 minutes depending on album count)
- **Use this after adding/updating albums**

### Generate Context Only
```bash
pnpm run build:context
```
- Regenerates context without building Next.js
- Useful for local development
- Commit the updated `gallery-context.json` after running

## Workflow

### Daily Development (Code Changes)
1. Make code changes
2. `git commit -m "feat: your changes"`
3. `git push`
4. **Result**: Fast build using committed context

### After Adding/Updating Albums
1. Add/update albums in SmugMug
2. Enrich new photos: `pnpm run enrich:smugmug --since 7d`
3. Regenerate context: `pnpm run build:context`
4. Review changes: `git diff gallery-context.json`
5. Commit context: `git add gallery-context.json && git commit -m "chore: Update gallery context"`
6. Push: `git push`
7. **Result**: Production will use new context on next deployment

### Vercel Configuration
For Vercel deployments, the build command is simply:
```
pnpm build
```

To force context regeneration on Vercel (rare):
- Go to Project Settings → Environment Variables
- Add: `REBUILD_CONTEXT=true`
- Redeploy
- **Remember to remove the variable after**

## Build Wrapper Logic

The `scripts/build-wrapper.js` script handles the decision tree:

```
┌─────────────────────────────────────┐
│ gallery-context.json exists?        │
└──────────┬──────────────────────────┘
           │
    No ────┴──── Yes
     │            │
     │            ├─ REBUILD_CONTEXT=true?
     │            │
     │      No ───┴─── Yes
     │       │         │
Generate    Use      Regenerate
context   existing   context
     │       │         │
     └───────┴─────────┘
             │
     ┌───────▼────────┐
     │ next build      │
     └────────────────┘
```

## File Size

Current `gallery-context.json`:
- Size: ~4.7 MB (294 albums, ~6,000 photos)
- Git handles this fine (delta compression)
- Netlify/Vercel handle this fine

## Benefits

1. **Fast Deploys**: 10x faster (3 min vs 30 min)
2. **No API Costs**: No SmugMug API calls during build
3. **Predictable**: Same content every deploy (until you update it)
4. **Version Control**: Context changes tracked in git
5. **Rollback**: Can revert context changes with git

## When to Regenerate Context

**Always regenerate when:**
- New albums added to SmugMug
- Album metadata changed (titles, descriptions, keywords)
- Photos added/removed from albums
- After running enrichment script

**Don't regenerate for:**
- Code changes (UI, routes, styles)
- Configuration updates
- Bug fixes
- Feature additions

## Troubleshooting

### Context file is stale
```bash
pnpm run build:context
git add gallery-context.json
git commit -m "chore: Update gallery context"
git push
```

### Build fails with "context not found"
This shouldn't happen since the file is committed, but if it does:
```bash
pnpm run build:force-context
```

### Want to force regeneration in CI/CD
Set environment variable: `REBUILD_CONTEXT=true`

## Implementation Details

### Files
- `scripts/build-wrapper.js` - Build decision logic
- `scripts/build-context.ts` - Context generation script
- `package.json` - Build commands configuration
- `.gitignore` - Excludes embeddings but includes context

### Previous Behavior (Removed)
```json
"build": "pnpm run build:context && next build"
```
This **always** regenerated context (slow).

### New Behavior
```json
"build": "node scripts/build-wrapper.js && next build"
```
This **intelligently decides** when to regenerate (fast).
