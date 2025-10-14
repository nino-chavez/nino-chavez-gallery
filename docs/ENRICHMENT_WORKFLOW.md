# Metadata Enrichment Workflow

**Two-Phase Strategy for SmugMug-First Workflow**

---

## Overview

Since your photos are already in SmugMug, metadata enrichment happens in two phases:

### Phase 1: Enrich Existing SmugMug Photos (One-Time)
Fetch photos from SmugMug, analyze with GPT-4 Vision, update metadata via API.

### Phase 2: Enrich Before Upload (Ongoing)
Run between Lightroom export and SmugMug upload in your workflow.

---

## Phase 1: Enrich Existing Photos in SmugMug

### Setup

```bash
# Ensure environment variables are set
cp .env.example .env.local
# Edit .env.local with your SmugMug and OpenAI credentials

# Install ExifTool (not needed for Phase 1, but useful for Phase 2)
brew install exiftool
```

### Usage

**Enrich all photos** (one-time, expensive but comprehensive):

```bash
pnpm run enrich:smugmug --all
```

**Enrich recent photos only**:

```bash
# Last 7 days
pnpm run enrich:smugmug --since 7d

# Last 30 days
pnpm run enrich:smugmug --since 30d

# Last week
pnpm run enrich:smugmug --since 1w

# Last month
pnpm run enrich:smugmug --since 1m
```

**Enrich specific album**:

```bash
pnpm run enrich:smugmug --album ALBUM_KEY
```

**Dry run (preview without changes)**:

```bash
pnpm run enrich:smugmug --all --dry-run
```

### What It Does

1. ✅ **Fetches** albums and images from SmugMug API
2. ✅ **Analyzes** photos using GPT-4 Vision (no download needed - uses SmugMug CDN URLs)
3. ✅ **Generates** rich metadata:
   - Action-focused titles (8 words max)
   - Contextual captions (20 words)
   - Three-tier keywords (core, descriptive, semantic)
4. ✅ **Updates** SmugMug metadata via API (PATCH request)
5. ✅ **Skips** already enriched photos (looks for colon-formatted keywords like `sport:bmx`)

### Cost Estimate

- **Per photo**: ~$0.01 (GPT-4o with vision)
- **100 photos**: $1.00
- **1,000 photos**: $10.00
- **Your entire gallery** (~1,247 photos): ~$12.47

**Recommended**: Start with `--since 30d` to enrich recent photos first, then decide if you want to enrich the entire archive.

### Example Output

```
🚀 SmugMug Metadata Enrichment

📂 Fetching albums...
📚 Found 87 albums

📊 Processing 87 albums...

📂 Album: BMX Championship Finals 2025
   Key: ALBUM_KEY_123
   Images: 42

  🔍 Processing: IMG_4567.jpg
    ✅ Title: BMX rider executes perfect backflip over championship spine
    📝 Keywords: 24 tags
    ✅ Metadata updated in SmugMug

  🔍 Processing: IMG_4568.jpg
    ⏭️  Already enriched, skipping

  ...

   Progress: 42/42

============================================================
✅ Processing complete!

   Albums processed: 87
   Total images: 1247
   Enriched: 856
   Skipped: 391 (already enriched)
   Errors: 0

💰 Estimated cost: $8.56
```

---

## Phase 2: Enrich Before Upload (Ongoing Workflow)

### Your Workflow

```
Lightroom → Export → Enrichment Script → SmugMug Upload
```

### Step-by-Step

1. **Export from Lightroom**

   ```
   File → Export
   Export Location: ~/Photos/exports/YYYY-MM-DD-EventName/

   Naming convention: YYYY-MM-DD-EventName
   Examples:
   - ~/Photos/exports/2025-01-20-BMX-Championship/
   - ~/Photos/exports/2025-02-05-Volleyball-Tournament/
   ```

2. **Run Enrichment Script**

   ```bash
   # Navigate to gallery repo
   cd ~/Workspace/02-local-dev/nino-chavez-gallery

   # Enrich exported photos
   pnpm run enrich ~/Photos/exports/2025-01-20-BMX-Championship/
   ```

   **Dry run first** (recommended):
   ```bash
   pnpm run enrich ~/Photos/exports/2025-01-20-BMX-Championship/ --dry-run
   ```

3. **Upload to SmugMug**

   Use SmugMug Uploader (desktop app):
   - Drag and drop enriched folder
   - Metadata is automatically extracted from EXIF
   - Title, caption, keywords → SmugMug fields

### What Phase 2 Does

1. ✅ **Scans** export folder for images
2. ✅ **Extracts** context from folder/file names
3. ✅ **Reads** existing EXIF from Lightroom export
4. ✅ **Analyzes** with GPT-4 Vision
5. ✅ **Merges** AI-generated metadata with existing EXIF
6. ✅ **Writes** enriched metadata back to EXIF fields
7. ✅ **Skips** already enriched photos

### Example Output

