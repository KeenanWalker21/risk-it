"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  highStakesMinimum,
  validateWager,
  settleWager,
  streakMultiplier,
  reachedTarget,
  suddenDeathWinner,
  timingsFor,
  normalizeMode,
} = require("./game-modes");

test("classic wagers stay open and high stakes raises the floor", () => {
  assert.equal(validateWager("CLASSIC", { round: 10, amount: 50, balance: 1000 }).ok, true);
  assert.equal(highStakesMinimum(1), 50);
  assert.equal(highStakesMinimum(6), 100);
  assert.equal(highStakesMinimum(8), 250);
  assert.equal(highStakesMinimum(9), 500);
  assert.equal(highStakesMinimum(10), 1000);
  assert.equal(validateWager("HIGH_STAKES", { round: 4, amount: 50, balance: 1000 }).error, "BELOW_MINIMUM");
  assert.equal(validateWager("HIGH_STAKES", { round: 4, amount: 100, balance: 1000 }).ok, true);
  assert.equal(validateWager("high stakes", { round: 10, amount: 40, balance: 40 }).ok, true);
  assert.equal(validateWager("HIGH_STAKES", { round: 2, amount: -10, balance: 1000 }).error, "INVALID_BET");
});

test("sudden death eliminates a busted player and can declare the last survivor", () => {
  const busted = settleWager({ mode: "SUDDEN_DEATH", balance: 250, wager: 250, correct: false });
  assert.equal(busted.balance, 0);
  assert.equal(busted.eliminated, true);
  const survivor = settleWager({ mode: "SUDDEN_DEATH", balance: 250, wager: 100, correct: true });
  assert.equal(survivor.eliminated, false);
  assert.equal(survivor.balance, 350);
  assert.equal(suddenDeathWinner([
    { id: "a", balance: 0, eliminated: true },
    { id: "b", balance: 800, eliminated: false },
  ]).id, "b");
  assert.equal(suddenDeathWinner([
    { id: "a", balance: 100, eliminated: false },
    { id: "b", balance: 800, eliminated: false },
  ]), null);
});

test("target mode ends only when a balance reaches the server target", () => {
  assert.equal(reachedTarget("TARGET", 5000, 5000), true);
  assert.equal(reachedTarget("TARGET", 4999, 5000), false);
  assert.equal(reachedTarget("CLASSIC", 9000, 5000), false);
});

test("streak multiplies winnings and resets after a miss", () => {
  assert.equal(streakMultiplier(1), 1);
  assert.equal(streakMultiplier(2), 1.25);
  assert.equal(streakMultiplier(5), 3);
  const third = settleWager({ mode: "STREAK", balance: 1000, wager: 200, correct: true, streak: 2 });
  assert.equal(third.streak, 3);
  assert.equal(third.multiplier, 1.5);
  assert.equal(third.balance, 1300);
  const miss = settleWager({ mode: "STREAK", balance: 1300, wager: 100, correct: false, streak: 3 });
  assert.equal(miss.streak, 0);
  assert.equal(miss.balance, 1200);
  assert.equal(settleWager({ mode: "CLASSIC", balance: 1000, wager: 250, correct: true }).balance, 1250);
});

test("sprint uses the short timers and unknown modes are rejected", () => {
  assert.deepEqual(timingsFor("SPRINT"), { bettingSeconds: 5, questionSeconds: 7, resultsSeconds: 3 });
  assert.equal(timingsFor("CLASSIC").questionSeconds, 15);
  assert.equal(normalizeMode("not-a-mode"), null);
});
