# Bluesky Dog-Free Discover Feed

Custom Bluesky feed generator that mirrors **Discover** but filters out all dog-related content.

## Ranking Formula

```
score = (likes * 3 + reposts * 4 + replies * 2) / (hours_since_post + 1)
```

## Setup

1. Copy `.env.example` to `.env` and add your Bluesky credentials
2. 2. `npm install && npm run generate`
  
   3. ## Deploy
  
   4. Add these GitHub Secrets: `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  
   5. The workflow runs every 30 minutes and deploys `public/feed.json` to Cloudflare Pages.
