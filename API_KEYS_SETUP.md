# API Keys Setup Guide

This document explains how to configure external API keys for multi-LLM routing in the Sovereign AI Assistant.

## Overview

The system supports multiple LLM providers:

| Provider | Models | API Key Required |
|----------|--------|------------------|
| **OpenAI** | GPT-4, GPT-3.5 Turbo | `OPENAI_API_KEY` |
| **Anthropic** | Claude 3 Opus, Claude 3 Sonnet | `ANTHROPIC_API_KEY` |
| **Google AI** | Gemini Pro | `GOOGLE_AI_API_KEY` |
| **xAI** | Grok-1 | `XAI_API_KEY` |
| **Manus** | GPT-4 (built-in) | Pre-configured ✅ |

## Current Status

**✅ Manus Built-in LLM** - Active (no setup required)  
**⏳ External APIs** - Awaiting API keys

## How to Add API Keys

### Step 1: Obtain API Keys

#### OpenAI
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

#### Anthropic
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)

#### Google AI
1. Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Create API Key**
4. Copy the key

#### xAI
1. Visit [x.ai/api](https://x.ai/api)
2. Sign up for API access
3. Generate API key
4. Copy the key

### Step 2: Add Keys via Management UI

**Option A: Using the Manus Interface (Recommended)**

1. Open the **Management UI** (right panel)
2. Navigate to **Settings** → **Secrets**
3. Add each API key:
   - Key: `OPENAI_API_KEY` → Value: `sk-...`
   - Key: `ANTHROPIC_API_KEY` → Value: `sk-ant-...`
   - Key: `GOOGLE_AI_API_KEY` → Value: `...`
   - Key: `XAI_API_KEY` → Value: `...`
4. Save changes
5. Restart the server (automatic)

**Option B: Using the webdev_request_secrets Tool**

If you're working with me (the AI assistant), I can trigger a secrets input card:

```typescript
// I'll call this for you when you provide the keys
webdev_request_secrets({
  secrets: [
    { key: "OPENAI_API_KEY", description: "OpenAI API key for GPT-4 and GPT-3.5" },
    { key: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude models" },
    { key: "GOOGLE_AI_API_KEY", description: "Google AI API key for Gemini Pro" },
    { key: "XAI_API_KEY", description: "xAI API key for Grok-1" },
  ]
});
```

### Step 3: Verify Configuration

After adding keys, the system will automatically:
- ✅ Detect which providers are configured
- ✅ Enable corresponding models in the UI
- ✅ Route requests to the correct provider
- ✅ Fall back to Manus built-in if a provider fails

## Model Routing Logic

The system uses the `llm-router.ts` service to route requests:

```typescript
// User selects "claude-3-opus" in the UI
// ↓
// Router checks MODEL_CONFIG
// ↓
// Finds: { provider: "anthropic", apiModel: "claude-3-opus-20240229" }
// ↓
// Checks if ANTHROPIC_API_KEY exists
// ↓
// Calls Anthropic API with the key
// ↓
// Returns response to user
```

## Fallback Behavior

If an external API call fails (missing key, network error, rate limit), the system automatically falls back to **Manus built-in LLM** (GPT-4) to ensure uninterrupted service.

## Cost Considerations

| Provider | Model | Approximate Cost (per 1M tokens) |
|----------|-------|----------------------------------|
| OpenAI | GPT-4 | $30 input / $60 output |
| OpenAI | GPT-3.5 Turbo | $0.50 input / $1.50 output |
| Anthropic | Claude 3 Opus | $15 input / $75 output |
| Anthropic | Claude 3 Sonnet | $3 input / $15 output |
| Google | Gemini Pro | $0.50 input / $1.50 output |
| xAI | Grok-1 | TBD (contact xAI) |
| Manus | GPT-4 (built-in) | Included with platform |

**Recommendation:** Start with Manus built-in for testing, then add external APIs as needed.

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use the Manus secrets management system** (encrypted at rest)
3. **Rotate keys regularly** (every 90 days recommended)
4. **Monitor usage** via provider dashboards to detect anomalies
5. **Set spending limits** on provider accounts to prevent overages

## Testing Without Real Keys

The system is designed to work without external API keys:
- All models are selectable in the UI
- Requests automatically fall back to Manus built-in LLM
- No errors or crashes if keys are missing

This allows you to:
- ✅ Test the UI and UX
- ✅ Verify routing logic
- ✅ Develop features without API costs
- ✅ Add real keys when ready for production

## Troubleshooting

### "API key not configured" Error
**Solution:** Add the required API key via Management UI → Settings → Secrets

### Model Not Appearing in Dropdown
**Solution:** Ensure the corresponding API key is added and server is restarted

### Requests Always Use Manus LLM
**Solution:** Check that API keys are correctly named (case-sensitive) and valid

### Rate Limit Errors
**Solution:** 
1. Check provider dashboard for rate limits
2. Implement request throttling (contact me to add this feature)
3. Upgrade provider plan if needed

## Next Steps

Once API keys are configured:
1. Test each model with a simple message
2. Compare response quality across models
3. Set default model preferences per user
4. Monitor usage and costs
5. Implement advanced features (streaming, function calling, etc.)

## Need Help?

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify API keys are valid by testing them directly with provider APIs
3. Contact me (the AI assistant) to debug routing logic
4. Submit feedback at https://help.manus.im

---

**Ready to add your API keys?** Let me know and I'll guide you through the process!
