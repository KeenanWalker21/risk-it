"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { questions } = require("./questions");
const {
  STARTING_BALANCE,
  MAX_PLAYERS,
  TOTAL_ROUNDS,
  PHASE,
  PHASE_MS,
  CODE_ALPHABET,
  generateRoomCode,
  createUniqueRoomCode,
  createRoom,
  joinRoom,
  leaveRoom,
  setConnected,
  startGame,
  placeBet,
  submitAnswer,
  advance,
  returnToLobby,
  toPublicState,
  createRoomRegistry,
} = require("./game-logic");

function sampleQuestions(count = TOTAL_ROUNDS) {
  return Array.from({ length: count }, (_, index) => ({
    id: `q${index + 1}`,
    question: `Question ${index + 1}?`,
    answers: ["Alpha", "Beta", "Gamma", "Delta"],
    correctAnswer: "Alpha",
    category: "Science",
    difficulty: "easy",
  }));
}

function lobbyWith(names = ["Keenan", "Marcus"]) {
  let room = createRoom({
    code: "X7K92A",
    hostId: "p1",
    hostName: names[0],
    now: 1_000,
  }).room;
  names.slice(1).forEach((name, index) => {
    room = joinRoom(room, { playerId: `p${index + 2}`, name }).room;
  });
  return room;
}

function startTwoPlayer(now = 5_000) {
  const room = lobbyWith();
  return startGame(room, { playerId: "p1", questions: sampleQuestions(), now }).room;
}

test("room creation makes the creator the host with $1000", () => {
  const created = createRoom({ code: "x7k92a", hostId: "p1", hostName: "Keenan", now: 50 });
  assert.equal(created.ok, true);
  assert.equal(created.room.code, "X7K92A");
  assert.equal(created.room.phase, PHASE.LOBBY);
  assert.equal(created.room.players.length, 1);
  assert.equal(created.room.players[0].isHost, true);
  assert.equal(created.room.players[0].balance, STARTING_BALANCE);
  assert.equal(created.room.players[0].score, 0);
  assert.equal(created.room.players[0].connected, true);
  assert.equal(created.events[0].type, "PLAYER_JOINED");
});

test("room codes avoid ambiguous characters and stay unique", () => {
  const code = generateRoomCode(() => 0);
  assert.equal(code, CODE_ALPHABET[0].repeat(6));
  assert.equal(/[IO01]/.test(code), false);

  const first = createUniqueRoomCode([]);
  const second = createUniqueRoomCode([first], () => 0);
  assert.notEqual(first, second);
  assert.throws(
    () => createUniqueRoomCode([CODE_ALPHABET[0].repeat(6)], () => 0),
    (error) => error.code === "ROOM_CODE_EXHAUSTED",
  );
});

test("registry rejects a duplicate active room code", () => {
  let calls = 0;
  const registry = createRoomRegistry({
    random() {
      calls += 1;
      return 0;
    },
    now: () => 10,
  });
  const first = registry.createRoom({ hostId: "host", hostName: "Keenan" });
  assert.equal(first.ok, true);
  const second = registry.createRoom({ hostId: "other", hostName: "James" });
  assert.equal(second.ok, false);
  assert.equal(second.error, "ROOM_CODE_EXHAUSTED");
  assert.equal(calls > 6, true);
});

test("players can join until the room is full, and the joiner is not host", () => {
  let room = createRoom({ code: "ABCDEF", hostId: "p1", hostName: "Keenan" }).room;
  const joined = joinRoom(room, { playerId: "p2", name: "Marcus", isHost: true });
  assert.equal(joined.ok, true);
  assert.equal(joined.room.players.length, 2);
  assert.equal(joined.room.players[1].isHost, false);
  assert.equal(joined.room.players[1].balance, STARTING_BALANCE);

  room = joined.room;
  for (let i = 3; i <= MAX_PLAYERS; i += 1) {
    const next = joinRoom(room, { playerId: `p${i}`, name: `P${i}` });
    assert.equal(next.ok, true);
    room = next.room;
  }
  const overflow = joinRoom(room, { playerId: "extra", name: "Extra" });
  assert.equal(overflow.ok, false);
  assert.equal(overflow.error, "ROOM_FULL");
});

test("rejoining with the same player id restores the existing player", () => {
  let room = lobbyWith();
  room = setConnected(room, "p2", false).room;
  const before = room.players.length;
  const rejoined = joinRoom(room, { playerId: "p2", name: "Someone Else" });
  assert.equal(rejoined.ok, true);
  assert.equal(rejoined.room.players.length, before);
  assert.equal(rejoined.room.players[1].name, "Marcus");
  assert.equal(rejoined.room.players[1].connected, true);
  assert.equal(rejoined.events[0].reconnected, true);
});

