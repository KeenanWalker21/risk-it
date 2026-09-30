"use strict";

const crypto = require("node:crypto");
const hangman = require("./hangman");

const MODES = [
  ["CLASSIC", "Classic Risk It", "Answer questions, wager your cash, and finish with the biggest bankroll."],
  ["LAST_STANDING", "Last Player Standing", "Survive by protecting your cash. Hit $0 and you're eliminated."],
  ["SPEED", "Speed Risk", "Fast questions, short timers, and rapid-fire betting."],
  ["SUDDEN_DEATH", "Sudden Death", "One major mistake can eliminate you. Every decision matters."],
  ["HIGH_ROLLER", "High Roller", "Start rich, wager big, and risk massive amounts of cash."],
  ["SURVIVAL", "Survival", "Keep answering correctly as the questions become harder."],
  ["HEAD_TO_HEAD", "Head-to-Head", "Two players compete directly for the biggest bankroll."],
  ["TEAM_BATTLE", "Team Battle", "Work together with your team and build the largest team bankroll."],
  ["IMPOSTER", "Imposter", "One or more players have a hidden objective. Find out who is different."],
  ["COMEBACK", "Comeback", "Players behind get powerful opportunities to make a comeback."],
  ["JACKPOT", "Jackpot", "Build the jackpot and fight to claim it."],
  ["REVERSE", "Reverse Risk", "Predict when you'll be wrong and turn mistakes into opportunities."],
  ["AUCTION", "Auction", "Bid for the chance to answer valuable questions."],
  ["TREASURE", "Treasure Hunt", "Solve questions and clues to reach the final prize."],
  ["HANGMAN", "Hangman", "Race to solve the hidden word. Save lives to earn more cash."],
  ["CUSTOM", "Custom Match", "Create your own Risk It rules, modes, questions, events, and powerups."],
];

const MODE_ALIASES = { SPRINT: "SPEED", HIGH_STAKES: "HIGH_ROLLER" };
const MODE_IDS = new Set(MODES.map(([id]) => id));

const EVENTS = [
  ["DOUBLE_DOWN", "Double Down"],
  ["MARKET_CRASH", "Market Crash"],
  ["CASH_DROP", "Cash Drop"],
  ["TAX_COLLECTOR", "Tax Collector"],
  ["JACKPOT", "Jackpot"],
  ["REVIVAL", "Revival"],
  ["BANK_HEIST", "Bank Heist"],
  ["ALL_IN", "All-In"],
  ["LIGHTNING", "Lightning Round"],
  ["BOUNTY", "Bounty"],
  ["KINGS_CROWN", "King's Crown"],
  ["STEAL", "Steal Chance"],
  ["CHAOS", "Chaos Round"],
  ["HIDDEN_RULE", "Hidden Rule"],
  ["RISK_STORM", "Risk Storm"],
  ["FINAL_GAMBLE", "Final Gamble"],
];
const EVENT_IDS = EVENTS.map(([id]) => id);
const EVENT_LABELS = Object.fromEntries(EVENTS);

const DIFFICULTIES = ["ANY", "EASY", "MEDIUM", "HARD"];
const CATEGORIES = ["General Knowledge", "Science", "History", "Sports", "Technology", "Entertainment", "Geography"];
const QUESTION_TYPES = [
  ["WHO", "Who"],
  ["WHAT", "What"],
  ["WHICH", "Which"],
  ["WHERE", "Where"],
  ["WHEN", "When"],
  ["HOW_MANY", "How many"],
];
const QUESTION_TYPE_IDS = QUESTION_TYPES.map(([id]) => id);
const BET_TIMES = [3, 5, 10, 15];
const QUESTION_TIMES = [5, 7, 15, 20, 30];
const RESULT_TIMES = [3, 5];
const REVIVAL_STAKE = 500;

function defaultRandomInt(max) {
  return crypto.randomInt(max);
}

function defaultEvents() {
  return Object.fromEntries(EVENT_IDS.map((id) => [id, true]));
}

function defaultSettings(questionCount) {
  return {
    startingCash: 1000,
    questionCount,
    gameMode: "CLASSIC",
    difficulty: "ANY",
    betSeconds: 10,
    questionSeconds: 15,
    resultsSeconds: 5,
    eliminateAtZero: true,
    categories: [],
    questionTypes: [],
    events: defaultEvents(),
    hangmanLives: 6,
    hangmanSeconds: 60,
    hangmanDifficulty: "ANY",
    hangmanCategories: [],
    hangmanRewardMultiplier: 1,
    hangmanWords: 3,
    hangmanPurchases: true,
    hangmanAttacks: true,
    cashEventsEnabled: true,
  };
}

