// Length limits for projects posted from the admin panel. Used by the admin form (live counters)
// and by the server (server/index.js), so both always agree.
export const PROJECT_TITLE_MAX_WORDS = 7;
export const PROJECT_DESCRIPTION_MAX_WORDS = 40;

// A word is any run of characters containing a letter or digit, so "D&D" is one word and a lone
// "–" or "&" isn't counted.
export const countWords = (text) =>
  String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter((part) => /[\p{L}\p{N}]/u.test(part)).length;