test("new players cannot join after the game starts", () => {
  const room = startTwoPlayer();
  const late = joinRoom(room, { playerId: "p3", name: "Tyler" });
  assert.equal(late.ok, false);
  assert.equal(late.error, "GAME_IN_PROGRESS");
});

test("only the host can start, and a game needs two players", () => {
  const solo = createRoom({ code: "PLAYAA", hostId: "p1", hostName: "Keenan" }).room;
  assert.equal(startGame(solo, { playerId: "p1", questions: sampleQuestions() }).error, "NEED_PLAYERS");

  const room = lobbyWith();
  const denied = startGame(room, { playerId: "p2", questions: sampleQuestions(), isHost: true });
  assert.equal(denied.ok, false);
  assert.equal(denied.error, "NOT_HOST");

  const started = startGame(room, { playerId: "p1", questions: sampleQuestions(), now: 20_000 });
  assert.equal(started.ok, true);
  assert.equal(started.room.phase, PHASE.BETTING);
  assert.equal(started.room.round, 1);
  assert.equal(started.room.phaseEndsAt, 20_000 + PHASE_MS.BETTING);
  assert.equal(started.events.some((event) => event.type === "GAME_STARTED"), true);
});

test("starting requires a full unique question deck and ignores client balances", () => {
  const room = lobbyWith();
  const short = startGame(room, { playerId: "p1", questions: sampleQuestions(9) });
  assert.equal(short.error, "NOT_ENOUGH_QUESTIONS");

  const duplicate = sampleQuestions();
  duplicate[1] = { ...duplicate[0] };
  assert.equal(startGame(room, { playerId: "p1", questions: duplicate }).error, "DUPLICATE_QUESTION");

  const broken = sampleQuestions();
  broken[0] = { ...broken[0], correctAnswer: "Not an option" };
  assert.equal(startGame(room, { playerId: "p1", questions: broken }).error, "INVALID_QUESTION");
});

test("valid bets lock, invalid bets are rejected, and all-in uses server balance", () => {
  let room = startTwoPlayer(10_000);
  const valid = placeBet(room, { playerId: "p1", choice: 250, balance: 1, now: 10_000 });
  assert.equal(valid.ok, true);
  assert.equal(valid.room.bets.p1, 250);
  assert.equal(valid.room.players[0].balance, STARTING_BALANCE);

  const locked = placeBet(valid.room, { playerId: "p1", choice: 50, now: 10_500 });
  assert.equal(locked.error, "BET_LOCKED");

  const tooMuch = placeBet(valid.room, { playerId: "p2", choice: 5000, now: 11_000 });
  assert.equal(tooMuch.error, "INVALID_BET");

  const poor = clonePlayerBalance(valid.room, "p2", 40);
  assert.equal(placeBet(poor, { playerId: "p2", choice: 50, now: 11_000 }).error, "INSUFFICIENT_BALANCE");
  const allIn = placeBet(poor, { playerId: "p2", choice: "all in", now: 11_000 });
  assert.equal(allIn.ok, true);
  assert.equal(allIn.room.bets.p2, 40);

  const broke = clonePlayerBalance(valid.room, "p2", 0);
  const zero = placeBet(broke, { playerId: "p2", choice: "ALL_IN", now: 11_000 });
  assert.equal(zero.ok, true);
  assert.equal(zero.room.bets.p2, 0);
  assert.equal(placeBet(broke, { playerId: "p2", choice: 50, now: 11_000 }).error, "INSUFFICIENT_BALANCE");
});

test("bets cannot be placed after the betting timer", () => {
  const room = startTwoPlayer(10_000);
  const late = placeBet(room, { playerId: "p1", choice: 100, now: room.phaseEndsAt });
  assert.equal(late.error, "PHASE_EXPIRED");
});