function normalizeMode(mode) {
  if (typeof mode !== "string") return null;
  const key = mode.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const resolved = MODE_ALIASES[key] || key;
  return MODE_IDS.has(resolved) ? resolved : null;
}

function modeLabel(mode) {
  return MODES.find(([id]) => id === mode)?.[1] || "Classic Risk It";
}

function modeCopy(mode) {
  return MODES.find(([id]) => id === mode)?.[2] || "";
}

function isStandardEvents(events = {}) {
  return EVENT_IDS.every((id) => events[id] === true);
}

function isCustomMatch(settings) {
  return settings.startingCash !== 1000
    || settings.questionCount !== 10
    || settings.gameMode !== "CLASSIC"
    || settings.difficulty !== "ANY"
    || settings.betSeconds !== 10
    || settings.questionSeconds !== 15
    || settings.resultsSeconds !== 5
    || settings.eliminateAtZero === false
    || (settings.categories || []).length > 0
    || (settings.questionTypes || []).length > 0
    || !isStandardEvents(settings.events)
    || settings.hangmanLives !== 6
    || settings.hangmanSeconds !== 60
    || settings.hangmanDifficulty !== "ANY"
    || (settings.hangmanCategories || []).length > 0
    || settings.hangmanRewardMultiplier !== 1
    || settings.hangmanWords !== 3
    || settings.hangmanPurchases === false
    || settings.hangmanAttacks === false
    || settings.cashEventsEnabled === false;
}

function listPlayers(room) {
  if (!room?.players) return [];
  return room.players instanceof Map ? [...room.players.values()] : [...room.players];
}

function desiredDifficulty(settings, round) {
  if (settings.gameMode === "SURVIVAL") {
    const total = settings.questionCount || 10;
    if (round <= Math.ceil(total / 3)) return "EASY";
    if (round <= Math.ceil((2 * total) / 3)) return "MEDIUM";
    return "HARD";
  }
  if (!settings.difficulty || settings.difficulty === "ANY") return null;
  return settings.difficulty;
}

function questionKind(question) {
  const text = String(question?.question || "").trim().toLowerCase();
  if (/^who\b/.test(text)) return "WHO";
  if (/^how many\b|^how often\b|^how much\b/.test(text)) return "HOW_MANY";
  if (/^when\b|^in which year\b|\bwhich year\b/.test(text)) return "WHEN";
  if (/\bwhich country\b|\bwhich continent\b|\bcapital of\b|^where\b|\blocated in which\b|\blies off the coast\b/.test(text)) return "WHERE";
  if (/^which\b|^on which\b|^in which\b/.test(text)) return "WHICH";
  return "WHAT";
}

function matchesQuestion(question, settings, round) {
  const difficulty = desiredDifficulty(settings, round);
  const categories = settings.categories || [];
  const types = settings.questionTypes || [];
  if (difficulty && String(question.difficulty).toUpperCase() !== difficulty) return false;
  if (categories.length && !categories.includes(question.category)) return false;
  if (types.length && !types.includes(questionKind(question))) return false;
  return true;
}

function questionPool(questions, used, settings, round) {
  const ranked = [
    questions.filter((question) => matchesQuestion(question, settings, round)),
    (settings.categories || []).length ? questions.filter((question) => matchesQuestion(question, { ...settings, questionTypes: [] }, round)) : [],
    (settings.questionTypes || []).length ? questions.filter((question) => matchesQuestion(question, { ...settings, categories: [] }, round)) : [],
    questions,
  ].find((pool) => pool.length) || questions;
  const fresh = ranked.filter((question) => !used.has(question.id));
  return fresh.length ? fresh : ranked;
}

function timings(settings, roundState, fast) {
  if (fast) return { betting: 1, question: 1, results: 1 };
  let betting = settings.betSeconds || 10;
  let question = settings.questionSeconds || 15;
  let results = settings.resultsSeconds || 5;
  if (settings.gameMode === "SPEED") {
    betting = Math.min(betting, 5);
    question = Math.min(question, 7);
    results = Math.min(results, 3);
  }
  if (roundState?.lightning) {
    betting = Math.min(betting, 3);
    question = Math.min(question, 5);
    results = Math.min(results, 3);
  }
  return { betting, question, results };
}

