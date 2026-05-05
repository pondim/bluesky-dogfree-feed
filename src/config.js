// ---------------------------------------------------------------------------
//  config.js - Central configuration for the dog-free Discover feed clone
// ---------------------------------------------------------------------------

require("dotenv").config();

module.exports = {
  // Bluesky credentials
  BLUESKY_HANDLE: process.env.BLUESKY_HANDLE || "",
  BLUESKY_APP_PASSWORD: process.env.BLUESKY_APP_PASSWORD || "",
  BLUESKY_SERVICE: process.env.BLUESKY_SERVICE || "https://bsky.social",

  // Feed parameters
  POSTS_PER_QUERY: parseInt(process.env.POSTS_PER_QUERY, 10) || 100,
  MAX_POST_AGE_HOURS: parseInt(process.env.MAX_POST_AGE_HOURS, 10) || 48,
  FEED_SIZE: parseInt(process.env.FEED_SIZE, 10) || 50,

  // Ranking weights
  WEIGHT_LIKES: 3,
  WEIGHT_REPOSTS: 4,
  WEIGHT_REPLIES: 2,

  // Search diversity - broad queries that approximate Discover
  DISCOVER_QUERIES: [
    "*",
    "trending",
    "news",
    "tech",
    "art",
    "music",
    "science",
    "gaming",
    "film",
    "books",
    "photography",
    "sports",
    "food",
    "travel",
    "politics",
  ],

  // Output path
  OUTPUT_DIR: "public",
  OUTPUT_FILE: "public/feed.json",
};
