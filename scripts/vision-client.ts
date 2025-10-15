/**
 * Unified Vision API Client
 *
 * Supports: Claude 3.5 Sonnet (primary), OpenAI GPT-4o (fallback), Gemini (optional)
 * Auto-detects provider based on available API keys
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VISION_PROVIDER = process.env.VISION_PROVIDER || 'auto';

interface VisionAnalysisResult {
  title: string;
  caption: string;
  keywords: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
  };
  emotion: string;
  composition: string;
  timeOfDay: string;
  // Phase 3: Quality scoring
  quality: {
    sharpness: number;           // 0-10: Focus accuracy
    exposureAccuracy: number;    // 0-10: Lighting correctness
    compositionScore: number;    // 0-10: Framing and rule-following
    emotionalImpact: number;     // 0-10: Action intensity, expression
  };
  // Phase 3: Portfolio flags
  portfolioWorthy: boolean;      // Top-tier shot
  printReady: boolean;           // High quality for print
  // Phase 3: Use case tags
  useCases: string[];            // ['social-media', 'website-hero', 'athlete-portfolio', 'print']
  socialMediaOptimized: boolean; // Strong impact, crop-friendly
  // Phase 3: Play classification (modern volleyball terminology)
  playType: 'attack' | 'block' | 'dig' | 'set' | 'serve' | 'pass' | 'celebration' | 'timeout' | null;
  actionIntensity: 'low' | 'medium' | 'high' | 'peak';  // Peak = game-winning moments
  provider: 'claude' | 'openai' | 'gemini';
  cost: number;
}

interface VisionContext {
  sport: string;
  eventName: string;
  albumName?: string;
  location?: string;
  date?: Date;
  existingTitle?: string;
  existingKeywords?: string[];
  cameraInfo?: string;
}

/**
 * Detect which provider to use
 */
function detectProvider(): 'claude' | 'openai' | 'gemini' {
  if (VISION_PROVIDER !== 'auto') {
    return VISION_PROVIDER as 'claude' | 'openai' | 'gemini';
  }

  // Auto-detect based on available keys
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_API_KEY) return 'gemini';

  throw new Error('No vision API key found. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY');
}

/**
 * Build prompt for vision analysis
 */
function buildPrompt(context: VisionContext, includePhase3 = true): string {
  // Detect venue type from event name for better sport identification
  const eventNameLower = (context.eventName || context.albumName || '').toLowerCase();
  const isIndoorTurf = eventNameLower.includes('turf');
  const isGrass = eventNameLower.includes('grass');
  const isBeach = eventNameLower.includes('beach') || eventNameLower.includes('sand');

  let venueHint = '';
  if (isIndoorTurf) {
    venueHint = '\n⚠️ IMPORTANT: This is INDOOR TURF. The yellow ball and artificial surface may look like soccer, but this is VOLLEYBALL played on indoor turf.';
  } else if (isGrass) {
    venueHint = '\n- Venue: Grass/outdoor';
  } else if (isBeach) {
    venueHint = '\n- Venue: Beach/sand';
  }

  const basePrompt = `Analyze this photo from "${context.eventName || context.albumName}".

Context:
- Expected Type: ${context.sport} (but analyze what you actually see)
- Event: ${context.eventName || context.albumName || 'Unknown'}${venueHint}
${context.location ? `- Location: ${context.location}` : ''}
${context.date ? `- Date: ${context.date.toLocaleDateString()}` : ''}
${context.cameraInfo ? `- Camera: ${context.cameraInfo}` : ''}
${context.existingTitle ? `- Current title: ${context.existingTitle}` : ''}
${context.existingKeywords?.length ? `- Existing keywords: ${context.existingKeywords.join(', ')}` : ''}

⚠️  IMPORTANT: If this is NOT a sports photo (e.g., memorial, ceremony, portrait, venue shot), still generate metadata but set playType=null and adjust fields appropriately.

Generate rich metadata in this exact JSON format:

{
  "title": "8-word max, action-focused title capturing the decisive moment",
  "caption": "20-word descriptive caption with context, emotion, and storytelling",
  "keywords": {
    "tier1": ["sport", "action", "subject"] (3-5 core keywords),
    "tier2": ["emotion", "composition", "lighting", "setting"] (5-7 descriptive),
    "tier3": ["sport:${context.sport}", "action:xxx", "emotion:xxx", "composition:xxx", "time:xxx", "setting:xxx"] (7-10 structured with colon format)
  },
  "emotion": "triumph|focus|intensity|playfulness|determination|excitement|serenity",
  "composition": "rule-of-thirds|leading-lines|symmetry|motion-blur|close-up|wide-angle|dramatic-angle",
  "timeOfDay": "morning|afternoon|golden-hour|evening|night|midday"${includePhase3 ? `,

  "quality": {
    "sharpness": 0-10 (subject focus accuracy),
    "exposureAccuracy": 0-10 (lighting correctness),
    "compositionScore": 0-10 (framing, rule-following),
    "emotionalImpact": 0-10 (action intensity, expression)
  },
  "portfolioWorthy": true|false (exceptional quality, top-tier shot),
  "printReady": true|false (high resolution + quality for print),
  "useCases": ["social-media", "website-hero", "athlete-portfolio", "print", "editorial"] (select all that apply),
  "socialMediaOptimized": true|false (strong impact, vertical-crop friendly),

  "playType": "attack|block|dig|set|serve|pass|celebration|timeout|null" (use modern volleyball terminology),
  "actionIntensity": "low|medium|high|peak" (peak = game-winning moments)` : ''}
}

Requirements:
- Title must be descriptive and capture the essence (action-focused if sports, descriptive if not)
- Caption must tell the story of this moment
- Keep best existing keywords, add new ones
- tier3 MUST use colon format (key:value)
- Be specific to what you actually see in the image - ALWAYS generate JSON even for non-sports photos
- Focus on photography composition and technical excellence${includePhase3 ? `
- Quality scores: Be objective about sharpness, exposure, composition
- For sports: Use modern volleyball terms ("attack" not "spike", "pass" for serve-receive)
- For non-sports: Set playType=null, adjust actionIntensity appropriately (low for static scenes)
- actionIntensity: "peak" for decisive moments, "low" for portraits/static scenes
- useCases: Consider image aspect ratio, subject positioning, visual impact
- portfolioWorthy: Reserve for exceptional shots regardless of subject type` : ''}`;

  return basePrompt;
}