function allowedWagers(player, room) {
  const balance = player.balance || 0;
  if (balance <= 0) return [];
  if (room.roundState?.forceAllIn) return [balance];
  const mode = room.settings?.gameMode;
  let chips = mode === "HIGH_ROLLER" ? [500, 1000, 2500, 5000] : [50, 100, 250, 500];
  if (mode === "HEAD_TO_HEAD") {
    const minimum = Math.ceil(balance * 0.25);
    chips = [100, 250, 500, 1000].filter((amount) => amount >= minimum);
  }
  const options = chips.filter((amount) => amount < balance);
  if (!options.includes(balance)) options.push(balance);
  return options;
}

function validateLiveBet(player, room, amount) {
  if (player.satOut) return { ok: false, error: "SPECTATING", message: "You are out of cash and can only spectate." };
  if (room.roundState?.forceAllIn) return { ok: false, error: "ALL_IN_LOCKED", message: "This round is all-in. Your balance is already locked." };
  const options = allowedWagers(player, room);
  if (!Number.isInteger(amount) || !options.includes(amount)) return { ok: false, error: "INVALID_BET", message: "Choose a listed bet or an all-in amount within your balance." };
  return { ok: true, amount };
}

function mayAnswer(player, room) {
  if (!player?.connected) return false;
  if (room.settings?.gameMode === "AUCTION") return player.id === room.roundState?.bidderId;
  if (room.roundState?.openToAll) return true;
  if (player.satOut) return false;
  if ((player.balance || 0) <= 0 && room.settings?.eliminateAtZero !== false) return false;
  return true;
}

function blankRoundState() {
  return {
    id: null,
    title: "",
    detail: "",
    openToAll: false,
    skipBetting: false,
    jackpotAmount: 0,
    payoutMultiplier: 1,
    forceAllIn: false,
    reverse: false,
    hidden: false,
    hiddenReveal: "",
    lightning: false,
    bidderId: null,
    heist: null,
    bountyId: null,
    crownId: null,
    steal: null,
  };
}

function eventNotice(state, phase) {
  if (!state?.id) return null;
  const hidden = state.hidden && phase !== "RESULTS";
  return {
    id: state.id,
    title: state.title,
    detail: hidden ? "A secret rule is active this round." : state.detail,
    openToAll: !!state.openToAll,
    jackpotAmount: state.jackpotAmount || 0,
    forceAllIn: !!state.forceAllIn,
    reverse: hidden ? false : !!state.reverse,
  };
}

function richest(players) {
  return [...players].filter((player) => (player.balance || 0) > 0).sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name))[0] || null;
}

function otherThan(players, id) {
  return players.filter((player) => player.id !== id && (player.balance || 0) > 0);
}

function jackpotAmount(randomInt) {
  return 10000 + randomInt(91) * 1000;
}

function joinDetail(current, next) {
  return current ? `${current} ${next}` : next;
}

