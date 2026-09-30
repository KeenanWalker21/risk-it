"use strict";

const PRIORITY = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

const EVENT_ANIMATIONS = {
  DOUBLE_DOWN: { name: "Double Down", description: "Your next eligible reward is doubled.", priority: "MEDIUM", duration: 2600, animation: "double-down", sound: "doubleDown", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  CASH_DROP: { name: "Cash Drop", description: "Bonus cash is in play.", priority: "MEDIUM", duration: 2600, animation: "cash-drop", sound: "cashDrop", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  BANK_HEIST: { name: "Bank Heist", description: "Cash moves from one player to another.", priority: "HIGH", duration: 3200, animation: "bank-heist", sound: "heist", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  LIGHTNING: { name: "Lightning Round", description: "Get ready. The next round is faster.", priority: "HIGH", duration: 2800, animation: "lightning-round", sound: "lightning", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  BOUNTY: { name: "Bounty", description: "A player is marked.", priority: "HIGH", duration: 2800, animation: "bounty", sound: "bounty", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  STEAL: { name: "Steal Chance", description: "A steal is aimed at another player.", priority: "HIGH", duration: 3000, animation: "steal", sound: "steal", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  CHAOS: { name: "Chaos Round", description: "A random supported effect was chosen.", priority: "CRITICAL", duration: 3800, animation: "chaos-round", sound: "chaos", fullscreen: true, blocksInput: true, level: "cinematic" },
  FINAL_GAMBLE: { name: "Final Gamble", description: "The next wager swings twice as hard.", priority: "CRITICAL", duration: 4000, animation: "final-gamble", sound: "finalGamble", fullscreen: true, blocksInput: true, level: "cinematic" },
  JACKPOT: { name: "Jackpot", description: "The jackpot is live.", priority: "CRITICAL", duration: 4000, animation: "jackpot", sound: "jackpot", fullscreen: true, blocksInput: true, level: "cinematic" },
  KINGS_CROWN: { name: "King's Crown", description: "The leader wears the crown.", priority: "HIGH", duration: 3000, animation: "kings-crown", sound: "crown", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  MARKET_CRASH: { name: "Market Crash", description: "Balances take a hit.", priority: "HIGH", duration: 2800, animation: "market-crash", sound: "crash", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  TAX_COLLECTOR: { name: "Tax Collector", description: "The leader pays a tax.", priority: "MEDIUM", duration: 2400, animation: "tax-collector", sound: "tax", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  REVIVAL: { name: "Revival", description: "Broke players are back in.", priority: "HIGH", duration: 2600, animation: "revival", sound: "revival", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  ALL_IN: { name: "All-In", description: "Every wager is the whole balance.", priority: "HIGH", duration: 2600, animation: "all-in", sound: "allIn", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  HIDDEN_RULE: { name: "Hidden Rule", description: "A secret scoring rule is active.", priority: "MEDIUM", duration: 2400, animation: "hidden-rule", sound: "hidden", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  RISK_STORM: { name: "Risk Storm", description: "Two events hit at once.", priority: "CRITICAL", duration: 3800, animation: "risk-storm", sound: "chaos", fullscreen: true, blocksInput: true, level: "cinematic" },
  BUY_HINT: { name: "Hint Purchased", description: "A private clue was unlocked.", priority: "MEDIUM", duration: 1400, animation: "buy-hint", sound: "hint", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  BUY_LETTER: { name: "Letter Revealed", description: "A letter locked onto that player's board.", priority: "MEDIUM", duration: 1400, animation: "buy-letter", sound: "letter", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  REMOVE_LIFE: { name: "Life Lost", description: "A Hangman life was removed.", priority: "HIGH", duration: 2200, animation: "remove-life", sound: "life", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  WORD_SOLVED: { name: "Word Solved", description: "The puzzle is solved.", priority: "HIGH", duration: 2800, animation: "solve-word", sound: "solve", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  ELIMINATED: { name: "Eliminated", description: "That player is out of lives and can watch.", priority: "HIGH", duration: 2000, animation: "elimination", sound: "elimination", fullscreen: false, blocksInput: false, supportsTarget: false, level: "major" },
  CASH_GAIN: { name: "Cash In", description: "Cash was added.", priority: "LOW", duration: 1100, animation: "cash-gain", sound: "cash", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  CASH_LOSS: { name: "Cash Out", description: "Cash was spent or lost.", priority: "LOW", duration: 1100, animation: "cash-loss", sound: "cash", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  PROTECTION: { name: "Protected", description: "A shield is up.", priority: "MEDIUM", duration: 1800, animation: "protection", sound: "protect", fullscreen: false, blocksInput: false, supportsTarget: true, level: "major" },
  INSUFFICIENT_CASH: { name: "Not Enough Cash", description: "That purchase did not go through.", priority: "LOW", duration: 900, animation: "failure", sound: "deny", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  INVALID_TARGET: { name: "Invalid Target", description: "Choose a different player.", priority: "LOW", duration: 900, animation: "failure", sound: "deny", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  EVENT_UNAVAILABLE: { name: "Event Unavailable", description: "That action is not available.", priority: "LOW", duration: 900, animation: "failure", sound: "deny", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  GAME_ALREADY_ENDED: { name: "Game Already Ended", description: "The shop is closed.", priority: "LOW", duration: 900, animation: "failure", sound: "deny", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
  NOT_YOUR_TURN: { name: "Not Your Turn", description: "That action is closed right now.", priority: "LOW", duration: 900, animation: "failure", sound: "deny", fullscreen: false, blocksInput: false, supportsTarget: false, level: "small" },
};

const FAILURE_CODES = {
  INSUFFICIENT_CASH: "INSUFFICIENT_CASH",
  INVALID_TARGET: "INVALID_TARGET",
  EVENTS_OFF: "EVENT_UNAVAILABLE",
  PURCHASES_OFF: "EVENT_UNAVAILABLE",
  ATTACKS_OFF: "EVENT_UNAVAILABLE",
  UNKNOWN_EVENT: "EVENT_UNAVAILABLE",
  DUPLICATE_PURCHASE: "EVENT_UNAVAILABLE",
  NOTHING_LEFT: "EVENT_UNAVAILABLE",
};

function buildCue(input = {}, now = Date.now()) {
  const spec = EVENT_ANIMATIONS[input.type];
  if (!spec) return null;
  const amount = Number.isFinite(input.amount) ? input.amount : null;
  return {
    id: input.id || `cue-${now}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    name: spec.name,
    description: input.description || spec.description,
    priority: spec.priority,
    duration: prefersShorter(input.duration || spec.duration),
    animation: spec.animation,
    sound: spec.sound,
    fullscreen: spec.level === "cinematic",
    blocksInput: spec.level === "cinematic",
    supportsTarget: !!spec.supportsTarget,
    level: spec.level,
    playerId: input.playerId || null,
    playerName: input.playerName || null,
    targetPlayerId: input.targetPlayerId || null,
    targetName: input.targetName || null,
    amount,
    timestamp: input.timestamp || now,
    metadata: input.metadata && typeof input.metadata === "object" ? { ...input.metadata } : {},
  };
}

function prefersShorter(duration) {
  return duration;
}

function failureCue(code, message) {
  let type = FAILURE_CODES[code] || null;
  if (code === "WRONG_PHASE") type = /closed|ended|over/i.test(message || "") ? "GAME_ALREADY_ENDED" : "NOT_YOUR_TURN";
  if (!type) return null;
  return buildCue({ type, description: message || EVENT_ANIMATIONS[type].description });
}

function AnimationQueue() {
  this.major = [];
  this.floats = [];
  this.current = null;
  this.played = [];
}

AnimationQueue.prototype.enqueue = function enqueue(cue) {
  if (!cue || !EVENT_ANIMATIONS[cue.type]) return { channel: "ignored" };
  if (cue.level === "small" || cue.priority === "LOW") {
    this.floats.push(cue);
    return { channel: "float" };
  }
  if (cue.priority === "CRITICAL" && this.current && this.current.priority !== "CRITICAL") {
    this.insertMajor(this.current);
    this.current = cue;
    return { channel: "interrupt" };
  }
  if (!this.current) {
    this.current = cue;
    return { channel: "play" };
  }
  this.insertMajor(cue);
  return { channel: "queue" };
};

AnimationQueue.prototype.insertMajor = function insertMajor(cue) {
  const rank = PRIORITY[cue.priority] || 0;
  const index = this.major.findIndex((item) => (PRIORITY[item.priority] || 0) < rank);
  if (index < 0) this.major.push(cue);
  else this.major.splice(index, 0, cue);
};

AnimationQueue.prototype.finishCurrent = function finishCurrent() {
  if (this.current) this.played.push(this.current.type);
  this.current = this.major.shift() || null;
  return this.current;
};

AnimationQueue.prototype.takeFloats = function takeFloats(limit = 4) {
  return this.floats.splice(0, limit);
};

const api = { PRIORITY, EVENT_ANIMATIONS, FAILURE_CODES, buildCue, failureCue, AnimationQueue };
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.RiskItAnimations = api;
