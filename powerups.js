"use strict";

const RARITY = { COMMON: 60, RARE: 30, EPIC: 9, LEGENDARY: 1 };

const ALL_MODES = ["CLASSIC", "LAST_STANDING", "SPEED", "SUDDEN_DEATH", "HIGH_ROLLER", "SURVIVAL", "HEAD_TO_HEAD", "TEAM_BATTLE", "IMPOSTER", "COMEBACK", "JACKPOT", "REVERSE", "AUCTION", "TREASURE", "HANGMAN", "CUSTOM"];
const WAGER_MODES = ALL_MODES.filter((mode) => mode !== "HANGMAN");
const LIFE_MODES = ["HANGMAN", "LAST_STANDING", "SURVIVAL", "SUDDEN_DEATH"];

const ACQUISITION = {
  purchase: true,
  dropChance: 0,
  streakEvery: 0,
  afterCorrect: false,
};

const POWERUPS = {
  SHIELD: {
    name: "Shield",
    description: "Block one eligible negative effect.",
    icon: "SH",
    rarity: "COMMON",
    cost: 300,
    maxInventory: 3,
    cooldownMs: 0,
    allowedModes: ALL_MODES,
    needsTarget: false,
    animation: "POWER_SHIELD",
    blocks: ["STEAL", "BANK_HEIST", "REMOVE_LIFE", "TAX_COLLECTOR", "MARKET_CRASH", "BOUNTY"],
  },
  DOUBLE_DOWN: {
    name: "Double Down",
    description: "Double your next eligible reward.",
    icon: "2×",
    rarity: "RARE",
    cost: 250,
    maxInventory: 2,
    cooldownMs: 0,
    multiplier: 2,
    allowedModes: ALL_MODES,
    needsTarget: false,
    animation: "POWER_DOUBLE",
  },
  HINT: {
    name: "Hint",
    description: "Reveal a clue. Never the answer itself.",
    icon: "?",
    rarity: "COMMON",
    cost: 200,
    maxInventory: 3,
    cooldownMs: 0,
    allowedModes: ALL_MODES,
    needsTarget: false,
    animation: "POWER_HINT",
  },
  STEAL: {
    name: "Steal",
    description: "Take a small cut of another player's cash.",
    icon: "ST",
    rarity: "RARE",
    cost: 400,
    maxInventory: 2,
    cooldownMs: 0,
    amount: 150,
    rate: 0.1,
    allowedModes: ALL_MODES,
    needsTarget: true,
    animation: "POWER_STEAL",
  },
  RISK_BOOST: {
    name: "Risk Boost",
    description: "Raise the payout of your next winning wager.",
    icon: "RB",
    rarity: "RARE",
    cost: 350,
    maxInventory: 2,
    cooldownMs: 0,
    multiplier: 1.5,
    allowedModes: WAGER_MODES,
    needsTarget: false,
    animation: "POWER_RISK",
  },
  FREE_BET: {
    name: "Free Bet",
    description: "Your next wager cannot take cash if you miss.",
    icon: "FB",
    rarity: "EPIC",
    cost: 450,
    maxInventory: 1,
    cooldownMs: 0,
    allowedModes: WAGER_MODES,
    needsTarget: false,
    animation: "POWER_FREE_BET",
  },
  EXTRA_LIFE: {
    name: "Extra Life",
    description: "Gain one life where this mode keeps score with lives.",
    icon: "+1",
    rarity: "EPIC",
    cost: 500,
    maxInventory: 2,
    cooldownMs: 0,
    reviveCash: 100,
    bonusCap: 2,
    allowedModes: LIFE_MODES,
    needsTarget: false,
    animation: "POWER_EXTRA_LIFE",
  },
};

const POWERUP_IDS = Object.keys(POWERUPS);

function enabled(settings) {
  return settings?.powerupsEnabled !== false;
}

function allows(id, mode) {
  const spec = POWERUPS[id];
  return !!spec && spec.allowedModes.includes(mode || "CLASSIC");
}

function emptyInventory() {
  return Object.fromEntries(POWERUP_IDS.map((id) => [id, 0]));
}

function emptyArmed() {
  return { shield: 0, doubleDown: false, riskBoost: false, freeBet: false, extraLife: false };
}

function ensure(player) {
  if (!player.powerups) player.powerups = emptyInventory();
  if (!player.armed) player.armed = emptyArmed();
  if (!player.powerupUsedAt) player.powerupUsedAt = {};
  if (!player.hintEliminated) player.hintEliminated = [];
  return player;
}