function applyOneEvent(room, eventId, randomInt) {
  const players = listPlayers(room);
  const state = room.roundState || blankRoundState();
  room.roundState = state;
  const label = EVENT_LABELS[eventId] || "Event";
  if (eventId === "DOUBLE_DOWN") {
    state.payoutMultiplier = Math.max(state.payoutMultiplier, 1) * 2;
    state.detail = joinDetail(state.detail, "Correct answers pay 2×.");
  } else if (eventId === "MARKET_CRASH") {
    for (const player of players) {
      if (player.balance > 0) player.balance = Math.floor(player.balance * 0.85);
    }
    state.detail = joinDetail(state.detail, "The market dropped. Everyone lost 15%.");
  } else if (eventId === "CASH_DROP") {
    for (const player of players) if (player.balance > 0) player.balance += 250;
    state.detail = joinDetail(state.detail, "Everyone still in the game received $250.");
  } else if (eventId === "TAX_COLLECTOR") {
    const leader = richest(players);
    if (leader) {
      const loss = Math.min(leader.balance, Math.max(1, Math.floor(leader.balance * 0.15)));
      leader.balance -= loss;
    }
    state.detail = joinDetail(state.detail, "The richest player paid a 15% tax.");
  } else if (eventId === "JACKPOT") {
    state.openToAll = true;
    state.skipBetting = true;
    state.jackpotAmount = jackpotAmount(randomInt);
    state.detail = joinDetail(state.detail, `$${state.jackpotAmount.toLocaleString("en-US")} is on the line. Broke players can answer.`);
  } else if (eventId === "REVIVAL") {
    const broke = players.filter((player) => player.balance <= 0);
    if (!broke.length) return false;
    for (const player of broke) {
      player.balance += REVIVAL_STAKE;
      player.eliminated = false;
    }
    state.detail = joinDetail(state.detail, `Broke players are back with $${REVIVAL_STAKE.toLocaleString("en-US")}.`);
  } else if (eventId === "BANK_HEIST") {
    const thief = players[randomInt(players.length)];
    const victims = otherThan(players, thief.id);
    const victim = victims.length ? victims[randomInt(victims.length)] : null;
    if (victim) state.heist = { thiefId: thief.id, victimId: victim.id };
    state.detail = joinDetail(state.detail, victim ? `${thief.name} can steal 15% if they answer correctly.` : "Nobody has cash to steal.");
  } else if (eventId === "ALL_IN") {
    state.forceAllIn = true;
    state.detail = joinDetail(state.detail, "Every player still in the game wagers their whole balance.");
  } else if (eventId === "LIGHTNING") {
    state.lightning = true;
    room.lightningLeft = 2;
    state.detail = joinDetail(state.detail, "The next questions use short timers.");
  } else if (eventId === "BOUNTY") {
    const leader = richest(players);
    if (leader) state.bountyId = leader.id;
    state.detail = joinDetail(state.detail, leader ? `A bounty is on ${leader.name}. Beat them to take 10%.` : "No leader to target.");
  } else if (eventId === "KINGS_CROWN") {
    const leader = richest(players);
    if (leader) {
      state.crownId = leader.id;
      state.bountyId = leader.id;
    }
    state.detail = joinDetail(state.detail, leader ? `${leader.name} earns 2× for a correct answer, but is the target.` : "No leader wears the crown.");
  } else if (eventId === "STEAL") {
    const thief = players[randomInt(players.length)];
    const victims = otherThan(players, thief.id);
    const victim = victims.length ? victims[randomInt(victims.length)] : null;
    if (victim) state.steal = { thiefId: thief.id, victimId: victim.id };
    state.detail = joinDetail(state.detail, victim ? `${thief.name} gets a steal chance against ${victim.name}.` : "Nobody has cash to steal.");
  } else if (eventId === "HIDDEN_RULE") {
    state.hidden = true;
    if (randomInt(2) === 0) {
      state.payoutMultiplier = Math.max(state.payoutMultiplier, 1) * 2;
      state.hiddenReveal = "The hidden rule was Double Down.";
    } else {
      state.reverse = true;
      state.hiddenReveal = "The hidden rule was Reverse Risk.";
    }
    state.detail = state.hiddenReveal;
  } else if (eventId === "FINAL_GAMBLE") {
    state.forceAllIn = true;
    state.payoutMultiplier = Math.max(state.payoutMultiplier, 1) * 2;
    state.detail = joinDetail(state.detail, "Final gamble: all-in, and a correct answer pays 2×.");
  } else {
    return false;
  }
  if (!state.id) state.id = eventId;
  if (!state.title) state.title = label;
  else if (!state.title.includes(label)) state.title = `${state.title} + ${label}`;
  return true;
}

function applyEvent(room, eventId, randomInt = defaultRandomInt) {
  const players = listPlayers(room);
  if (!EVENT_IDS.includes(eventId) || !players.length) return false;
  if (!room.roundState) room.roundState = blankRoundState();
  if (eventId === "CHAOS" || eventId === "RISK_STORM") {
    const pool = EVENT_IDS.filter((id) => id !== "CHAOS" && id !== "RISK_STORM" && room.settings?.events?.[id] !== false);
    const picks = [];
    const bag = [...pool];
    const count = eventId === "RISK_STORM" ? 2 : 1;
    while (picks.length < count && bag.length) picks.push(bag.splice(randomInt(bag.length), 1)[0]);
    if (!picks.length) return false;
    room.roundState.id = eventId;
    room.roundState.title = EVENT_LABELS[eventId];
    let applied = false;
    for (const pick of picks) applied = applyOneEvent(room, pick, randomInt) || applied;
    return applied;
  }
  return applyOneEvent(room, eventId, randomInt);
}

