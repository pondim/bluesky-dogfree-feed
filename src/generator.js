#!/usr/bin/env node
// ---------------------------------------------------------------------------
//  generator.js – Main entry point
//
//  1. Authenticate with Bluesky
//  2. Fetch trending / popular posts via broad search queries
//  3. De-duplicate
//  4. Remove dog-related content  (text, alt-text, labels)
//  5. Score & rank by engagement
//  6. Write top-N results to /public/feed.json
// ---------------------------------------------------------------------------

const { BskyAgent } = require("@atproto/api");
const fs   = require("fs");
const path = require("path");

const config          = require("./config");
const { isDogRelated } = require("./filters");
const { computeScore } = require("./ranking");

// ---------------------------------------------------------------------------
//  Bluesky client
// ---------------------------------------------------------------------------

async function createAgent() {
  const agent = new BskyAgent({ service: config.BLUESKY_SERVICE });

  if (!config.BLUESKY_HANDLE || !config.BLUESKY_APP_PASSWORD) {
    throw new Error(
      "Missing BLUESKY_HANDLE or BLUESKY_APP_PASSWORD. " +
      "Copy .env.example → .env and fill in your credentials."
    );
  }

  await agent.login({
    identifier: config.BLUESKY_HANDLE,
    password: config.BLUESKY_APP_PASSWORD,
  });

  console.log(`✔ Authenticated as ${config.BLUESKY_HANDLE}`);
  return agent;
}

// ---------------------------------------------------------------------------
//  Fetch posts using broad search queries (approximates Discover)
// ---------------------------------------------------------------------------

async function fetchPosts(agent) {
  const seen = new Map();                       // uri → postView (de-dup)
  const cutoff = Date.now() - config.MAX_POST_AGE_HOURS * 3_600_000;

  for (const q of config.DISCOVER_QUERIES) {
    try {
      const res = await agent.app.bsky.feed.searchPosts({
        q,
        sort: "top",                            // engagement-ranked
        limit: config.POSTS_PER_QUERY,
      });

      const posts = res?.data?.posts || [];
      for (const p of posts) {
        // Skip if already collected
        if (seen.has(p.uri)) continue;

        // Skip if too old
        const ts = new Date(p.record?.createdAt || p.indexedAt).getTime();
        if (ts < cutoff) continue;

        seen.set(p.uri, p);
      }

      console.log(`  ↳ query "${q}" returned ${posts.length} posts (${seen.size} unique total)`);
    } catch (err) {
      // Non-fatal – some queries may 400 on the API; just skip.
      console.warn(`  ⚠ query "${q}" failed: ${err.message}`);
    }
  }

  return [...seen.values()];
}

// ---------------------------------------------------------------------------
//  Pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log("\n🚀  Dog-Free Discover Feed Generator\n");

  // 1. Authenticate
  const agent = await createAgent();

  // 2. Fetch posts
  console.log("\n📡  Fetching posts from Bluesky…");
  let posts = await fetchPosts(agent);
  console.log(`   Collected ${posts.length} candidate posts\n`);

  // 3. Filter out dog content
  const before = posts.length;
  posts = posts.filter((p) => !isDogRelated(p));
  const removed = before - posts.length;
  console.log(`🐶  Filtered out ${removed} dog-related posts (${posts.length} remaining)\n`);

  // 4. Score & rank
  const scored = posts.map((p) => ({
    uri:        p.uri,
    cid:        p.cid,
    author:     p.author?.handle || "unknown",
    text:       (p.record?.text || "").slice(0, 300),
    likes:      p.likeCount   ?? 0,
    reposts:    p.repostCount ?? 0,
    replies:    p.replyCount  ?? 0,
    indexedAt:  p.indexedAt,
    score:      computeScore(p),
  }));

  scored.sort((a, b) => b.score - a.score);

  // 5. Trim to FEED_SIZE
  const feed = scored.slice(0, config.FEED_SIZE);

  // 6. Write output
  const outDir = path.resolve(config.OUTPUT_DIR);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.resolve(config.OUTPUT_FILE);
  const payload = {
    generatedAt: new Date().toISOString(),
    postCount:   feed.length,
    feed,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`✅  Wrote ${feed.length} posts to ${outPath}\n`);
}

// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error("❌  Fatal error:", err);
  process.exit(1);
});
