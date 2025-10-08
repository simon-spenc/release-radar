# Deployment Guide

## Deploy to Vercel

### Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account (sign up at https://vercel.com)

### Step 1: Install Vercel CLI (if not installed)
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **release-radar** (or press Enter)
- In which directory is your code located? **./** (press Enter)
- Want to override settings? **N**

### Step 4: Set Environment Variables

After the initial deployment, set your environment variables:

```bash
# Database
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://mxiqtehonsyjrvbjpvwo.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your service role key from .env.local

# LLM
vercel env add ANTHROPIC_API_KEY
# Paste your Anthropic API key from .env.local

# GitHub
vercel env add GITHUB_TOKEN
# Paste your GitHub token from .env.local

vercel env add GITHUB_WEBHOOK_SECRET
# Paste: d657359437d2639d1bb0f2da7b9fb3f9921b919402a52be7ba91700c9a2cac0a

vercel env add DOCS_REPO_OWNER
# Paste: simon-spenc (or your GitHub username)

vercel env add DOCS_REPO_NAME
# Paste: release-radar-docs

# Linear
vercel env add LINEAR_WEBHOOK_SECRET
# Paste: d657359437d2639d1bb0f2da7b9fb3f9921b919402a52be7ba91700c9a2cac0a

vercel env add LINEAR_API_KEY
# Paste your Linear API key (if you have one)

# Email (optional for now)
vercel env add RESEND_API_KEY
# Skip for now if you don't have one

# App URL
vercel env add NEXT_PUBLIC_APP_URL
# This will be your Vercel URL, e.g., https://release-radar.vercel.app
```

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Set up GitHub Webhook

Once deployed, configure your GitHub webhook:

1. Go to your repository → Settings → Webhooks → Add webhook
2. **Payload URL**: `https://your-app.vercel.app/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: `d657359437d2639d1bb0f2da7b9fb3f9921b919402a52be7ba91700c9a2cac0a`
5. **Events**: Select "Pull requests"
6. **Active**: ✓ Check

---

## Alternative: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository: `simon-spenc/release-radar`
3. Configure environment variables in the dashboard
4. Deploy

---

## Switching to Fly.io (Future)

To migrate to Fly.io later:

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Initialize: `fly launch`
4. Set secrets: `fly secrets set KEY=value`
5. Deploy: `fly deploy`

Fly.io is better for:
- Lower costs for persistent connections
- WebSocket support
- Full control over infrastructure
- Background jobs without serverless limitations

Vercel is better for:
- Zero-config Next.js deployments
- Edge functions
- Preview deployments
- Built-in analytics

---

## Testing Your Deployment

### Test Health Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T..."
}
```

### Test Webhook Endpoint (locally first)
```bash
# Send a test webhook payload
curl -X POST https://your-app.vercel.app/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=test" \
  -d '{"action": "opened", "pull_request": {}}'
```

---

## Monitoring

View logs:
```bash
vercel logs
```

View deployments:
```bash
vercel ls
```

---

## Troubleshooting

### Build fails
- Check that all dependencies are in `package.json`
- Verify TypeScript compiles: `npm run build`

### Environment variables not working
- Make sure to redeploy after adding env vars
- Check env vars in Vercel dashboard: Settings → Environment Variables

### Webhooks not working
- Verify webhook secret matches
- Check Vercel function logs for errors
- Ensure webhook URL is correct (HTTPS required)
