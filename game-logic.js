"use strict";

/**
 * RISK IT authoritative game rules.
 *
 * The WebSocket server should own rooms with createRoomRegistry() and
 * send only publicState to browsers. Never send getInternalState() or the
 * question deck. correctAnswer stays on the server until RESULTS or FINAL.
 *
 * Question shape:
 * { id, question, answers: [4 strings], correctAnswer, category, difficulty }
 * correctAnswer may be the answer text or a 0–3 index, matching questions.js.
 *
 * Client messages may supply playerId, a bet choice, and an answer.
 * Balance, score, host, and correctness are never taken from the client.
 */

const STARTING_BALANCE = 1000;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;
const TOTAL_ROUNDS = 10;
const BET_CHOICES = [50, 100, 250, 500];
const PHASE_MS = {
  BETTING: 10_000,
  QUESTION: 15_000,
  RESULTS: 5_000,
};
const PHASE = {
  LOBBY: "LOBBY",
  BETTING: "BETTING",
  QUESTION: "QUESTION",
  RESULTS: "RESULTS",
  FINAL: "FINAL",
};
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function fail(error) {
  return { ok: false, error };
}

function succeed(room, events = [], extra = {}) {
  return { ok: true, room, events, ...extra };
}

function clone(value) {
  return structuredClone(value);
}

function requireRoom(room) {
  if (!room || typeof room !== "object" || !Array.isArray(room.players)) {
    return fail("INVALID_ROOM");
  }
  return null;
}

function normalizePlayerId(playerId) {
  if (typeof playerId !== "string") return fail("INVALID_PLAYER");
  const id = playerId.trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return fail("INVALID_PLAYER");
  return { ok: true, id };
}

function normalizeName(name) {
  if (typeof name !== "string") return fail("INVALID_NAME");
  const cleaned = name.replace(/[\u0000-\u001F]/g, "").trim().replace(/\s+/g, " ");
  if (cleaned.length < 1 || cleaned.length > 16) return fail("INVALID_NAME");
  return { ok: true, name: cleaned };
}

function normalizeCode(code) {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 6) return null;
  for (const char of normalized) {
    if (!CODE_ALPHABET.includes(char)) return null;
  }
  return normalized;
}

function findPlayer(room, playerId) {
  return room.players.find((player) => player.id === playerId) || null;
}

function makePlayer(id, name, isHost) {
  return {
    id,
    name,
    balance: STARTING_BALANCE,
    score: 0,
    connected: true,
    ready: false,
    isHost: Boolean(isHost),
  };
}

function generateRoomCode(random = Math.random) {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[index] || CODE_ALPHABET[0];
  }
  return code;
}

function createUniqueRoomCode(existingCodes, random = Math.random) {
  const existing = existingCodes instanceof Set ? existingCodes : new Set(existingCodes);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = generateRoomCode(random);
    if (!existing.has(code)) return code;
  }
  const error = new Error("ROOM_CODE_EXHAUSTED");
  error.code = "ROOM_CODE_EXHAUSTED";
  throw error;
}

function normalizeQuestion(question) {
  if (!question || typeof question !== "object") return fail("INVALID_QUESTION");
  if (typeof question.id !== "string" && typeof question.id !== "number") {
    return fail("INVALID_QUESTION");
  }
  const id = String(question.id).trim();
  if (!id || id.length > 64) return fail("INVALID_QUESTION");
  if (typeof question.question !== "string" || question.question.trim() === "") {
    return fail("INVALID_QUESTION");
  }
  if (!Array.isArray(question.answers) || question.answers.length !== 4) {
    return fail("INVALID_QUESTION");
  }
  const answers = [];
  for (const answer of question.answers) {
    if (typeof answer !== "string" || answer.trim() === "") return fail("INVALID_QUESTION");
    answers.push(answer);
  }
  if (new Set(answers).size !== 4) return fail("INVALID_QUESTION");
  const correctAnswer = canonicalCorrectAnswer(answers, question.correctAnswer);
  if (!correctAnswer) return fail("INVALID_QUESTION");
  return {
    ok: true,
    question: {
      id,
      question: question.question.trim(),
      answers,
      correctAnswer,
      category: typeof question.category === "string" && question.category.trim()
        ? question.category.trim()
        : "General Knowledge",
      difficulty: typeof question.difficulty === "string" && question.difficulty.trim()
        ? question.difficulty.trim()
        : "medium",
    },
  };
}