/**
 * Analyze with Claude 3.5 Sonnet (RECOMMENDED)
 */
async function analyzeWithClaude(
  imageUrl: string,
  context: VisionContext
): Promise<VisionAnalysisResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = buildPrompt(context);

  // Fetch image and convert to base64 if local file
  let imageSource: Anthropic.ImageBlockParam['source'];

  if (imageUrl.startsWith('data:image')) {
    // Already base64
    const match = imageUrl.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 image format');

    const mediaType = match[1] === 'jpg' ? 'jpeg' : match[1];
    imageSource = {
      type: 'base64' as const,
      media_type: `image/${mediaType}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: match[2],
    };
  } else if (imageUrl.startsWith('http')) {
    // External URL - fetch and convert
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // Check size and compress if needed (Claude has 5MB limit)
    let finalBuffer = buffer;
    const sizeInMB = buffer.byteLength / 1024 / 1024;

    if (sizeInMB > 4.5) {
      // Image is too large - try appending SmugMug size parameter
      // SmugMug supports URL parameters like ?size=M for medium
      console.log(`    📏 Image is ${sizeInMB.toFixed(1)}MB, requesting smaller size...`);

      const smallerUrl = imageUrl.includes('?') ? `${imageUrl}&size=M` : `${imageUrl}?size=M`;
      try {
        const smallerResponse = await fetch(smallerUrl);
        finalBuffer = await smallerResponse.arrayBuffer();
        const newSize = finalBuffer.byteLength / 1024 / 1024;
        console.log(`    ✅ Reduced to ${newSize.toFixed(1)}MB`);
      } catch (err) {
        console.log(`    ⚠️  Could not fetch smaller size, will use original`);
        finalBuffer = buffer;
      }
    }

    const base64 = Buffer.from(finalBuffer).toString('base64');

    // Detect media type from URL or response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Parse and normalize to full format (image/jpeg, etc.)
    let fullMediaType = contentType.startsWith('image/') ? contentType : `image/${contentType}`;

    // Normalize variants
    if (fullMediaType === 'image/jpg') fullMediaType = 'image/jpeg';

    // Validate and fallback
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(fullMediaType)) {
      console.log(`    ⚠️  Unknown content-type: ${contentType}, defaulting to image/jpeg`);
      fullMediaType = 'image/jpeg';
    }

    imageSource = {
      type: 'base64' as const,
      media_type: fullMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      data: base64,
    };
  } else {
    throw new Error('Image must be URL or base64 data URI');
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514', // Latest Claude Sonnet 4 (best quality)
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: imageSource,
        },
        {
          type: 'text',
          text: prompt,
        },
      ],
    }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not extract JSON from Claude response: ${content.text}`);
  }

  const metadata = JSON.parse(jsonMatch[0]);

  // Calculate cost (Claude pricing)
  const inputTokens = message.usage.input_tokens;
  const outputTokens = message.usage.output_tokens;
  const inputCost = (inputTokens / 1_000_000) * 3; // $3 per 1M input tokens
  const outputCost = (outputTokens / 1_000_000) * 15; // $15 per 1M output tokens
  const cost = inputCost + outputCost;

  // Clear image buffer to prevent memory accumulation
  if (imageSource.type === 'base64') {
    imageSource.data = '';
  }

  return {
    ...metadata,
    provider: 'claude',
    cost,
  };
}

/**
 * Analyze with OpenAI GPT-4o (FALLBACK)
 */