test("correct and incorrect answers update money without going negative", () => {
  let room = startTwoPlayer(10_000);
  room = placeBet(room, { playerId: "p1", choice: 250, now: 10_100 }).room;
  room = placeBet(room, { playerId: "p2", choice: "ALL-IN", now: 10_200 }).room;
  room = advance(room, room.phaseEndsAt).room;
  assert.equal(room.phase, PHASE.QUESTION);

  const correct = submitAnswer(room, { playerId: "p1", answer: "alpha", now: room.phaseEndsAt - 1 });
  assert.equal(correct.ok, true);
  assert.equal(correct.room.answers.p1, "Alpha");
  const duplicate = submitAnswer(correct.room, { playerId: "p1", answer: "Beta", now: room.phaseEndsAt - 1 });
  assert.equal(duplicate.error, "DUPLICATE_ANSWER");
  assert.equal(duplicate.ok, false);

  room = correct.room;
  room = submitAnswer(room, { playerId: "p2", answer: 2, now: room.phaseEndsAt - 1 }).room;
  assert.equal(room.answers.p2, "Gamma");

  const results = advance(room, room.phaseEndsAt);
  assert.equal(results.room.phase, PHASE.RESULTS);
  assert.equal(results.room.players[0].balance, 1250);
  assert.equal(results.room.players[0].score, 1);
  assert.equal(results.room.players[1].balance, 0);
  assert.equal(results.room.players[1].score, 0);
  assert.equal(results.events.some((event) => event.type === "LEADERBOARD_UPDATED"), true);
});

test("a missed bet wagers zero and a missed answer is incorrect", () => {
  let room = startTwoPlayer(10_000);
  room = placeBet(room, { playerId: "p1", choice: 100, now: 10_100 }).room;
  room = advance(room, room.phaseEndsAt).room;
  assert.equal(room.bets.p2, 0);
  room = submitAnswer(room, { playerId: "p1", answer: "Beta", now: 10_200 }).room;
  room = advance(room, room.phaseEndsAt).room;
  assert.equal(room.players[0].balance, 900);
  assert.equal(room.players[1].balance, 1000);
  assert.equal(room.results[1].timedOut, true);
  assert.equal(room.results[1].correct, false);
});

test("rounds advance to the next question and then to a server-side winner", () => {
  let room = startTwoPlayer(0);
  for (let round = 1; round <= TOTAL_ROUNDS; round += 1) {
    assert.equal(room.phase, PHASE.BETTING);
    assert.equal(room.round, round);
    room = placeBet(room, { playerId: "p1", choice: 50, now: room.phaseEndsAt - 1 }).room;
    room = placeBet(room, { playerId: "p2", choice: 50, now: room.phaseEndsAt - 1 }).room;
    const early = advance(room, room.phaseEndsAt - 1);
    assert.equal(early.advanced, false);
    room = advance(room, room.phaseEndsAt).room;
    assert.equal(room.phase, PHASE.QUESTION);
    room = submitAnswer(room, { playerId: "p1", answer: "Alpha", now: room.phaseEndsAt - 1 }).room;
    room = submitAnswer(room, { playerId: "p2", answer: "Beta", now: room.phaseEndsAt - 1 }).room;
    room = advance(room, room.phaseEndsAt).room;
    assert.equal(room.phase, PHASE.RESULTS);
    room = advance(room, room.phaseEndsAt).room;
  }

  assert.equal(room.phase, PHASE.FINAL);
  assert.equal(room.players[0].balance, 1500);
  assert.equal(room.players[1].balance, 500);
  assert.equal(room.winnerIds[0], "p1");
  const finished = toPublicState(room, "p2", 999);
  assert.equal(finished.state.winner.name, "Keenan");
  assert.equal(finished.state.leaderboard[0].balance, 1500);
  assert.equal(finished.state.leaderboard[1].name, "Marcus");
});

test("public question state hides the correct answer until results", () => {
  let room = startTwoPlayer(1_000);
  const betting = toPublicState(room, "p1", 1_000);
  assert.equal(betting.state.question, null);
  assert.equal(JSON.stringify(betting.state).includes("Alpha"), false);

  room = advance(room, room.phaseEndsAt).room;
  const asking = toPublicState(room, "p1", room.phaseEndsAt - PHASE_MS.QUESTION);
  assert.deepEqual(Object.keys(asking.state.question).sort(), [
    "answers",
    "category",
    "difficulty",
    "id",
    "question",
  ]);
  assert.equal(asking.state.correctAnswer, null);
  assert.equal(asking.state.roundResults, null);
  assert.equal(JSON.stringify(asking.state).includes("correctAnswer"), true);
  assert.equal(asking.state.question.answers.includes(room.deck[0].correctAnswer), true);
  assert.equal(Object.hasOwn(asking.state.question, "correctAnswer"), false);

  room = submitAnswer(room, { playerId: "p1", answer: 0, now: room.phaseEndsAt - 1 }).room;
  const afterAnswer = toPublicState(room, "p1");
  assert.equal(afterAnswer.state.correctAnswer, null);
  assert.equal(afterAnswer.state.you.answer, "Alpha");

  room = advance(room, room.phaseEndsAt).room;
  const revealed = toPublicState(room, "p2");
  assert.equal(revealed.state.correctAnswer, "Alpha");
  assert.equal(revealed.state.roundResults[0].correct, true);
});

