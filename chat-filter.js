"use strict";

/**
 * Server-side chat policy for RISK IT.
 * Mask profanity before a message is broadcast. Do not trust a client filter.
 * The WebSocket server can call createChatGuard().accept(...) per room member.
 */

const MAX_LENGTH = 200;
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 5;
const MAX_REPEATS = 3;

const EXTRA = {
  a: "@4",
  b: "8",
  e: "3",
  i: "1!|",
  o: "0",
  s: "$5",
  t: "7+",
};

const BLOCKED = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "piss",
  "slut",
  "whore",
  "cunt",
  "nigger",
  "faggot",
];

function escapeChar(char) {
  return char.replace(/[\\\]\-^]/g, "\\$&");
}

function letterClass(letter) {
  const chars = new Set([letter, letter.toUpperCase(), ...(EXTRA[letter] || "")]);
  return `[${[...chars].map(escapeChar).join("")}]`;
}

function wordExpression(word) {
  const body = [...word].map((letter) => `${letterClass(letter)}{1,3}`).join("[\\W_]{0,3}");
  return new RegExp(`(?<![A-Za-z0-9])${body}(?![A-Za-z0-9])`, "gi");
}

const PATTERNS = BLOCKED.map(wordExpression);

function maskProfanity(text) {
  let masked = text;
  for (const pattern of PATTERNS) {
    masked = masked.replace(pattern, (match) => "*".repeat(match.length));
  }
  return masked;
}

function validateChatText(text) {
  if (typeof text !== "string") return { ok: false, error: "EMPTY_MESSAGE" };
  const trimmed = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (!trimmed) return { ok: false, error: "EMPTY_MESSAGE" };
  if ([...trimmed].length > MAX_LENGTH) return { ok: false, error: "MESSAGE_TOO_LONG" };
  return { ok: true, text: trimmed };
}

function createChatGuard(options = {}) {
  const windowMs = options.windowMs || WINDOW_MS;
  const maxPerWindow = options.maxPerWindow || MAX_PER_WINDOW;
  const recent = new Map();

  return {
    accept({ playerId, text, now = Date.now() } = {}) {
      if (typeof playerId !== "string" || !playerId) return { ok: false, error: "INVALID_PLAYER" };
      const checked = validateChatText(text);
      if (!checked.ok) return checked;
      const bucket = (recent.get(playerId) || []).filter((entry) => now - entry.at < windowMs);
      if (bucket.length >= maxPerWindow) return { ok: false, error: "RATE_LIMITED" };
      const repeats = bucket.filter((entry) => entry.text === checked.text).length;
      if (repeats >= MAX_REPEATS) return { ok: false, error: "SPAM" };
      bucket.push({ at: now, text: checked.text });
      recent.set(playerId, bucket);
      return { ok: true, text: maskProfanity(checked.text) };
    },
  };
}

module.exports = {
  MAX_LENGTH,
  WINDOW_MS,
  MAX_PER_WINDOW,
  maskProfanity,
  validateChatText,
  createChatGuard,
};