function pickEventId(settings, { round, totalRounds, fast, force, randomInt = defaultRandomInt }) {
  if (force && EVENT_IDS.includes(force)) return force;
  if (fast) return null;
  const enabled = EVENT_IDS.filter((id) => settings.events?.[id]);
  if (!enabled.length) return null;
  if (round === totalRounds && settings.events.FINAL_GAMBLE && randomInt(2) === 0) return "FINAL_GAMBLE";
  if (randomInt(3) !== 0) return null;
  return enabled[randomInt(enabled.length)];
}

function preparePlayers(players, settings, randomInt = defaultRandomInt) {
  const ordered = [...players];
  for (const player of ordered) {
    player.balance = settings.startingCash;
    player.score = 0;
    player.eliminated = false;
    player.satOut = false;
    player.role = null;
    player.team = null;
    player.bet = null;
    player.answer = null;
    player.correct = null;
    player.change = 0;
    player.puzzle = null;
    player.pendingDouble = false;
    player.pendingDrop = 0;
    player.pendingGamble = false;
  }
  const teams = settings.gameMode === "TEAM_BATTLE" ? { A: { balance: settings.startingCash }, B: { balance: settings.startingCash } } : null;
  if (teams) {
    ordered.forEach((player, index) => {
      player.team = index % 2 === 0 ? "A" : "B";
      player.balance = teams[player.team].balance;
    });
  }
  if (settings.gameMode === "IMPOSTER") {
    const pool = ordered.filter((player) => player.connected);
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swap = randomInt(index + 1);
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
    const count = pool.length >= 8 ? 2 : 1;
    pool.slice(0, count).forEach((player) => { player.role = "IMPOSTER"; });
  }
  return { teams, pot: 0, clues: [] };
}

function markRoundParticipation(room) {
  const open = !!room.roundState?.openToAll;
  for (const player of listPlayers(room)) {
    player.bet = null;
    player.answer = null;
    player.correct = null;
    player.change = 0;
    player.satOut = !open && (player.balance || 0) <= 0 && room.settings?.eliminateAtZero !== false;
    player.eliminated = player.satOut;
  }
}

function lockForcedBets(room) {
  if (!room.roundState?.forceAllIn) return;
  for (const player of listPlayers(room)) {
    if (player.connected && player.balance > 0 && !player.satOut) player.bet = player.balance;
  }
}

function chooseAuctionBidder(room) {
  if (room.settings?.gameMode !== "AUCTION") return;
  if (!room.roundState) room.roundState = blankRoundState();
  const bids = listPlayers(room).filter((player) => (player.bet || 0) > 0).sort((a, b) => b.bet - a.bet || a.name.localeCompare(b.name));
  room.roundState.bidderId = bids[0]?.id || null;
  const note = bids[0] ? `${bids[0].name} won the auction at $${bids[0].bet.toLocaleString("en-US")}.` : "Nobody bid. The question passes.";
  room.roundState.detail = joinDetail(room.roundState.detail, note);
  room.roundState.id = room.roundState.id || "AUCTION";
  room.roundState.title = room.roundState.title || "Auction";
}

function transfer(from, to, amount) {
  const moved = Math.min(from.balance, Math.max(0, amount));
  if (!moved) return 0;
  from.balance -= moved;
  to.balance += moved;
  from.change -= moved;
  to.change += moved;
  return moved;
}