function resetPlayer(player) {
  player.powerups = emptyInventory();
  player.armed = emptyArmed();
  player.powerupUsedAt = {};
  player.hintEliminated = [];
  player.resolvedPowerups = [];
}

function clearPlayers(room) {
  for (const player of room?.players?.values?.() || []) resetPlayer(player);
}

function clearRoundHints(player) {
  if (player) player.hintEliminated = [];
}

function count(player, id) {
  return ensure(player).powerups[id] || 0;
}

function grant(player, id, settings, source = "GRANT") {
  const spec = POWERUPS[id];
  if (!spec) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "That powerup does not exist." };
  if (!enabled(settings)) return { ok: false, error: "POWERUPS_OFF", message: "Powerups are turned off." };
  if (!allows(id, settings?.gameMode)) return { ok: false, error: "WRONG_MODE", message: "That powerup is not available in this mode." };
  ensure(player);
  if (player.powerups[id] >= spec.maxInventory) return { ok: false, error: "POWERUP_UNAVAILABLE", message: `${spec.name} is already at the inventory limit.` };
  player.powerups[id] += 1;
  return { ok: true, source, count: player.powerups[id], id };
}

function spendCash(player, cost) {
  if (!Number.isFinite(cost) || cost < 0) return false;
  if ((player.balance || 0) < cost) return false;
  player.balance -= cost;
  player.change = (player.change || 0) - cost;
  return true;
}

function purchase(room, player, id) {
  const spec = POWERUPS[id];
  if (!ACQUISITION.purchase) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "Powerup purchases are turned off." };
  if (!spec) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "That powerup does not exist." };
  if (!enabled(room.settings)) return { ok: false, error: "POWERUPS_OFF", message: "Powerups are turned off." };
  if (!player?.connected) return { ok: false, error: "NOT_PLAYING", message: "Reconnect before you spend." };
  if (["LOBBY", "FINAL"].includes(room.phase)) return { ok: false, error: "WRONG_PHASE", message: "The match is over." };
  if (!allows(id, room.settings?.gameMode)) return { ok: false, error: "WRONG_MODE", message: "That powerup is not available in this mode." };
  if (count(player, id) >= spec.maxInventory) return { ok: false, error: "POWERUP_UNAVAILABLE", message: `${spec.name} is already at the inventory limit.` };
  if (!spendCash(player, spec.cost)) return { ok: false, error: "INSUFFICIENT_CASH", message: `You need $${spec.cost} for ${spec.name}.` };
  const given = grant(player, id, room.settings, "PURCHASE");
  if (!given.ok) {
    player.balance += spec.cost;
    player.change = (player.change || 0) + spec.cost;
    return given;
  }
  return { ok: true, message: `${player.name} bought ${spec.name}. $${player.balance.toLocaleString("en-US")} remaining.`, count: given.count };
}

function onCooldown(player, id, now) {
  const spec = POWERUPS[id];
  const last = player.powerupUsedAt?.[id] || 0;
  return spec.cooldownMs > 0 && now - last < spec.cooldownMs;
}

function takeOne(player, id, now) {
  ensure(player);
  if ((player.powerups[id] || 0) < 1) return false;
  player.powerups[id] -= 1;
  player.powerupUsedAt[id] = now;
  return true;
}

function playing(room) {
  return !["LOBBY", "FINAL"].includes(room.phase);
}

function activate(room, player, id, target, randomInt = () => 0, now = Date.now()) {
  const spec = POWERUPS[id];
  if (!spec) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "That powerup does not exist." };
  if (!enabled(room.settings)) return { ok: false, error: "POWERUPS_OFF", message: "Powerups are turned off." };
  if (!player?.connected) return { ok: false, error: "NOT_PLAYING", message: "Reconnect before you use a powerup." };
  if (!playing(room)) return { ok: false, error: "WRONG_PHASE", message: "The match is over." };
  if (!allows(id, room.settings?.gameMode)) return { ok: false, error: "WRONG_MODE", message: "That powerup is not available in this mode." };
  ensure(player);
  if ((player.powerups[id] || 0) < 1) return { ok: false, error: "NOT_OWNED", message: "You don't have that powerup." };
  if (onCooldown(player, id, now)) return { ok: false, error: "POWERUP_UNAVAILABLE", message: `${spec.name} is still cooling down.` };
  const effect = applyActivation(room, player, id, target, randomInt);
  if (!effect.ok) return effect;
  if (!takeOne(player, id, now)) return { ok: false, error: "NOT_OWNED", message: "You don't have that powerup." };
  return {
    ok: true,
    blocked: !!effect.blocked,
    message: effect.message,
    privateMessage: effect.privateMessage || null,
    cue: effect.skipCue ? null : {
      type: effect.cueType || spec.animation,
      playerId: player.id,
      playerName: player.name,
      targetPlayerId: effect.targetId || null,
      targetName: effect.targetName || null,
      amount: Number.isFinite(effect.amount) ? effect.amount : null,
      description: effect.message,
      metadata: effect.metadata || {},
    },
  };
}

