# Replicate API Setup for Avatar Try-On

## Overview
Replicate API provides image-to-image generation using Stable Diffusion, which is perfect for maintaining avatar consistency while changing clothing.

## Step 1: Get Replicate API Key

1. Go to [replicate.com](https://replicate.com)
2. Sign up for a free account
3. Go to your [API tokens page](https://replicate.com/account/api-tokens)
4. Create a new API token
5. Copy the token (starts with `r8_`)

## Step 2: Add to Environment Variables

### Local Development (.env)
```
REPLICATE_API_KEY=r8_your_token_here
```

### Production (Render)
Add to your Render environment variables:
```
REPLICATE_API_KEY=r8_your_token_here
```

## Step 3: How It Works

### Image-to-Image Generation
- **Input**: Your avatar image + clothing descriptions
- **Output**: Same avatar wearing the new clothing
- **Consistency**: Maintains facial features, pose, and body type

### Parameters Used
- **strength**: 0.7 (moderate change - keeps avatar features)
- **guidance_scale**: 7.5 (follows prompt well)
- **num_inference_steps**: 20 (good quality)

### Model
- **Stable Diffusion img2img**
- **Version**: `c221b2b8ef527988fb59bf24a8b97c4565f1c671f73bd188f288dac3a1806d4a`

## Step 4: Cost
- **Free tier**: 500 predictions per month
- **Paid**: ~$0.02 per image
- **Perfect for**: Avatar try-on with consistency

## Step 5: Testing

1. Set your `REPLICATE_API_KEY` in `.env`
2. Restart your server
3. Test the try-on feature in your frontend
4. Check server logs for API responses

## Benefits Over Other APIs

✅ **Image-to-image**: Uses your avatar as base
✅ **Consistency**: Same face, pose, body type
✅ **Affordable**: Much cheaper than alternatives
✅ **Reliable**: Stable Diffusion is proven technology
✅ **Fast**: Usually completes in 10-30 seconds

## Troubleshooting

### Common Issues
1. **API Key Error**: Make sure `REPLICATE_API_KEY` is set correctly
2. **Timeout**: Generation can take up to 60 seconds
3. **Quality Issues**: Adjust `strength` parameter (0.5-0.8 range)

### Debugging
- Check server logs for API responses
- Verify image URLs are accessible
- Test with simple prompts first 