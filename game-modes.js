"use strict";

/**
 * Authoritative mode rules for RISK IT.
 * The live server should call these helpers. It must not trust a client for
 * minimum wagers, multipliers, elimination, or target wins.
 *
 * Implemented: CLASSIC, HIGH_STAKES, SUDDEN_DEATH, TARGET, STREAK, SPRINT.
 * Not implemented here: BANKRUPT, BOUNTY, CHAOS, TEAMS, HIDDEN_HAND, TOURNAMENT.
 */

const IMPLEMENTED_MODES = ["CLASSIC", "HIGH_STAKES", "SUDDEN_DEATH", "TARGET", "STREAK", "SPRINT"];

const DEFAULT_TIMINGS = { bettingSeconds: 10, questionSeconds: 15, resultsSeconds: 5 };
const SPRINT_TIMINGS = { bettingSeconds: 5, questionSeconds: 7, resultsSeconds: 3 };

function normalizeMode(mode) {
  if (typeof mode !== "string") return null;
  const normalized = mode.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return IMPLEMENTED_MODES.includes(normalized) ? normalized : null;
}

function timingsFor(mode) {
  return normalizeMode(mode) === "SPRINT" ? { ...SPRINT_TIMINGS } : { ...DEFAULT_TIMINGS };
}

function highStakesMinimum(round) {
  const safeRound = Number.isInteger(round) && round > 0 ? round : 1;
  if (safeRound <= 3) return 50;
  if (safeRound <= 6) return 100;
  if (safeRound <= 8) return 250;
  if (safeRound === 9) return 500;
  return 1000;
}

function minimumWager(mode, round, balance) {
  if (!Number.isInteger(balance) || balance < 0) return 0;
  if (normalizeMode(mode) !== "HIGH_STAKES") return 0;
  return Math.min(highStakesMinimum(round), balance);
}

function validateWager(mode, { round = 1, amount, balance } = {}) {
  if (!Number.isInteger(balance) || balance < 0) return { ok: false, error: "INVALID_BET" };
  if (!Number.isInteger(amount) || amount < 0 || amount > balance) return { ok: false, error: "INVALID_BET" };
  const minimum = minimumWager(mode, round, balance);
  if (amount < minimum) return { ok: false, error: "BELOW_MINIMUM", minimum };
  return { ok: true, amount, minimum };
}

function streakMultiplier(streak) {
  if (streak >= 5) return 3;
  if (streak >= 4) return 2;
  if (streak >= 3) return 1.5;
  if (streak >= 2) return 1.25;
  return 1;
}

function settleWager({ mode, balance, wager, correct, streak = 0 } = {}) {
  const normalized = normalizeMode(mode) || "CLASSIC";
  const safeBalance = Number.isInteger(balance) ? balance : 0;
  const safeWager = Number.isInteger(wager) ? Math.min(Math.max(wager, 0), safeBalance) : 0;
  const nextStreak = correct ? streak + 1 : 0;
  const multiplier = normalized === "STREAK" && correct ? streakMultiplier(nextStreak) : 1;
  const rawDelta = correct ? Math.round(safeWager * multiplier) : -safeWager;
  const nextBalance = Math.max(0, safeBalance + rawDelta);
  const eliminated = normalized === "SUDDEN_DEATH" && nextBalance === 0;
  return {
    balance: nextBalance,
    delta: nextBalance - safeBalance,
    streak: nextStreak,
    multiplier,
    eliminated,
  };
}

function reachedTarget(mode, balance, target) {
  if (normalizeMode(mode) !== "TARGET") return false;
  if (!Number.isInteger(target) || target <= 0) return false;
  return balance >= target;
}

function suddenDeathWinner(players) {
  const alive = (players || []).filter((player) => player && !player.eliminated && player.balance > 0);
  return alive.length === 1 ? alive[0] : null;
}

module.exports = {
  IMPLEMENTED_MODES,
  DEFAULT_TIMINGS,
  SPRINT_TIMINGS,
  normalizeMode,
  timingsFor,
  highStakesMinimum,
  minimumWager,
  validateWager,
  streakMultiplier,
  settleWager,
  reachedTarget,
  suddenDeathWinner,
};