```
📂 Processing: ~/Photos/exports/2025-01-20-BMX-Championship/

📸 Found 42 photos
🔄 Processing 42 photos...

  🔍 Analyzing: IMG_4567.jpg
    ✅ Title: BMX rider launches explosive start from championship gate
    📝 Keywords: 26 tags
    ✅ Metadata written to EXIF

  🔍 Analyzing: IMG_4568.jpg
    ✅ Title: Athlete soars mid-air executing flawless backflip rotation
    📝 Keywords: 28 tags
    ✅ Metadata written to EXIF

  ...

📊 Progress: 42/42 (0 errors)

============================================================
✅ Processing complete!
   Total: 42
   Skipped: 0
   Processed: 42
   Errors: 0

💰 Estimated cost: $0.42

✨ Next steps:
   1. Review enriched metadata: exiftool -Title -Keywords "IMG_4567.jpg"
   2. Upload to SmugMug via SmugMug Uploader
   3. Metadata will be automatically indexed by SmugMug
```

### Verify Enrichment

```bash
# View enriched metadata
exiftool -Title -Caption-Abstract -Keywords ~/Photos/exports/2025-01-20-BMX-Championship/IMG_4567.jpg

# Output:
Title                           : BMX rider launches explosive start from championship gate
Caption-Abstract                : Athlete explodes from starting gate as championship race begins, capturing raw power and intense focus
Keywords                        : bmx, rider, athlete, championship, start, gate, explosive-energy, intensity, focus, motion-blur, sport:bmx, action:launch, emotion:intensity, composition:close-up, time:afternoon, phase:competition
```

---

## Optional: Lightroom Export Preset

For convenience, create a Lightroom export preset:

**Lightroom → File → Export → Add Preset**

```
Preset Name: SmugMug with Enrichment
Export Location: ~/Photos/exports/
Subfolder: YYYY-MM-DD-{Album Name}
File Naming: {Filename}
File Settings: JPEG, Quality 100%, sRGB
Image Sizing: Resize to 4000px longest edge
Metadata: Include all metadata
```

**Then in your workflow**:
1. Select photos in Lightroom
2. Export using "SmugMug with Enrichment" preset
3. Run: `pnpm run enrich ~/Photos/exports/LATEST_FOLDER/`
4. Upload enriched photos to SmugMug

---

## Optional: Automated Watch Mode

For fully automated enrichment:

```bash
# Watch exports folder for new photos
pnpm run enrich:watch ~/Photos/exports/

# Script will:
# - Monitor folder for new files
# - Auto-enrich when new photos appear
# - Notify when ready to upload
```

**Implementation** (create `scripts/enrich-watch.ts`):

```typescript
import { watch } from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const watchDir = process.argv[2];

if (!watchDir) {
  console.error('Usage: pnpm run enrich:watch <directory>');
  process.exit(1);
}

console.log(`👀 Watching: ${watchDir}`);

const watcher = watch(watchDir, {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100,
  },
});

watcher.on('add', async (path) => {
  if (!/\.(jpg|jpeg)$/i.test(path)) return;

  console.log(`\n📸 New photo detected: ${path}`);
  console.log(`🔄 Enriching...`);

  try {
    await execAsync(`pnpm run enrich "${watchDir}"`);
    console.log(`✅ Enrichment complete! Ready to upload.`);
  } catch (error) {
    console.error(`❌ Error enriching: ${error}`);
  }
});
```

---

## Cost Management

### Set OpenAI Usage Limits

1. Go to: https://platform.openai.com/account/billing/limits
2. Set monthly budget: $20 (more than enough for 2,000 photos)
3. Set alert at $10

### Batch Processing

Instead of enriching entire archive at once:

```bash
# Week 1: Last 30 days
pnpm run enrich:smugmug --since 30d

# Week 2: 30-60 days ago
# (Requires custom date range - can add if needed)

# Week 3: 60-90 days ago
# ...
```

---

## Troubleshooting

### Error: OPENAI_API_KEY not set

```bash
# Set in .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
```

### Error: SmugMug API rate limit

Script includes automatic rate limiting (3 concurrent requests, 2 second pauses). If you still hit limits:

```typescript
// In enrich-smugmug.ts, reduce concurrency:
const CONFIG = {
  maxConcurrency: 2, // Lower from 3
};
```

### Photos already enriched but want to re-enrich

```bash
# Force overwrite
pnpm run enrich ~/Photos/exports/... --overwrite
```

### SmugMug update fails

Check:
1. API credentials are correct
2. You have permission to edit the album
3. Image URI is valid

---

## Next Steps

1. ✅ Run Phase 1 on recent photos (last 30 days)
2. ✅ Test Phase 2 with one small export from Lightroom
3. ✅ Verify metadata in SmugMug web interface
4. ✅ Integrate into regular workflow
5. ✅ Optionally enrich entire archive over time

---

**Questions?**
- Phase 1 script: `scripts/enrich-smugmug.ts`
- Phase 2 script: `scripts/enrich-local.ts`
- Issues: Open issue on GitHub
