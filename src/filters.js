// ---------------------------------------------------------------------------
//  filters.js - Dog / animal content detection and removal
// ---------------------------------------------------------------------------

// Keyword lists - whole-word patterns matched with word-boundary regex
const DOG_KEYWORDS = [
  "dog", "dogs", "doggo", "doggos", "doggie", "doggies",
  "puppy", "puppies", "pupper", "puppers", "pup", "pups",
  "canine", "canines",
  "hound", "hounds",
  "pooch", "pooches",
  "mutt", "mutts",
  "woof", "bark", "bork",
  "goodboy", "good boy", "good girl",
  "fetch",
  "kennel", "kennels",
  "k9", "k-9",
  "labrador", "retriever", "beagle", "bulldog", "poodle",
  "rottweiler", "dachshund", "corgi", "dalmatian", "husky",
  "shepherd", "terrier", "spaniel", "chihuahua", "pitbull",
  "pit bull", "greyhound", "mastiff", "collie", "shiba",
  "akita", "samoyed", "malinois", "doberman", "boxer",
  "pomeranian", "maltese", "schnauzer", "whippet", "basenji",
  "newfoundland", "vizsla", "weimaraner", "papillon",
];

const DOG_REGEX = new RegExp(
  "\\b(" + DOG_KEYWORDS.join("|") + ")\\b",
  "i"
);

const BLOCKED_LABELS = new Set([
  "dog", "dogs", "animal", "animals", "pet", "pets",
]);

function textContainsDogContent(text) {
  if (!text) return false;
  return DOG_REGEX.test(text);
}

function altTextContainsDogContent(post) {
  const embed = post?.embed;
  if (!embed) return false;
  const images = embed?.images || embed?.media?.images || [];
  for (const img of images) {
    if (textContainsDogContent(img.alt)) return true;
  }
  return false;
}

function labelsContainDogContent(post) {
  const labels = post?.labels || [];
  for (const label of labels) {
    if (BLOCKED_LABELS.has(label?.val?.toLowerCase())) return true;
  }
  return false;
}

function isDogRelated(postView) {
  const record = postView?.record || {};
  const text = record?.text || "";
  if (textContainsDogContent(text)) return true;
  if (altTextContainsDogContent(postView)) return true;
  if (labelsContainDogContent(postView)) return true;
  return false;
}

module.exports = { isDogRelated, DOG_KEYWORDS, BLOCKED_LABELS };