function canonicalCorrectAnswer(answers, correctAnswer) {
  if (typeof correctAnswer === "number" && Number.isInteger(correctAnswer)) {
    return answers[correctAnswer] || null;
  }
  if (typeof correctAnswer === "string" && answers.includes(correctAnswer)) return correctAnswer;
  return null;
}

function publicQuestion(question) {
  return {
    id: question.id,
    question: question.question,
    answers: [...question.answers],
    category: question.category,
    difficulty: question.difficulty,
  };
}

function currentQuestion(room) {
  if (room.questionIndex < 0 || room.questionIndex >= room.deck.length) return null;
  return room.deck[room.questionIndex];
}

function createRoom({
  code,
  hostId,
  hostName,
  now = Date.now(),
  totalRounds = TOTAL_ROUNDS,
} = {}) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return fail("INVALID_ROOM_CODE");
  const id = normalizePlayerId(hostId);
  if (!id.ok) return id;
  const name = normalizeName(hostName);
  if (!name.ok) return name;
  if (!Number.isInteger(totalRounds) || totalRounds < 1 || totalRounds > 50) {
    return fail("INVALID_ROUNDS");
  }

  const room = {
    code: normalizedCode,
    phase: PHASE.LOBBY,
    round: 0,
    totalRounds,
    players: [makePlayer(id.id, name.name, true)],
    deck: [],
    questionIndex: -1,
    bets: {},
    answers: {},
    results: null,
    phaseEndsAt: null,
    winnerIds: [],
    createdAt: now,
  };
  return succeed(room, [{ type: "PLAYER_JOINED", playerId: id.id, reconnected: false }]);
}

function joinRoom(room, { playerId, name } = {}) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;

  const existing = findPlayer(room, id.id);
  if (existing) {
    const next = clone(room);
    findPlayer(next, id.id).connected = true;
    return succeed(next, [{ type: "PLAYER_JOINED", playerId: id.id, reconnected: true }]);
  }

  if (room.phase !== PHASE.LOBBY) return fail("GAME_IN_PROGRESS");
  if (room.players.length >= MAX_PLAYERS) return fail("ROOM_FULL");
  const cleaned = normalizeName(name);
  if (!cleaned.ok) return cleaned;

  const next = clone(room);
  next.players.push(makePlayer(id.id, cleaned.name, false));
  return succeed(next, [{ type: "PLAYER_JOINED", playerId: id.id, reconnected: false }]);
}

function leaveRoom(room, playerId) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;

  const next = clone(room);
  const index = next.players.findIndex((player) => player.id === id.id);
  if (index === -1) return fail("PLAYER_NOT_FOUND");

  const wasHost = next.players[index].isHost;
  next.players.splice(index, 1);
  delete next.bets[id.id];
  delete next.answers[id.id];
  const events = [{ type: "PLAYER_LEFT", playerId: id.id }];

  if (next.players.length === 0) {
    return succeed(next, [...events, { type: "ROOM_EMPTY" }], { empty: true });
  }
  if (wasHost) {
    next.players[0].isHost = true;
    events.push({ type: "HOST_CHANGED", playerId: next.players[0].id });
  }
  return succeed(next, events);
}

function setConnected(room, playerId, connected) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;
  const next = clone(room);
  const player = findPlayer(next, id.id);
  if (!player) return fail("PLAYER_NOT_FOUND");
  player.connected = Boolean(connected);
  return succeed(next, [{
    type: player.connected ? "PLAYER_RECONNECTED" : "PLAYER_DISCONNECTED",
    playerId: id.id,
  }]);
}