function applyActivation(room, player, id, target, randomInt) {
  const spec = POWERUPS[id];
  const mode = room.settings?.gameMode;
  if (id === "SHIELD") {
    if (player.armed.shield > 0) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "A shield is already up." };
    player.armed.shield += 1;
    return { ok: true, message: `${player.name} raised a shield.` };
  }
  if (id === "DOUBLE_DOWN") {
    if (player.armed.doubleDown) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "Double Down is already waiting on your next reward." };
    player.armed.doubleDown = true;
    return { ok: true, message: `${player.name} armed Double Down.`, metadata: { multiplier: spec.multiplier } };
  }
  if (id === "RISK_BOOST") {
    if (!WAGER_MODES.includes(mode)) return { ok: false, error: "WRONG_MODE", message: "Risk Boost needs a wager." };
    if (player.armed.riskBoost) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "Risk Boost is already waiting on your next wager." };
    player.armed.riskBoost = true;
    return { ok: true, message: `${player.name} armed Risk Boost.`, metadata: { multiplier: spec.multiplier } };
  }
  if (id === "FREE_BET") {
    if (!WAGER_MODES.includes(mode)) return { ok: false, error: "WRONG_MODE", message: "Free Bet needs a wager." };
    if (player.armed.freeBet) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "A free bet is already waiting." };
    player.armed.freeBet = true;
    return { ok: true, message: `${player.name} armed a free bet.` };
  }
  if (id === "EXTRA_LIFE") return applyExtraLife(room, player);
  if (id === "HINT") return applyHint(room, player, randomInt);
  if (id === "STEAL") return applySteal(room, player, target);
  return { ok: false, error: "POWERUP_UNAVAILABLE", message: "That powerup cannot be used." };
}

function applyExtraLife(room, player) {
  const spec = POWERUPS.EXTRA_LIFE;
  const mode = room.settings?.gameMode;
  if (mode === "HANGMAN") {
    if (room.phase !== "HANGMAN" || !player.puzzle) return { ok: false, error: "WRONG_PHASE", message: "Extra Life can be used during the race." };
    if (player.puzzle.solved) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "You already solved this word." };
    const cap = (player.puzzle.maxLives || 0) + spec.bonusCap;
    if (player.puzzle.lives >= cap) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "You are already at the life cap." };
    player.puzzle.lives += 1;
    return { ok: true, message: `${player.name} gained a life.`, amount: 1 };
  }
  if (player.armed.extraLife) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "An extra life is already waiting." };
  player.armed.extraLife = true;
  return { ok: true, message: `${player.name} is holding an extra life.` };
}

function applyHint(room, player, randomInt) {
  if (room.settings?.gameMode === "HANGMAN") {
    if (room.phase !== "HANGMAN" || !player.puzzle) return { ok: false, error: "WRONG_PHASE", message: "Hints open during the race." };
    if (player.puzzle.solved || player.puzzle.lives <= 0) return { ok: false, error: "NOT_PLAYING", message: "Only racers with lives left can use a hint." };
    if (player.puzzle.hint) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "You already have the clue for this word." };
    player.puzzle.hint = true;
    return { ok: true, message: `${player.name} used a hint.`, privateMessage: room.puzzle?.hint || "A clue was unlocked." };
  }
  if (room.phase !== "QUESTION" || !room.question) return { ok: false, error: "WRONG_PHASE", message: "Hints open when the question does." };
  const correct = room.question.correctAnswer;
  const open = [0, 1, 2, 3].filter((index) => index !== correct && !player.hintEliminated.includes(index));
  if (!open.length) return { ok: false, error: "POWERUP_UNAVAILABLE", message: "No more choices can be removed." };
  const index = open[randomInt(open.length)];
  player.hintEliminated.push(index);
  const letter = ["A", "B", "C", "D"][index];
  return { ok: true, message: `${player.name} used a hint.`, privateMessage: `${letter} is not the answer.` };
}