function scoreRound(room, randomInt = defaultRandomInt) {
  const players = listPlayers(room);
  const state = room.roundState || blankRoundState();
  const mode = room.settings.gameMode;
  const question = room.question;
  const reverse = !!state.reverse || (mode === "REVERSE" && room.round % 2 === 0);
  if (mode === "JACKPOT") room.pot = (room.pot || 0) + (100 * Math.max(players.filter((player) => player.connected).length, 1));

  if (state.jackpotAmount > 0 && state.openToAll) {
    const correct = players.filter((player) => player.connected && player.answer === question.correctAnswer);
    const winner = correct.length ? correct[randomInt(correct.length)] : null;
    for (const player of players) {
      const right = player.answer === question.correctAnswer;
      player.correct = right;
      player.change = 0;
      if (right) player.score += 1;
      if (winner && player.id === winner.id) {
        player.change = state.jackpotAmount;
        player.balance += state.jackpotAmount;
        player.eliminated = false;
        player.satOut = false;
      }
    }
  } else if (mode === "TEAM_BATTLE" && room.teams) {
    for (const team of ["A", "B"]) {
      const members = players.filter((player) => player.team === team);
      const wager = members.find((player) => player.bet !== null)?.bet || 0;
      const won = members.some((player) => player.answer === question.correctAnswer);
      const next = Math.max(0, room.teams[team].balance + (won ? wager : -wager));
      const delta = next - room.teams[team].balance;
      room.teams[team].balance = next;
      for (const player of members) {
        player.correct = player.answer === question.correctAnswer;
        player.change = delta;
        player.balance = next;
        if (player.correct) player.score += 1;
      }
    }
  } else if (mode === "AUCTION") {
    const bidder = players.find((player) => player.id === state.bidderId);
    for (const player of players) {
      player.change = 0;
      player.correct = false;
    }
    if (bidder) {
      const won = bidder.answer === question.correctAnswer;
      const wager = bidder.bet || 0;
      bidder.correct = won;
      bidder.change = won ? Math.round(wager * (state.payoutMultiplier || 1)) : -wager;
      bidder.balance = Math.max(0, bidder.balance + bidder.change);
      if (won) bidder.score += 1;
    }
  } else {
    const leaderBalance = Math.max(0, ...players.map((player) => player.balance || 0));
    for (const player of players) {
      if (player.satOut && !state.openToAll) {
        player.correct = false;
        player.change = 0;
        continue;
      }
      const triviaRight = player.answer !== null && player.answer === question.correctAnswer;
      const won = reverse ? player.answer !== null && !triviaRight : triviaRight;
      let multiplier = state.payoutMultiplier || 1;
      if (mode === "COMEBACK" && player.balance < leaderBalance) multiplier *= 2;
      if (state.crownId && player.id === state.crownId && won) multiplier *= 2;
      const wager = player.bet || 0;
      let delta;
      if (mode === "SUDDEN_DEATH" && !won && player.connected && !player.satOut) delta = -(player.balance || 0);
      else if (!won && player.answer === null && wager === 0) delta = 0;
      else delta = won ? Math.round(wager * multiplier) : -wager;
      if (won && player.pendingDouble) { delta *= 2; player.pendingDouble = false; }
      if (won && player.pendingDrop) { delta += player.pendingDrop; player.pendingDrop = 0; }
      if (player.pendingGamble && wager > 0 && mode !== "SUDDEN_DEATH") { delta *= 2; player.pendingGamble = false; }
      player.correct = won;
      player.change = delta;
      player.balance = Math.max(0, (player.balance || 0) + delta);
      if (triviaRight) player.score += 1;
      if (mode === "TREASURE" && triviaRight) {
        room.pot = (room.pot || 0) + 250;
        room.clues = room.clues || [];
        room.clues.push({ round: room.round, text: `${question.category}: ${question.question}` });
      }
    }
  }

  for (const player of players) {
    if ((player.balance || 0) <= 0 && room.settings?.eliminateAtZero !== false) player.eliminated = true;
  }
  resolveSidePayouts(players, state, randomInt);
  awardClosingPot(room, players, randomInt);
}

function resolveSidePayouts(players, state, randomInt) {
  if (state.heist) moveIfCorrect(players, state.heist, 0.15);
  if (state.steal) moveIfCorrect(players, state.steal, 0.1);
  if (state.bountyId) {
    const leader = players.find((player) => player.id === state.bountyId);
    const winners = players.filter((player) => player.id !== state.bountyId && player.correct);
    if (leader && !leader.correct && winners.length) {
      transfer(leader, winners[randomInt(winners.length)], Math.max(1, Math.floor(leader.balance * 0.1)));
    }
  }
}

function moveIfCorrect(players, plan, rate) {
  const thief = players.find((player) => player.id === plan.thiefId);
  const victim = players.find((player) => player.id === plan.victimId);
  if (!thief?.correct || !victim) return;
  transfer(victim, thief, Math.max(1, Math.floor(victim.balance * rate)));
}