function startGame(room, { playerId, questions, now = Date.now() } = {}) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  if (room.phase !== PHASE.LOBBY) return fail("WRONG_PHASE");
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;
  const player = findPlayer(room, id.id);
  if (!player) return fail("PLAYER_NOT_FOUND");
  if (!player.isHost) return fail("NOT_HOST");
  if (room.players.length < MIN_PLAYERS) return fail("NEED_PLAYERS");
  if (!Array.isArray(questions) || questions.length < room.totalRounds) {
    return fail("NOT_ENOUGH_QUESTIONS");
  }

  const deck = [];
  const seen = new Set();
  for (const question of questions) {
    const normalized = normalizeQuestion(question);
    if (!normalized.ok) return normalized;
    if (seen.has(normalized.question.id)) return fail("DUPLICATE_QUESTION");
    seen.add(normalized.question.id);
    deck.push(normalized.question);
    if (deck.length === room.totalRounds) break;
  }

  const next = clone(room);
  next.deck = deck;
  next.questionIndex = 0;
  next.round = 1;
  next.bets = {};
  next.answers = {};
  next.results = null;
  next.winnerIds = [];
  next.phase = PHASE.BETTING;
  next.phaseEndsAt = now + PHASE_MS.BETTING;
  for (const entry of next.players) entry.ready = true;

  return succeed(next, [
    { type: "GAME_STARTED", round: 1, totalRounds: next.totalRounds },
    { type: "ROUND_STARTED", round: 1 },
    { type: "BETTING_STARTED", round: 1, phaseEndsAt: next.phaseEndsAt },
  ]);
}

function resolveWager(choice, balance) {
  if (!Number.isInteger(balance) || balance < 0) return fail("INVALID_BET");
  if (typeof choice === "string") {
    const token = choice.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (token === "ALL_IN") return { ok: true, amount: balance };
    if (!/^\d+$/.test(choice.trim())) return fail("INVALID_BET");
    return resolveWager(Number(choice.trim()), balance);
  }
  if (typeof choice !== "number" || !Number.isInteger(choice)) return fail("INVALID_BET");
  if (!BET_CHOICES.includes(choice)) return fail("INVALID_BET");
  if (choice > balance) return fail("INSUFFICIENT_BALANCE");
  return { ok: true, amount: choice };
}

function placeBet(room, { playerId, choice, now = Date.now() } = {}) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  if (room.phase !== PHASE.BETTING) return fail("WRONG_PHASE");
  if (room.phaseEndsAt == null || now >= room.phaseEndsAt) return fail("PHASE_EXPIRED");
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;
  const player = findPlayer(room, id.id);
  if (!player) return fail("PLAYER_NOT_FOUND");
  if (!player.connected) return fail("PLAYER_DISCONNECTED");
  if (Object.prototype.hasOwnProperty.call(room.bets, id.id)) return fail("BET_LOCKED");

  const wager = resolveWager(choice, player.balance);
  if (!wager.ok) return wager;

  const next = clone(room);
  next.bets[id.id] = wager.amount;
  return succeed(next, [{ type: "PLAYER_BET", playerId: id.id, amount: wager.amount }]);
}

function normalizeAnswer(question, answer) {
  if (typeof answer === "number" && Number.isInteger(answer)) {
    if (answer < 0 || answer >= question.answers.length) return fail("INVALID_ANSWER");
    return { ok: true, answer: question.answers[answer] };
  }
  if (typeof answer !== "string") return fail("INVALID_ANSWER");
  const trimmed = answer.trim();
  const exact = question.answers.find((option) => option === trimmed);
  if (exact) return { ok: true, answer: exact };
  const folded = question.answers.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  if (folded) return { ok: true, answer: folded };
  return fail("INVALID_ANSWER");
}