function applySteal(room, player, target) {
  const spec = POWERUPS.STEAL;
  if (!target || target.id === player.id) return { ok: false, error: "INVALID_TARGET", message: "Choose another player." };
  if (!target.connected || (target.balance || 0) <= 0) return { ok: false, error: "INVALID_TARGET", message: "That player has no cash to take." };
  if (absorb(room, target, "STEAL")) {
    return { ok: true, skipCue: true, blocked: true, message: `${target.name} blocked the steal.` };
  }
  const planned = Math.min(spec.amount, Math.max(1, Math.floor(target.balance * spec.rate)));
  const moved = Math.min(target.balance, planned);
  target.balance -= moved;
  player.balance += moved;
  target.change = (target.change || 0) - moved;
  player.change = (player.change || 0) + moved;
  return {
    ok: true,
    targetId: target.id,
    targetName: target.name,
    amount: moved,
    metadata: { travel: "to-player" },
    message: `${player.name} stole $${moved.toLocaleString("en-US")} from ${target.name}.`,
  };
}

function absorb(room, player, effectId) {
  if (!player?.armed?.shield || !POWERUPS.SHIELD.blocks.includes(effectId)) return false;
  player.armed.shield -= 1;
  if (room) {
    room.shieldLog = room.shieldLog || [];
    room.shieldLog.push({ playerId: player.id, playerName: player.name, effectId });
  }
  return true;
}

function noteFlight(room, from, to, amount) {
  if (!room || !amount) return;
  room.cashFlights = room.cashFlights || [];
  room.cashFlights.push({ fromId: from.id, fromName: from.name, toId: to.id, toName: to.name, amount });
}

function adjustDelta(player, { won, wager, delta, mode }) {
  if (!player?.armed) return delta;
  let next = delta;
  const notes = [];
  if (won && player.armed.doubleDown) {
    next *= POWERUPS.DOUBLE_DOWN.multiplier;
    player.armed.doubleDown = false;
    notes.push({ type: "POWER_DOUBLE", amount: next, description: `${player.name} doubled the reward.` });
  }
  if (won && wager > 0 && player.armed.riskBoost && allows("RISK_BOOST", mode)) {
    next = Math.round(next * POWERUPS.RISK_BOOST.multiplier);
    player.armed.riskBoost = false;
    notes.push({ type: "POWER_RISK", amount: next, description: `${player.name}'s Risk Boost paid ${POWERUPS.RISK_BOOST.multiplier}×.` });
  }
  if (!won && wager > 0 && next < 0 && player.armed.freeBet && allows("FREE_BET", mode) && mode !== "SUDDEN_DEATH") {
    next = 0;
    player.armed.freeBet = false;
    notes.push({ type: "POWER_FREE_BET", amount: wager, description: `${player.name}'s free bet covered the miss.` });
  }
  if (notes.length) player.resolvedPowerups = notes;
  return next;
}

function saveFromZero(player, mode) {
  if (!player?.armed?.extraLife || !allows("EXTRA_LIFE", mode)) return false;
  if ((player.balance || 0) > 0) return false;
  player.balance = POWERUPS.EXTRA_LIFE.reviveCash;
  player.armed.extraLife = false;
  player.eliminated = false;
  player.satOut = false;
  player.resolvedPowerups = [{ type: "POWER_EXTRA_LIFE", amount: player.balance, description: `${player.name} spent an extra life and returned with $${player.balance}.` }];
  return true;
}

function scaleReward(player, reward) {
  if (!player?.armed?.doubleDown) return reward;
  const scaled = reward * POWERUPS.DOUBLE_DOWN.multiplier;
  player.armed.doubleDown = false;
  player.resolvedPowerups = [{ type: "POWER_DOUBLE", amount: scaled, description: `${player.name} doubled the reward.` }];
  return scaled;
}