test("disconnect keeps the seat, and only the host can play again", () => {
  let room = startTwoPlayer(2_000);
  const disconnected = setConnected(room, "p2", false);
  assert.equal(disconnected.ok, true);
  assert.equal(disconnected.room.players.length, 2);
  assert.equal(disconnected.room.players[1].balance, STARTING_BALANCE);
  assert.equal(placeBet(disconnected.room, { playerId: "p2", choice: 50, now: 2_100 }).error, "PLAYER_DISCONNECTED");

  room = disconnected.room;
  room.phase = PHASE.FINAL;
  assert.equal(returnToLobby(room, { playerId: "p2" }).error, "NOT_HOST");
  const again = returnToLobby(room, { playerId: "p1" });
  assert.equal(again.ok, true);
  assert.equal(again.room.phase, PHASE.LOBBY);
  assert.equal(again.room.players[0].balance, STARTING_BALANCE);
  assert.equal(again.room.players[1].balance, STARTING_BALANCE);
  assert.equal(again.room.deck.length, 0);
});

test("leaving transfers host and an empty room is removed", () => {
  const registry = createRoomRegistry({ random: () => 0.5, now: () => 1 });
  const created = registry.createRoom({ hostId: "p1", hostName: "Keenan" });
  const code = created.publicState.code;
  assert.equal(registry.join(code, { playerId: "p2", name: "James" }).ok, true);
  const left = registry.leave(code, "p1");
  assert.equal(left.publicState.hostId, "p2");
  assert.equal(left.publicState.players.length, 1);
  const emptied = registry.leave(code, "p2");
  assert.equal(emptied.empty, true);
  assert.equal(registry.hasRoom(code), false);
});

test("registry plays a scored round without leaking the deck", () => {
  const registry = createRoomRegistry({ random: () => 0.25, now: () => 0 });
  const created = registry.createRoom({ hostId: "p1", hostName: "Keenan" });
  const code = created.code;
  assert.equal(registry.join(code, { playerId: "p2", name: "Tyler" }).ok, true);
  assert.equal(registry.start(code, { playerId: "p2", questions: sampleQuestions() }).error, "NOT_HOST");
  const started = registry.start(code, { playerId: "p1", questions: sampleQuestions() });
  assert.equal(started.ok, true);
  assert.equal(registry.bet(code, { playerId: "p1", choice: 100 }).publicState.you.balance, 1000);
  registry.bet(code, { playerId: "p2", choice: 100 });
  const internal = registry.getInternalState(code);
  registry.tick(code, internal.phaseEndsAt);
  const answered = registry.answer(code, { playerId: "p1", answer: "Alpha" });
  assert.equal(answered.publicState.correctAnswer, null);
  registry.answer(code, { playerId: "p2", answer: "Delta" });
  const asking = registry.getInternalState(code);
  const results = registry.tick(code, asking.phaseEndsAt);
  assert.equal(results.publicState.phase, PHASE.RESULTS);
  const view = registry.getPublicState(code, "p1");
  assert.equal(view.state.players.find((player) => player.id === "p1").balance, 1100);
  assert.equal(view.state.players.find((player) => player.id === "p2").balance, 900);
  assert.equal(Object.hasOwn(view.state, "deck"), false);
});

test("the shared question bank scores an indexed correct answer", () => {
  const room = lobbyWith();
  const started = startGame(room, { playerId: "p1", questions, now: 0 });
  assert.equal(started.ok, true);
  const first = started.room.deck[0];
  const source = questions.find((question) => question.id === first.id);
  assert.equal(first.correctAnswer, source.answers[source.correctAnswer]);
  let current = placeBet(started.room, { playerId: "p1", choice: 100, now: 1 }).room;
  current = placeBet(current, { playerId: "p2", choice: 100, now: 1 }).room;
  current = advance(current, current.phaseEndsAt).room;
  current = submitAnswer(current, { playerId: "p1", answer: source.correctAnswer, now: current.phaseEndsAt - 1 }).room;
  current = advance(current, current.phaseEndsAt).room;
  assert.equal(current.players[0].balance, 1100);
  assert.equal(current.players[0].score, 1);
  const hidden = toPublicState(started.room, "p1");
  assert.equal(hidden.state.correctAnswer, null);
});

function clonePlayerBalance(room, playerId, balance) {
  const next = structuredClone(room);
  next.players.find((player) => player.id === playerId).balance = balance;
  return next;
}