function submitAnswer(room, { playerId, answer, now = Date.now() } = {}) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  if (room.phase !== PHASE.QUESTION) return fail("WRONG_PHASE");
  if (room.phaseEndsAt == null || now >= room.phaseEndsAt) return fail("PHASE_EXPIRED");
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;
  const player = findPlayer(room, id.id);
  if (!player) return fail("PLAYER_NOT_FOUND");
  if (!player.connected) return fail("PLAYER_DISCONNECTED");
  if (Object.prototype.hasOwnProperty.call(room.answers, id.id)) return fail("DUPLICATE_ANSWER");

  const question = currentQuestion(room);
  if (!question) return fail("INVALID_QUESTION");
  const normalized = normalizeAnswer(question, answer);
  if (!normalized.ok) return normalized;

  const next = clone(room);
  next.answers[id.id] = normalized.answer;
  return succeed(next, [{ type: "PLAYER_ANSWERED", playerId: id.id }]);
}

function winnerIdsFor(room) {
  const top = Math.max(...room.players.map((player) => player.balance));
  return room.players.filter((player) => player.balance === top).map((player) => player.id);
}

function rankedPlayers(room) {
  return [...room.players].sort((a, b) => (
    b.balance - a.balance
    || b.score - a.score
    || a.name.localeCompare(b.name)
    || a.id.localeCompare(b.id)
  ));
}

function beginQuestion(room, now) {
  const next = clone(room);
  for (const player of next.players) {
    if (!Object.prototype.hasOwnProperty.call(next.bets, player.id)) next.bets[player.id] = 0;
  }
  next.answers = {};
  next.phase = PHASE.QUESTION;
  next.phaseEndsAt = now + PHASE_MS.QUESTION;
  const question = currentQuestion(next);
  return succeed(next, [{
    type: "QUESTION_STARTED",
    round: next.round,
    phaseEndsAt: next.phaseEndsAt,
    question: publicQuestion(question),
  }], { advanced: true });
}

function beginResults(room, now) {
  const next = clone(room);
  const question = currentQuestion(next);
  const results = [];
  for (const player of next.players) {
    const wager = Object.prototype.hasOwnProperty.call(next.bets, player.id) ? next.bets[player.id] : 0;
    const answer = Object.prototype.hasOwnProperty.call(next.answers, player.id)
      ? next.answers[player.id]
      : null;
    const correct = answer != null && answer === question.correctAnswer;
    const before = player.balance;
    const rawNext = before + (correct ? wager : -wager);
    player.balance = Math.max(0, rawNext);
    if (correct) player.score += 1;
    results.push({
      playerId: player.id,
      name: player.name,
      wager,
      answer,
      correct,
      delta: player.balance - before,
      balance: player.balance,
      timedOut: answer == null,
    });
  }
  next.results = results;
  next.phase = PHASE.RESULTS;
  next.phaseEndsAt = now + PHASE_MS.RESULTS;
  return succeed(next, [
    { type: "ROUND_ENDED", round: next.round, correctAnswer: question.correctAnswer, results },
    { type: "LEADERBOARD_UPDATED", leaderboard: leaderboard(next) },
  ], { advanced: true });
}

function beginNext(room, now) {
  const next = clone(room);
  if (next.round >= next.totalRounds) {
    next.phase = PHASE.FINAL;
    next.phaseEndsAt = null;
    next.winnerIds = winnerIdsFor(next);
    const board = leaderboard(next);
    return succeed(next, [
      { type: "LEADERBOARD_UPDATED", leaderboard: board },
      { type: "GAME_FINISHED", winnerIds: [...next.winnerIds], winnerId: board[0] ? board[0].id : null },
    ], { advanced: true });
  }

  next.round += 1;
  next.questionIndex += 1;
  next.bets = {};
  next.answers = {};
  next.results = null;
  next.phase = PHASE.BETTING;
  next.phaseEndsAt = now + PHASE_MS.BETTING;
  return succeed(next, [
    { type: "ROUND_STARTED", round: next.round },
    { type: "BETTING_STARTED", round: next.round, phaseEndsAt: next.phaseEndsAt },
  ], { advanced: true });
}

