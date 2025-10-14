/**
 * Unified Vision API Client
 *
 * Supports: Claude 3.5 Sonnet (primary), OpenAI GPT-4o (fallback), Gemini (optional)
 * Auto-detects provider based on available API keys
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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
function buildPrompt(context: VisionContext): string {
  return `Analyze this ${context.sport} photo from "${context.eventName || context.albumName}".

Context:
- Sport: ${context.sport}
- Event: ${context.eventName || context.albumName || 'Unknown'}
${context.location ? `- Location: ${context.location}` : ''}
${context.date ? `- Date: ${context.date.toLocaleDateString()}` : ''}
${context.cameraInfo ? `- Camera: ${context.cameraInfo}` : ''}
${context.existingTitle ? `- Current title: ${context.existingTitle}` : ''}
${context.existingKeywords?.length ? `- Existing keywords: ${context.existingKeywords.join(', ')}` : ''}

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
  "timeOfDay": "morning|afternoon|golden-hour|evening|night|midday"
}

Requirements:
- Title must be action-focused and exciting
- Caption must tell the story of this moment
- Keep best existing keywords, add new ones
- tier3 MUST use colon format (key:value)
- Be specific to what you actually see in the image
- Focus on photography composition and technical excellence`;
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

    imageSource = {
      type: 'base64',
      media_type: `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` as Anthropic.ImageBlockParam['source']['media_type'],
      data: match[2],
    };
  } else if (imageUrl.startsWith('http')) {
    // External URL - fetch and convert
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Detect media type from URL or response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mediaType = contentType.split('/')[1] as Anthropic.ImageBlockParam['source']['media_type'];

    imageSource = {
      type: 'base64',
      media_type: mediaType || 'jpeg',
      data: base64,
    };
  } else {
    throw new Error('Image must be URL or base64 data URI');
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
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
 * Analyze with Gemini (OPTIONAL)
 */
async function analyzeWithGemini(
  imageUrl: string,
  context: VisionContext
): Promise<VisionAnalysisResult> {
  // Gemini implementation (if needed)
  throw new Error('Gemini provider not yet implemented. Use Claude or OpenAI.');
}

/**
 * Main analysis function - auto-selects provider
 */
export async function analyzePhoto(
  imageUrl: string,
  context: VisionContext
): Promise<VisionAnalysisResult> {
  const provider = detectProvider();

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
    claude: 0.0036,  // ~$3.60 per 1,000 photos
    openai: 0.01,    // ~$10 per 1,000 photos
    gemini: 0.001,   // ~$1 per 1,000 photos
  };

  return photoCount * costs[activeProvider];
}

/**
 * Get provider name for display
 */
export function getProviderName(): string {
  const provider = detectProvider();

  const names = {
    claude: 'Claude 3.5 Sonnet (Anthropic)',
    openai: 'GPT-4o (OpenAI)',
    gemini: 'Gemini 1.5 Pro (Google)',
  };

  return names[provider];
}
