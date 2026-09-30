"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { maskProfanity, validateChatText, createChatGuard, MAX_LENGTH } = require("./chat-filter");

test("masks profanity while leaving ordinary words alone", () => {
  assert.equal(maskProfanity("You fuck idiot"), "You **** idiot");
  assert.equal(maskProfanity("FUCK"), "****");
  assert.equal(maskProfanity("f.u.c.k"), "*******");
  assert.equal(maskProfanity("f u c k"), "*******");
  assert.equal(maskProfanity("What a classic class"), "What a classic class");
  assert.equal(maskProfanity("I need a password"), "I need a password");
  assert.equal(maskProfanity("hello from the assistant"), "hello from the assistant");
});

test("rejects empty and oversized messages", () => {
  assert.equal(validateChatText("   ").error, "EMPTY_MESSAGE");
  assert.equal(validateChatText("").error, "EMPTY_MESSAGE");
  assert.equal(validateChatText(null).error, "EMPTY_MESSAGE");
  const huge = "a".repeat(MAX_LENGTH + 1);
  assert.equal(validateChatText(huge).error, "MESSAGE_TOO_LONG");
  assert.equal(validateChatText("a".repeat(MAX_LENGTH)).ok, true);
});

test("rate limit and repeated spam are enforced per player", () => {
  const guard = createChatGuard({ windowMs: 10_000, maxPerWindow: 5 });
  let now = 1_000;
  for (let i = 0; i < 5; i += 1) {
    const result = guard.accept({ playerId: "p1", text: `hello ${i}`, now });
    assert.equal(result.ok, true);
    now += 10;
  }
  assert.equal(guard.accept({ playerId: "p1", text: "one more", now }).error, "RATE_LIMITED");
  assert.equal(guard.accept({ playerId: "p2", text: "I can still talk", now }).ok, true);

  const spam = createChatGuard({ windowMs: 10_000, maxPerWindow: 8 });
  assert.equal(spam.accept({ playerId: "p1", text: "same", now: 1 }).ok, true);
  assert.equal(spam.accept({ playerId: "p1", text: "same", now: 2 }).ok, true);
  assert.equal(spam.accept({ playerId: "p1", text: "same", now: 3 }).ok, true);
  assert.equal(spam.accept({ playerId: "p1", text: "same", now: 4 }).error, "SPAM");
  assert.equal(spam.accept({ playerId: "p1", text: "different", now: 5 }).text, "different");
});

test("accepted messages are masked and the window expires", () => {
  const guard = createChatGuard({ windowMs: 1_000, maxPerWindow: 1 });
  assert.equal(guard.accept({ playerId: "p1", text: "  oh shit  ", now: 50 }).text, "oh ****");
  assert.equal(guard.accept({ playerId: "p1", text: "again", now: 100 }).error, "RATE_LIMITED");
  assert.equal(guard.accept({ playerId: "p1", text: "again", now: 1_200 }).text, "again");
});