function advance(room, now = Date.now()) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  if (room.phase === PHASE.LOBBY || room.phase === PHASE.FINAL) {
    return succeed(room, [], { advanced: false });
  }
  if (room.phaseEndsAt == null || now < room.phaseEndsAt) {
    return succeed(room, [], { advanced: false });
  }
  if (room.phase === PHASE.BETTING) return beginQuestion(room, now);
  if (room.phase === PHASE.QUESTION) return beginResults(room, now);
  if (room.phase === PHASE.RESULTS) return beginNext(room, now);
  return fail("WRONG_PHASE");
}

function catchUp(room, now = Date.now(), limit = 30) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  let current = room;
  const events = [];
  let steps = 0;
  for (let i = 0; i < limit; i += 1) {
    const result = advance(current, now);
    if (!result.ok) return result;
    if (!result.advanced) {
      return succeed(current, events, { advanced: steps > 0, steps });
    }
    current = result.room;
    events.push(...result.events);
    steps += 1;
  }
  return succeed(current, events, { advanced: true, steps });
}

function returnToLobby(room, { playerId } = {}) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  if (room.phase !== PHASE.FINAL) return fail("WRONG_PHASE");
  const id = normalizePlayerId(playerId);
  if (!id.ok) return id;
  const player = findPlayer(room, id.id);
  if (!player) return fail("PLAYER_NOT_FOUND");
  if (!player.isHost) return fail("NOT_HOST");

  const next = clone(room);
  next.phase = PHASE.LOBBY;
  next.round = 0;
  next.deck = [];
  next.questionIndex = -1;
  next.bets = {};
  next.answers = {};
  next.results = null;
  next.phaseEndsAt = null;
  next.winnerIds = [];
  for (const entry of next.players) {
    entry.balance = STARTING_BALANCE;
    entry.score = 0;
    entry.ready = false;
  }
  return succeed(next, [{ type: "RETURNED_TO_LOBBY" }]);
}

function leaderboard(room) {
  return rankedPlayers(room).map((player, index) => ({
    rank: index + 1,
    id: player.id,
    name: player.name,
    balance: player.balance,
    score: player.score,
    connected: player.connected,
    isHost: player.isHost,
  }));
}

function toPublicState(room, viewerId, now = Date.now()) {
  const invalid = requireRoom(room);
  if (invalid) return invalid;
  const reveal = room.phase === PHASE.RESULTS || room.phase === PHASE.FINAL;
  const showQuestion = room.phase === PHASE.QUESTION || reveal;
  const question = showQuestion ? currentQuestion(room) : null;
  const you = viewerId ? findPlayer(room, viewerId) : null;
  const board = leaderboard(room);
  const winners = room.winnerIds
    .map((id) => findPlayer(room, id))
    .filter(Boolean)
    .map((player) => ({ id: player.id, name: player.name, balance: player.balance }));

  return {
    ok: true,
    state: {
      code: room.code,
      phase: room.phase,
      round: room.round,
      totalRounds: room.totalRounds,
      phaseEndsAt: room.phaseEndsAt,
      serverNow: now,
      playerCount: room.players.length,
      maxPlayers: MAX_PLAYERS,
      hostId: room.players.find((player) => player.isHost)?.id || null,
      you: you
        ? {
          id: you.id,
          name: you.name,
          balance: you.balance,
          score: you.score,
          connected: you.connected,
          ready: you.ready,
          isHost: you.isHost,
          bet: Object.prototype.hasOwnProperty.call(room.bets, you.id) ? room.bets[you.id] : null,
          answer: Object.prototype.hasOwnProperty.call(room.answers, you.id) ? room.answers[you.id] : null,
        }
        : null,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        balance: player.balance,
        score: player.score,
        connected: player.connected,
        ready: player.ready,
        isHost: player.isHost,
      })),
      leaderboard: board,
      question: question ? publicQuestion(question) : null,
      correctAnswer: reveal && question ? question.correctAnswer : null,
      roundResults: reveal ? room.results : null,
      winner: room.phase === PHASE.FINAL && board[0]
        ? { id: board[0].id, name: board[0].name, balance: board[0].balance, score: board[0].score }
        : null,
      winners: room.phase === PHASE.FINAL ? winners : [],
    },
  };
}