function maybeDrop(room, randomInt) {
  if (!enabled(room.settings) || ACQUISITION.dropChance <= 0) return [];
  const granted = [];
  for (const player of room.players?.values?.() || []) {
    if (!player.connected || randomInt(100) >= ACQUISITION.dropChance) continue;
    const bag = POWERUP_IDS.filter((id) => allows(id, room.settings.gameMode));
    if (!bag.length) continue;
    const roll = randomInt(bag.reduce((sum, id) => sum + (RARITY[POWERUPS[id].rarity] || 1), 0));
    let cursor = 0;
    let picked = bag[0];
    for (const id of bag) {
      cursor += RARITY[POWERUPS[id].rarity] || 1;
      if (roll < cursor) { picked = id; break; }
    }
    const result = grant(player, picked, room.settings, "DROP");
    if (result.ok) granted.push({ playerId: player.id, id: picked });
  }
  return granted;
}

function availability(room, player, id) {
  const spec = POWERUPS[id];
  if (!enabled(room?.settings)) return { usable: false, reason: "Powerups are off." };
  if (!allows(id, room?.settings?.gameMode)) return { usable: false, reason: "Not in this mode." };
  if ((ensure(player).powerups[id] || 0) < 1) return { usable: false, reason: "None owned." };
  if (["LOBBY", "FINAL"].includes(room?.phase)) return { usable: false, reason: "Wait for the match." };
  if (id === "SHIELD" && player.armed.shield > 0) return { usable: false, reason: "Already up." };
  if (id === "DOUBLE_DOWN" && player.armed.doubleDown) return { usable: false, reason: "Already armed." };
  if (id === "RISK_BOOST" && player.armed.riskBoost) return { usable: false, reason: "Already armed." };
  if (id === "FREE_BET" && player.armed.freeBet) return { usable: false, reason: "Already armed." };
  if (id === "EXTRA_LIFE" && room.settings?.gameMode !== "HANGMAN" && player.armed.extraLife) return { usable: false, reason: "Already holding a life." };
  if (id === "HINT" && room.settings?.gameMode === "HANGMAN" && player.puzzle?.hint) return { usable: false, reason: "Clue already open." };
  if (id === "HINT" && room.settings?.gameMode !== "HANGMAN" && room.phase !== "QUESTION") return { usable: false, reason: "Wait for the question." };
  if (id === "STEAL" && ![...room.players.values()].some((other) => other.id !== player.id && other.connected && other.balance > 0)) return { usable: false, reason: "No valid target." };
  return { usable: true, reason: "" };
}

function publicView(player, room) {
  const settings = room?.settings || {};
  const mode = settings.gameMode || "CLASSIC";
  ensure(player);
  const inventory = POWERUP_IDS.filter((id) => allows(id, mode)).map((id) => {
    const spec = POWERUPS[id];
    const state = availability(room, player, id);
    return {
      id,
      name: spec.name,
      description: spec.description,
      icon: spec.icon,
      rarity: spec.rarity,
      count: player.powerups[id] || 0,
      armed: armedLabel(player, id),
      needsTarget: spec.needsTarget,
      usable: state.usable,
      reason: state.reason,
    };
  });
  const offers = !enabled(settings) || !ACQUISITION.purchase || ["LOBBY", "FINAL"].includes(room?.phase)
    ? []
    : POWERUP_IDS.filter((id) => allows(id, mode)).map((id) => {
      const spec = POWERUPS[id];
      const owned = player.powerups[id] || 0;
      return {
        id,
        name: spec.name,
        description: spec.description,
        icon: spec.icon,
        rarity: spec.rarity,
        cost: spec.cost,
        owned,
        maxInventory: spec.maxInventory,
        affordable: (player.balance || 0) >= spec.cost && owned < spec.maxInventory,
      };
    });
  return {
    enabled: enabled(settings),
    inventory,
    offers,
    hintIndexes: [...(player.hintEliminated || [])],
    armed: { ...player.armed },
  };
}

function armedLabel(player, id) {
  if (id === "SHIELD") return player.armed.shield > 0;
  if (id === "DOUBLE_DOWN") return !!player.armed.doubleDown;
  if (id === "RISK_BOOST") return !!player.armed.riskBoost;
  if (id === "FREE_BET") return !!player.armed.freeBet;
  if (id === "EXTRA_LIFE") return !!player.armed.extraLife;
  return false;
}

module.exports = {
  RARITY,
  ACQUISITION,
  POWERUPS,
  POWERUP_IDS,
  ALL_MODES,
  WAGER_MODES,
  LIFE_MODES,
  enabled,
  allows,
  ensure,
  resetPlayer,
  clearPlayers,
  clearRoundHints,
  grant,
  purchase,
  activate,
  absorb,
  noteFlight,
  adjustDelta,
  saveFromZero,
  scaleReward,
  maybeDrop,
  publicView,
};