function awardClosingPot(room, players, randomInt) {
  const finalRound = room.round >= (room.settings.questionCount || 1);
  if (!finalRound || !(room.pot > 0)) return;
  if (room.settings.gameMode !== "JACKPOT" && room.settings.gameMode !== "TREASURE") return;
  const correct = players.filter((player) => player.correct);
  const ranked = [...players].sort((a, b) => b.score - a.score || b.balance - a.balance || a.name.localeCompare(b.name));
  const winner = room.settings.gameMode === "JACKPOT" && correct.length ? correct[randomInt(correct.length)] : ranked[0];
  if (!winner) return;
  winner.balance += room.pot;
  winner.change += room.pot;
  winner.eliminated = winner.balance <= 0;
  room.pot = 0;
}

function aliveCount(room) {
  return listPlayers(room).filter((player) => (player.balance || 0) > 0).length;
}

function eliminationEndsMatch(room) {
  return ["LAST_STANDING", "SURVIVAL", "SUDDEN_DEATH", "HEAD_TO_HEAD"].includes(room.settings?.gameMode) && aliveCount(room) <= 1;
}

function anyoneCanPlay(room) {
  return listPlayers(room).some((player) => player.connected && ((player.balance || 0) > 0 || room.roundState?.openToAll));
}

const SETTING_KEYS = ["startingCash", "questionCount", "gameMode", "difficulty", "betSeconds", "questionSeconds", "resultsSeconds", "eliminateAtZero", "categories", "questionTypes", "events", "hangmanLives", "hangmanSeconds", "hangmanDifficulty", "hangmanCategories", "hangmanRewardMultiplier", "hangmanWords", "hangmanPurchases", "hangmanAttacks", "cashEventsEnabled"];
const DISPLAY_KEYS = ["isCustom", "modeLabel"];