function createRoomRegistry(options = {}) {
  const rooms = new Map();
  const random = options.random || Math.random;
  const clock = options.now || Date.now;

  function stamp(result, viewerId) {
    if (!result.ok) return result;
    if (result.empty) {
      return {
        ok: true,
        empty: true,
        events: result.events,
        publicState: null,
      };
    }
    const viewed = toPublicState(result.room, viewerId, clock());
    return {
      ok: true,
      code: result.room.code,
      events: result.events,
      publicState: viewed.ok ? viewed.state : null,
      advanced: result.advanced,
      steps: result.steps,
    };
  }

  return {
    createRoom({ hostId, hostName, totalRounds } = {}) {
      let code;
      try {
        code = createUniqueRoomCode(rooms.keys(), random);
      } catch (error) {
        return fail(error.code || "ROOM_CODE_EXHAUSTED");
      }
      const created = createRoom({
        code,
        hostId,
        hostName,
        now: clock(),
        totalRounds,
      });
      if (!created.ok) return created;
      if (rooms.has(created.room.code)) return fail("DUPLICATE_ROOM_CODE");
      rooms.set(created.room.code, created.room);
      return stamp(created, hostId);
    },

    join(code, { playerId, name } = {}) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = joinRoom(rooms.get(normalized), { playerId, name });
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    leave(code, playerId) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = leaveRoom(rooms.get(normalized), playerId);
      if (!result.ok) return result;
      if (result.empty) rooms.delete(normalized);
      else rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    disconnect(code, playerId) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = setConnected(rooms.get(normalized), playerId, false);
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    reconnect(code, playerId) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = setConnected(rooms.get(normalized), playerId, true);
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    start(code, { playerId, questions } = {}) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = startGame(rooms.get(normalized), { playerId, questions, now: clock() });
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    bet(code, { playerId, choice } = {}) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = placeBet(rooms.get(normalized), { playerId, choice, now: clock() });
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    answer(code, { playerId, answer } = {}) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = submitAnswer(rooms.get(normalized), { playerId, answer, now: clock() });
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    tick(code, at = clock()) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = catchUp(rooms.get(normalized), at);
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, null);
    },

    playAgain(code, playerId) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      const result = returnToLobby(rooms.get(normalized), { playerId });
      if (!result.ok) return result;
      rooms.set(normalized, result.room);
      return stamp(result, playerId);
    },

    getPublicState(code, viewerId, at = clock()) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return fail("ROOM_NOT_FOUND");
      return toPublicState(rooms.get(normalized), viewerId, at);
    },

    getInternalState(code) {
      const normalized = normalizeCode(code);
      if (!normalized || !rooms.has(normalized)) return null;
      return clone(rooms.get(normalized));
    },

    hasRoom(code) {
      const normalized = normalizeCode(code);
      return Boolean(normalized && rooms.has(normalized));
    },
  };
}

module.exports = {
  STARTING_BALANCE,
  MIN_PLAYERS,
  MAX_PLAYERS,
  TOTAL_ROUNDS,
  BET_CHOICES,
  PHASE_MS,
  PHASE,
  CODE_ALPHABET,
  generateRoomCode,
  createUniqueRoomCode,
  normalizeCode,
  createRoom,
  joinRoom,
  leaveRoom,
  setConnected,
  startGame,
  resolveWager,
  placeBet,
  submitAnswer,
  advance,
  catchUp,
  returnToLobby,
  leaderboard,
  toPublicState,
  createRoomRegistry,
};