async function analyzeWithOpenAI(
  imageUrl: string,
  context: VisionContext
): Promise<VisionAnalysisResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = buildPrompt(context);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
      ],
    }],
    max_tokens: 800,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from OpenAI');

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not extract JSON from OpenAI response: ${content}`);
  }

  const metadata = JSON.parse(jsonMatch[0]);

  // Calculate cost (OpenAI pricing)
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  const inputCost = (inputTokens / 1_000_000) * 2.5; // $2.50 per 1M input tokens
  const outputCost = (outputTokens / 1_000_000) * 10; // $10 per 1M output tokens
  const cost = inputCost + outputCost;

  return {
    ...metadata,
    provider: 'openai',
    cost,
  };
}

/**
 * Analyze with Gemini Flash (COST-OPTIMIZED)
 */
async function analyzeWithGemini(
  imageUrl: string,
  context: VisionContext
): Promise<VisionAnalysisResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not found in environment');
  }
  console.log(`    🔑 Using Gemini API key: ${apiKey.substring(0, 20)}...`);
  const genAI = new GoogleGenerativeAI(apiKey);
  // Use Flash for higher rate limits (1500 RPD vs 50 RPD for Pro)
  const model = genAI.getGenerativeModel({ model: 'models/gemini-flash-latest' });

  const prompt = buildPrompt(context, true); // Enable Phase 3 for Gemini Pro

  // Gemini expects base64 image data
  let imageData: {inlineData: {data: string; mimeType: string}};

  if (imageUrl.startsWith('data:image')) {
    // Already base64
    const match = imageUrl.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 image format');

    const mimeType = match[1] === 'jpg' ? 'jpeg' : match[1];
    imageData = {
      inlineData: {
        data: match[2],
        mimeType: `image/${mimeType}`
      }
    };
  } else if (imageUrl.startsWith('http')) {
    // External URL - fetch and convert
    const response = await fetch(imageUrl);

    // Validate content type BEFORE processing
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Invalid image URL: received ${contentType} instead of image. URL may be broken or require authentication.`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const mimeType = contentType.startsWith('image/') ? contentType : `image/${contentType}`;

    imageData = {
      inlineData: {
        data: base64,
        mimeType: mimeType as any
      }
    };
  } else {
    throw new Error('Image must be URL or base64 data URI');
  }

  const result = await model.generateContent([prompt, imageData]);
  const responseText = result.response.text();

  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not extract JSON from Gemini response: ${responseText}`);
  }

  const metadata = JSON.parse(jsonMatch[0]);

  // Calculate cost (Gemini Pro pricing)
  const inputTokens = result.response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = result.response.usageMetadata?.candidatesTokenCount || 0;
  const inputCost = (inputTokens / 1_000_000) * 0.075; // $0.075 per 1M input tokens
  const outputCost = (outputTokens / 1_000_000) * 0.30; // $0.30 per 1M output tokens
  const cost = inputCost + outputCost;

  // Clear image buffer to prevent memory accumulation
  imageData.inlineData.data = '';

  // Return metadata as-is (includes Phase 3 if prompt requested it)
  return {
    ...metadata,
    provider: 'gemini',
    cost,
  };
}

/**
 * Main analysis function - auto-selects provider or uses override
 */
export async function analyzePhoto(
  imageUrl: string,
  context: VisionContext,
  providerOverride?: 'claude' | 'openai' | 'gemini'
): Promise<VisionAnalysisResult> {
  const provider = providerOverride || detectProvider();

  console.log(`    🤖 Using provider: ${provider}`);

  try {
    switch (provider) {
      case 'claude':
        return await analyzeWithClaude(imageUrl, context);
      case 'openai':
        return await analyzeWithOpenAI(imageUrl, context);
      case 'gemini':
        return await analyzeWithGemini(imageUrl, context);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`    ❌ Error with ${provider}:`, error);

    // Auto-fallback to OpenAI if Claude fails
    if (provider === 'claude' && process.env.OPENAI_API_KEY) {
      console.log(`    🔄 Falling back to OpenAI...`);
      return await analyzeWithOpenAI(imageUrl, context);
    }

    throw error;
  }
}

/**
 * Get cost estimate for batch
 */
export function estimateCost(photoCount: number, provider?: 'claude' | 'openai' | 'gemini'): number {
  const activeProvider = provider || detectProvider();

  const costs = {
    claude: 0.0036,  // ~$3.60 per 1,000 photos (Sonnet 4)
    openai: 0.01,    // ~$10 per 1,000 photos (GPT-4o)
    gemini: 0.001,   // ~$1 per 1,000 photos (Gemini Flash)
  };

  return photoCount * costs[activeProvider];
}

/**
 * Get provider name for display
 */
export function getProviderName(): string {
  const provider = detectProvider();

  const names = {
    claude: 'Claude Sonnet 4 (Anthropic)',
    openai: 'GPT-4o (OpenAI)',
    gemini: 'Gemini 1.5 Flash (Google)',
  };

  return names[provider];
}
