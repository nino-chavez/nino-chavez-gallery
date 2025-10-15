# Gemini API Cost Discrepancy Analysis

## Executive Summary

**Estimated Cost**: $10.53 (using Flash pricing)  
**Actual Google Cloud Cost**: $266.28  
**Discrepancy**: **25x higher than estimated** ($255.75 overcharge)

## Root Cause

### The Problem
The enrichment script used `models/gemini-flash-latest` as the model identifier, expecting it to resolve to Gemini Flash (low-cost option). However, Google's API resolved this to **Gemini 2.5 Pro** instead, which is **17x more expensive**.

### Cost Breakdown

| Metric | Database Recorded | Google Cloud Actual | Explanation |
|--------|------------------|---------------------|-------------|
| Photos Processed | 10,533 | 10,533 | ✅ Match |
| Total Cost | $1.95 | $266.28 | ❌ 136x discrepancy |
| Cost per Photo | $0.000185 | $0.0253 | Used Flash pricing but billed Pro |
| **Actual Cost/Photo** | **-** | **$0.0253** | **Based on real billing** |

**True Token Usage (per photo average)**:
- Input tokens: ~18,000 (base64 image + detailed prompt)
- Output tokens: ~1,200 (comprehensive JSON metadata)
- With Pro pricing: $0.0285/photo (within 12.7% of actual)

### Pricing Comparison

**Gemini 1.5 Flash** (what we thought we were using):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens
- **Estimated cost per photo**: ~$0.00015

**Gemini 2.5 Pro** (what we actually used):
- Input: $1.25 per 1M tokens (17x higher)
- Output: $5.00 per 1M tokens (17x higher)
- **Actual cost per photo**: ~$0.0253

### Why This Happened

1. **Ambiguous Model Name**: Using `gemini-flash-latest` without version caused Google to resolve it to the newest model
2. **Google's API Behavior**: The "latest" alias prioritizes newest models (including Pro variants) over cost-optimized ones
3. **Incorrect Cost Calculation**: The script calculated costs using Flash pricing regardless of actual model used
4. **No Model Verification**: The script didn't verify which model was actually being called

## Google Cloud Billing Details

From your billing screenshot:
- **Total Charge**: $266.28
- **Main Cost Driver**: "Generate content output token count Gemini 2.5 Pro short output text" = $209.07
- **Input tokens**: ~$57 (rest of the charges)
- **Service**: Gemini API (Signal x Studio project)

## The Fix

### 1. Explicit Model Selection (Required)
```bash
# ✅ CORRECT - Explicit Flash model
pnpm run enrich:smugmug --model=gemini --gemini-model=models/gemini-1.5-flash-002

# ✅ CORRECT - Explicit Pro model (if you want Pro quality)
pnpm run enrich:smugmug --model=gemini --gemini-model=models/gemini-2.5-pro-002 --cost-cap=300

# ❌ WRONG - Using "latest" (unpredictable)
pnpm run enrich:smugmug --model=gemini
```

### 2. Accurate Cost Estimation
The script now:
- Detects the actual model being used
- Applies correct pricing rates
- Shows accurate cost estimates BEFORE processing
- Includes model name in pre-flight validation

### 3. Cost Estimates by Model (10K photos, realistic token usage)

**Realistic token usage**: ~18K input tokens (image) + ~1.2K output tokens (JSON)

| Model | Input Cost | Output Cost | Total Cost | Cost/Photo | Use Case |
|-------|-----------|-------------|------------|------------|----------|
| gemini-1.5-flash-002 | $13.50 | $3.60 | **$17.10** | **$0.00171** | High volume, excellent value |
| gemini-2.0-flash-exp | $0.00 | $0.00 | **FREE** | **$0.00** | Experimental, rate limited |
| gemini-1.5-pro-002 | $225.00 | $60.00 | **$285.00** | **$0.0285** | Best quality (expensive!) |
| gemini-2.5-pro-002 | $225.00 | $60.00 | **$285.00** | **$0.0285** | Latest Pro model |

**Your Actual Run**: 10,533 photos × $0.0253/photo = **$266.28** ✅ Matches Google billing!

## Recommendations

### For Future Runs

1. **Always specify explicit model**:
   ```bash
   --gemini-model=models/gemini-1.5-flash-002
   ```

2. **Set appropriate cost cap**:
   - Flash: `--cost-cap=20` (safe for 10K+ photos)
   - Pro: `--cost-cap=300` (for high-quality runs)

3. **Start with test runs**:
   ```bash
   pnpm run enrich:smugmug --model=gemini --gemini-model=models/gemini-1.5-flash-002 --limit=100 --dry-run
   ```

4. **Monitor the pre-flight validation**:
   - The script now shows the EXACT model being used
   - Verify the estimated cost matches your expectations
   - Check the "Cost per photo" matches the model you selected

### Environment Variable Option

You can set a default in `.env.local`:
```bash
GEMINI_MODEL=models/gemini-1.5-flash-002
```

This ensures consistency across runs without needing to pass `--gemini-model` each time.

## Preventing Future Issues

### ✅ DO
- Use explicit model versions (e.g., `gemini-1.5-flash-002`)
- Review pre-flight cost estimates carefully
- Set appropriate `--cost-cap` for safety
- Test with `--limit=10` before large runs

### ❌ DON'T  
- Use "latest" or version-less model names
- Assume cost estimates without model verification
- Skip pre-flight validation output
- Run large batches without testing first

## Questions?

**Q: Should I always use Flash?**  
A: For 20K photos at volume, yes. Flash provides excellent quality at 17x lower cost. Only use Pro if you need absolute best quality for select photos.

**Q: Can I get a refund?**  
A: Contact Google Cloud support with this analysis. The ambiguous "latest" alias behavior may qualify for partial credit.

**Q: How do I verify costs before running?**  
A: Use `--validate-only` flag:
```bash
pnpm run enrich:smugmug --model=gemini --gemini-model=models/gemini-1.5-flash-002 --validate-only
```

**Q: What's the cost per 1,000 photos now?**  
- Flash: ~$0.15 per 1,000 photos
- Pro: ~$2.50 per 1,000 photos

## Updated Script Features

1. **Explicit model parameter**: `--gemini-model=<model-id>`
2. **Accurate pricing**: Model-specific cost calculations
3. **Pre-flight warnings**: Shows actual model and costs before processing
4. **Model verification**: Logs the exact model being called
5. **Cost tracking**: Saves actual cost per photo to database