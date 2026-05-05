// ---------------------------------------------------------------------------
//  ranking.js - Engagement-weighted ranking formula
// ---------------------------------------------------------------------------

const {
  WEIGHT_LIKES,
  WEIGHT_REPOSTS,
  WEIGHT_REPLIES,
} = require("./config");

/**
 * score = (likes * 3 + reposts * 4 + replies * 2) / (hours_since_post + 1)
 */
function computeScore(postView) {
  const likes   = postView?.likeCount   ?? 0;
  const reposts = postView?.repostCount ?? 0;
  const replies = postView?.replyCount  ?? 0;

  const createdAt = postView?.record?.createdAt || postView?.indexedAt;
  const ageMs = createdAt ? Date.now() - new Date(createdAt).getTime() : 0;
  const hoursSincePost = Math.max(ageMs / 3_600_000, 0);

  const numerator =
    likes   * WEIGHT_LIKES +
    reposts * WEIGHT_REPOSTS +
    replies * WEIGHT_REPLIES;

  return numerator / (hoursSincePost + 1);
}

module.exports = { computeScore };
