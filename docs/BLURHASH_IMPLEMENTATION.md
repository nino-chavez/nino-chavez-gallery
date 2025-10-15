# BlurHash Implementation Guide

**Purpose**: Add instant image placeholders that eliminate layout shifts and improve perceived performance.

## 🎯 What is BlurHash?

BlurHash is a compact (~100 bytes) representation of an image's colors that can be instantly decoded into a blurred placeholder. This provides:
- Instant visual feedback while images load
- No layout shifts (CLS improvement)
- Professional loading experience
- Better perceived performance

## 📦 Installation

```bash
# Install blurhash and sharp (for generation)
pnpm add blurhash
pnpm add -D sharp @types/sharp
```

## 🗄️ Database Setup

Add `blur_hash` column to `photo_metadata` table:

```sql
-- Already included in supabase/migrations/003_add_performance_indexes.sql
ALTER TABLE photo_metadata ADD COLUMN IF NOT EXISTS blur_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_photo_metadata_blur_hash
ON photo_metadata(blur_hash)
WHERE blur_hash IS NOT NULL;
```

## 🔧 Component Usage

### Basic BlurHashImage Component

Use the provided [`src/components/photo/BlurHashImage.tsx`](../src/components/photo/BlurHashImage.tsx) component:

```typescript
import { BlurHashImage } from '@/components/photo/BlurHashImage';

<BlurHashImage
  src={photo.image_url}
  alt={photo.title}
  blurHash={photo.metadata?.blur_hash}
  width={800}
  height={600}
  className="rounded-lg"
/>
```

### In Existing Components

Replace Next.js `<Image>` with `<BlurHashImage>`:

```typescript
// Before:
<Image
  src={photo.image_url}
  alt={photo.title}
  fill
  sizes="..."
  className="..."
/>

// After:
<BlurHashImage
  src={photo.image_url}
  alt={photo.title}
  blurHash={photo.metadata?.blur_hash}
  fill
  sizes="..."
  className="..."
/>
```

## 🎨 Generating BlurHashes

### Option 1: During Enrichment (Recommended)

Add to enrichment scripts ([`scripts/enrich-smugmug.ts`](../scripts/enrich-smugmug.ts)):

```typescript
import { encode } from 'blurhash';
import sharp from 'sharp';

async function generateBlurHash(imageUrl: string): Promise<string> {
  try {
    // Fetch image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');

    const buffer = await response.arrayBuffer();

    // Resize to tiny thumbnail (32x32) for fast encoding
    const { data, info } = await sharp(Buffer.from(buffer))
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Generate blur hash (6x4 components for good quality/size balance)
    const blurHash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      6, // X components
      4  // Y components
    );

    return blurHash;
  } catch (error) {
    console.error('Failed to generate blur hash:', error);
    return ''; // Return empty on error
  }
}

// In enrichment loop:
const blurHash = await generateBlurHash(photo.image_url);

// Save to Supabase:
await supabase
  .from('photo_metadata')
  .upsert({
    smugmug_image_key: photo.ImageKey,
    blur_hash: blurHash,
    // ... other metadata
  });
```

### Option 2: On-Demand API Route

Create API route for generating BlurHashes:

```typescript
// src/app/api/blurhash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'blurhash';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    // Fetch and process image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    const { data, info } = await sharp(Buffer.from(buffer))
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const blurHash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      6,
      4
    );

    return NextResponse.json({ blurHash });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate BlurHash' },
      { status: 500 }
    );
  }
}
```

### Option 3: Batch Generation Script

Create a dedicated script for batch generation:

```typescript
// scripts/generate-blurhashes.ts
import { createClient } from '@/lib/supabase/server';
import { encode } from 'blurhash';
import sharp from 'sharp';

async function batchGenerateBlurHashes() {
  const supabase = createClient();
  
  // Get photos without blur hashes
  const { data: photos } = await supabase
    .from('photo_metadata')
    .select('id, smugmug_image_key, image_url')
    .is('blur_hash', null)
    .limit(100);

  for (const photo of photos) {
    try {
      const blurHash = await generateBlurHash(photo.image_url);
      
      await supabase
        .from('photo_metadata')
        .update({ blur_hash: blurHash })
        .eq('id', photo.id);
      
      console.log(`✓ Generated BlurHash for ${photo.smugmug_image_key}`);
    } catch (error) {
      console.error(`✗ Failed for ${photo.smugmug_image_key}:`, error);
    }
    
    // Rate limit: 1 per second
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

batchGenerateBlurHashes();
```

## 📊 Expected Impact

- **Instant placeholders**: <10ms to decode and render
- **No layout shifts**: CLS improvement of 0.1+
- **Better UX**: Professional loading experience
- **Tiny footprint**: ~100 bytes per image

## 🧪 Testing

1. Generate BlurHashes for a few test photos
2. Verify they appear in database
3. Load photo grid and confirm blur placeholders appear
4. Check that images fade in smoothly

## 📝 Migration Path

1. ✅ Install dependencies
2. ✅ Apply database migration
3. ✅ Use BlurHashImage component in one location
4. Generate BlurHashes for existing photos (batch script)
5. Update enrichment script for new photos
6. Roll out to all photo displays

## 🔗 References

- [BlurHash Official](https://blurha.sh/)
- [BlurHash GitHub](https://github.com/woltapp/blurhash)
- [Next.js Image Placeholders](https://nextjs.org/docs/app/api-reference/components/image#placeholder)