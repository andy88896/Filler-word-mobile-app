// List of filler words to detect
export const FILLER_WORDS: string[] = [
  'um',
  'uh',
  'ah',
  'like',
  'so',
  'right',
  'basically',
  'actually',
  'essentially',
  'maybe',
  'kind of',
  'sort of',
  'you know',
  'i mean',
  'i think',
  'i feel',
];

// Pre-compile regex patterns for faster matching
// Multi-word phrases are listed first to ensure they match before single words
export const FILLER_PATTERNS = FILLER_WORDS
  .sort((a, b) => b.length - a.length) // Sort by length descending (match longer phrases first)
  .map((word) => ({
    word,
    regex: new RegExp(`\\b${word}\\b`, 'gi'),
  }));