function applySettingsUpdate(current, updates, limits) {
  if (!updates || typeof updates !== "object" || Array.isArray(updates)) return { ok: false, message: "Choose valid game settings." };
  const keys = Object.keys(updates).filter((key) => !DISPLAY_KEYS.includes(key));
  const next = { ...current, categories: [...(current.categories || [])], questionTypes: [...(current.questionTypes || [])], hangmanCategories: [...(current.hangmanCategories || [])], events: { ...(current.events || defaultEvents()) } };
  if (!keys.length) return { ok: true, settings: next };
  const unknown = keys.filter((key) => !SETTING_KEYS.includes(key));
  if (unknown.length) return { ok: false, message: `These settings are not supported: ${unknown.join(", ")}.` };
  if (Object.hasOwn(updates, "startingCash") && !limits.startingCash.includes(updates.startingCash)) return { ok: false, message: "Choose a supported starting balance." };
  if (Object.hasOwn(updates, "questionCount") && !limits.questionCount.includes(updates.questionCount)) return { ok: false, message: "Choose a supported number of questions." };
  if (Object.hasOwn(updates, "gameMode")) {
    const mode = normalizeMode(updates.gameMode);
    if (!mode) return { ok: false, message: "Choose a supported game mode." };
    next.gameMode = mode;
    if (!Object.hasOwn(updates, "betSeconds")) {
      if (mode === "SPEED") { next.betSeconds = 5; next.questionSeconds = 7; next.resultsSeconds = 3; }
      else if (mode !== "CUSTOM") { next.betSeconds = 10; next.questionSeconds = 15; next.resultsSeconds = 5; }
    }
    if (mode === "HIGH_ROLLER" && !Object.hasOwn(updates, "startingCash")) next.startingCash = 10000;
  }
  if (Object.hasOwn(updates, "difficulty") && !DIFFICULTIES.includes(updates.difficulty)) return { ok: false, message: "Choose Easy, Medium, Hard, or a mix." };
  if (Object.hasOwn(updates, "betSeconds") && !BET_TIMES.includes(updates.betSeconds)) return { ok: false, message: "Choose a supported betting timer." };
  if (Object.hasOwn(updates, "questionSeconds") && !QUESTION_TIMES.includes(updates.questionSeconds)) return { ok: false, message: "Choose a supported question timer." };
  if (Object.hasOwn(updates, "resultsSeconds") && !RESULT_TIMES.includes(updates.resultsSeconds)) return { ok: false, message: "Choose a supported results timer." };
  if (Object.hasOwn(updates, "eliminateAtZero") && typeof updates.eliminateAtZero !== "boolean") return { ok: false, message: "Elimination must be on or off." };
  if (Object.hasOwn(updates, "categories")) {
    if (!Array.isArray(updates.categories) || updates.categories.some((category) => !CATEGORIES.includes(category))) return { ok: false, message: "Choose categories from the question bank." };
    next.categories = [...new Set(updates.categories)];
  }
  if (Object.hasOwn(updates, "questionTypes")) {
    if (!Array.isArray(updates.questionTypes) || updates.questionTypes.some((type) => !QUESTION_TYPE_IDS.includes(type))) return { ok: false, message: "Choose a supported question type." };
    next.questionTypes = [...new Set(updates.questionTypes)];
  }
  if (Object.hasOwn(updates, "hangmanLives") && !hangman.HANGMAN_LIVES.includes(updates.hangmanLives)) return { ok: false, message: "Choose 4, 6, or 8 Hangman lives." };
  if (Object.hasOwn(updates, "hangmanSeconds") && !hangman.HANGMAN_TIMES.includes(updates.hangmanSeconds)) return { ok: false, message: "Choose a supported Hangman timer." };
  if (Object.hasOwn(updates, "hangmanDifficulty") && !DIFFICULTIES.includes(updates.hangmanDifficulty)) return { ok: false, message: "Choose a Hangman word difficulty." };
  if (Object.hasOwn(updates, "hangmanRewardMultiplier") && !hangman.HANGMAN_MULTIPLIERS.includes(updates.hangmanRewardMultiplier)) return { ok: false, message: "Choose a Hangman reward multiplier." };
  if (Object.hasOwn(updates, "hangmanWords") && !hangman.HANGMAN_WORDS_OPTIONS.includes(updates.hangmanWords)) return { ok: false, message: "Choose 1, 3, 5, 8, 10, or 15 Hangman words." };
  if (Object.hasOwn(updates, "hangmanPurchases") && typeof updates.hangmanPurchases !== "boolean") return { ok: false, message: "Hangman purchases must be on or off." };
  if (Object.hasOwn(updates, "hangmanAttacks") && typeof updates.hangmanAttacks !== "boolean") return { ok: false, message: "Hangman attacks must be on or off." };
  if (Object.hasOwn(updates, "cashEventsEnabled") && typeof updates.cashEventsEnabled !== "boolean") return { ok: false, message: "Cash-powered events must be on or off." };
  if (Object.hasOwn(updates, "hangmanCategories")) {
    if (!Array.isArray(updates.hangmanCategories) || updates.hangmanCategories.some((category) => !hangman.HANGMAN_CATEGORIES.includes(category))) return { ok: false, message: "Choose Hangman categories from the word list." };
    next.hangmanCategories = [...new Set(updates.hangmanCategories)];
  }
  if (Object.hasOwn(updates, "events")) {
    if (!updates.events || typeof updates.events !== "object" || Array.isArray(updates.events)) return { ok: false, message: "Choose valid events." };
    for (const [key, value] of Object.entries(updates.events)) {
      if (!EVENT_IDS.includes(key) || typeof value !== "boolean") return { ok: false, message: "Choose valid events." };
      next.events[key] = value;
    }
  }
  for (const key of ["startingCash", "questionCount", "difficulty", "betSeconds", "questionSeconds", "resultsSeconds", "eliminateAtZero", "hangmanLives", "hangmanSeconds", "hangmanDifficulty", "hangmanRewardMultiplier", "hangmanWords", "hangmanPurchases", "hangmanAttacks", "cashEventsEnabled"]) {
    if (Object.hasOwn(updates, key)) next[key] = updates[key];
  }
  return { ok: true, settings: next };
}

module.exports = {
  MODES,
  MODE_IDS,
  EVENTS,
  EVENT_IDS,
  EVENT_LABELS,
  DIFFICULTIES,
  CATEGORIES,
  QUESTION_TYPES,
  QUESTION_TYPE_IDS,
  questionKind,
  BET_TIMES,
  QUESTION_TIMES,
  RESULT_TIMES,
  REVIVAL_STAKE,
  defaultEvents,
  defaultSettings,
  normalizeMode,
  modeLabel,
  modeCopy,
  isCustomMatch,
  listPlayers,
  desiredDifficulty,
  questionPool,
  timings,
  allowedWagers,
  validateLiveBet,
  mayAnswer,
  blankRoundState,
  eventNotice,
  jackpotAmount,
  applyEvent,
  pickEventId,
  preparePlayers,
  markRoundParticipation,
  lockForcedBets,
  chooseAuctionBidder,
  scoreRound,
  eliminationEndsMatch,
  anyoneCanPlay,
  applySettingsUpdate,
};
