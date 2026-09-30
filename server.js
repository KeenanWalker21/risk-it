const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questions } = require('./questions');
const { createChatGuard } = require('./chat-filter');
const { createAccountStore } = require('./accounts');
const rules = require('./match-rules');
const hangman = require('./hangman');
const powerups = require('./powerups');
const animations = require('./public/animations/registry');

const PORT = Number(process.env.PORT || 3000);
const FAST_TEST = process.env.NODE_ENV !== 'production' && process.env.RISKIT_TEST_FAST === '1';
const BET_SECONDS = FAST_TEST ? 1 : 10;
const QUESTION_SECONDS = FAST_TEST ? 1 : 15;
const RESULTS_SECONDS = FAST_TEST ? 1 : 5;
const ROUNDS = FAST_TEST ? 1 : 10;
const MAX_PLAYERS = 12;
const STARTING_CASH_OPTIONS = [500, 1000, 2500, 5000, 10000];
const QUESTION_COUNT_OPTIONS = FAST_TEST ? [1, 5, 10, 15, 20, 25] : [5, 10, 15, 20, 25];
const DEFAULT_SETTINGS = rules.defaultSettings(ROUNDS);
const rooms = new Map();
const clients = new Set();
let accountStore = null;
try { accountStore = createAccountStore(); }
catch (error) { console.error('Accounts storage failed to open'); }

function id() { return crypto.randomBytes(16).toString('hex'); }
function roomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join(''); } while (rooms.has(code));
  return code;
}
function sortedPlayers(room) { return [...room.players.values()].sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name)); }
function publicRoom(room, viewerId) {
  const q = room.question;
  const viewer = room.players.get(viewerId);
  const letters = ['A', 'B', 'C', 'D'];
  const privateNote = viewer?.role === 'IMPOSTER' && room.phase === 'QUESTION' && q
    ? `Imposter intel: ${letters[q.correctAnswer]}. ${q.answers[q.correctAnswer]}`
    : null;
  return {
    code: room.code, phase: room.phase, round: room.round, totalRounds: room.settings.gameMode === 'HANGMAN' ? (room.settings.hangmanWords || 3) : room.settings.questionCount,
    deadline: room.deadline, serverNow: Date.now(), hostId: room.hostId, viewerId,
    settings: { ...room.settings, categories: [...(room.settings.categories || [])], questionTypes: [...(room.settings.questionTypes || [])], hangmanCategories: [...(room.settings.hangmanCategories || [])], events: { ...room.settings.events }, isCustom: rules.isCustomMatch(room.settings), modeLabel: rules.modeLabel(room.settings.gameMode) },
    players: sortedPlayers(room).map(p => ({ id: p.id, name: p.name, balance: p.balance, score: p.score, connected: p.connected, ready: p.connected, isHost: p.id === room.hostId, spectating: !!p.satOut, eliminated: !!p.eliminated, team: p.team || null, shielded: (p.armed?.shield || 0) > 0, lives: p.puzzle?.lives ?? null, maxLives: p.puzzle?.maxLives ?? null, solvedWord: !!p.puzzle?.solved, placement: p.puzzle?.place ?? null, hasBet: p.bet !== null, hasAnswered: p.answer !== null, bet: p.id === viewerId ? p.bet : undefined, answer: room.phase === 'RESULTS' ? p.answer : undefined, correct: room.phase === 'RESULTS' ? p.correct : undefined, change: room.phase === 'RESULTS' ? p.change : undefined })),
    question: q && room.phase !== 'BETTING' ? { id: q.id, question: q.question, answers: q.answers, category: q.category, difficulty: q.difficulty } : (q ? { category: q.category, difficulty: q.difficulty } : null),
    result: room.phase === 'RESULTS' && q ? { correctAnswer: q.correctAnswer, correctText: q.answers[q.correctAnswer] } : null,
    winnerId: room.phase === 'FINAL' ? sortedPlayers(room)[0]?.id : null,
    roundEvent: rules.eventNotice(room.roundState, room.phase),
    pot: room.pot || 0,
    clues: (room.clues || []).slice(-6),
    viewerWagers: viewer && room.phase === 'BETTING' ? rules.allowedWagers(viewer, room) : [],
    viewerCanAnswer: !!(viewer && room.phase === 'QUESTION' && rules.mayAnswer(viewer, room)),
    privateNote,
    viewerHangman: hangman.viewerHangman(room, viewer),
    shop: viewer ? hangman.shopOffers(viewer, room.settings, room.phase) : [],
    powerups: viewer ? powerups.publicView(viewer, room) : null,
    chat: room.chat || [],
    lastEvent: room.lastEvent || null
  };
}
function send(socket, obj) { if (!socket.closed) socket.send(JSON.stringify(obj)); }
function broadcast(room) {
  for (const player of room.players.values()) if (player.socket && !player.socket.closed) send(player.socket, { type: 'STATE', room: publicRoom(room, player.id) });
}
function event(room, type, detail = {}) { room.lastEvent = { type, noticeId: crypto.randomBytes(4).toString('hex'), ...detail }; broadcast(room); }
function cue(room, input) {
  const animation = animations.buildCue(input || {});
  if (!animation) return null;
  for (const player of room.players.values()) if (player.socket && !player.socket.closed) send(player.socket, { type: 'ANIMATION', animation });
  return animation;
}
function roundCue(room) {
  const state = room.roundState;
  if (!state?.id || !animations.EVENT_ANIMATIONS[state.id]) return;
  const players = rules.listPlayers(room);
  const named = (id) => players.find((player) => player.id === id);
  const input = { type: state.id, description: state.detail || undefined, metadata: {} };
  if (state.jackpotAmount) input.amount = state.jackpotAmount;
  if (state.id === 'CASH_DROP') input.amount = 250;
  if (state.heist) {
    input.playerId = state.heist.thiefId; input.playerName = named(state.heist.thiefId)?.name || null;
    input.targetPlayerId = state.heist.victimId; input.targetName = named(state.heist.victimId)?.name || null;
  }
  if (state.steal) {
    input.playerId = state.steal.thiefId; input.playerName = named(state.steal.thiefId)?.name || null;
    input.targetPlayerId = state.steal.victimId; input.targetName = named(state.steal.victimId)?.name || null;
  }
  const marked = state.crownId || state.bountyId;
  if (marked && (state.id === 'BOUNTY' || state.id === 'KINGS_CROWN' || state.id === 'TAX_COLLECTOR')) {
    input.targetPlayerId = marked; input.targetName = named(marked)?.name || null;
  }
  cue(room, input);
}
function flushPowerupCues(room) {
  for (const block of room.shieldLog || []) {
    cue(room, { type: 'POWER_SHIELD_BLOCK', playerId: block.playerId, playerName: block.playerName, description: `${block.playerName} blocked it.` });
  }
  room.shieldLog = [];
  for (const flight of room.cashFlights || []) {
    cue(room, {
      type: 'CASH_FLIGHT', playerId: flight.toId, playerName: flight.toName, targetPlayerId: flight.fromId, targetName: flight.fromName,
      amount: flight.amount, metadata: { travel: 'to-player' }, description: `${flight.toName} took $${flight.amount} from ${flight.fromName}.`,
    });
  }
  room.cashFlights = [];
  for (const scored of rules.listPlayers(room)) {
    for (const note of scored.resolvedPowerups || []) cue(room, { type: note.type, playerId: scored.id, playerName: scored.name, amount: note.amount, description: note.description });
    scored.resolvedPowerups = [];
  }
}
function connectedPlayers(room) { return [...room.players.values()].filter(p => p.connected); }
function enterPhase(room, phase, seconds) {
  clearTimeout(room.timer); room.phase = phase; room.deadline = Date.now() + seconds * 1000;
  room.timer = setTimeout(() => advance(room), seconds * 1000); room.timer.unref?.();
}
function finishGame(room) {
  clearTimeout(room.timer); room.phase = 'FINAL'; room.deadline = null; event(room, 'GAME_FINISHED');
}
function dealQuestion(room) {
  if (!questions.some(question => !room.usedQuestions.has(question.id))) room.usedQuestions.clear();
  const pool = rules.questionPool(questions, room.usedQuestions, room.settings, room.round);
  const picked = pool[crypto.randomInt(pool.length)];
  room.usedQuestions.add(picked.id);
  room.question = picked;
}
function startRound(room) {
  room.round += 1;
  room.roundState = rules.blankRoundState();
  if (room.lightningLeft > 0) { room.roundState.lightning = true; room.lightningLeft -= 1; }
  const eventId = rules.pickEventId(room.settings, { round: room.round, totalRounds: room.settings.questionCount, fast: FAST_TEST, force: process.env.RISKIT_FORCE_EVENT || '' });
  if (eventId) {
    const keepLightning = room.roundState.lightning;
    if (!rules.applyEvent(room, eventId)) { room.roundState = rules.blankRoundState(); room.roundState.lightning = keepLightning; }
    else roundCue(room);
    flushPowerupCues(room);
  }
  rules.markRoundParticipation(room);
  if (!rules.anyoneCanPlay(room)) return finishGame(room);
  dealQuestion(room);
  rules.lockForcedBets(room);
  const clock = rules.timings(room.settings, room.roundState, FAST_TEST);
  if (room.roundState.skipBetting) { enterPhase(room, 'QUESTION', clock.question); event(room, 'QUESTION_STARTED', { round: room.round }); return; }
  enterPhase(room, 'BETTING', clock.betting); event(room, 'ROUND_STARTED', { round: room.round });
  const needed = rules.listPlayers(room).filter(player => player.connected && !player.satOut && player.balance > 0);
  if (needed.length && needed.every(player => player.bet !== null)) advance(room);
}
function advance(room) {
  if (room.phase === 'BETTING') {
    rules.chooseAuctionBidder(room);
    const clock = rules.timings(room.settings, room.roundState, FAST_TEST);
    enterPhase(room, 'QUESTION', clock.question); event(room, 'QUESTION_STARTED', { round: room.round });
  } else if (room.phase === 'QUESTION') {
    rules.scoreRound(room);
    flushPowerupCues(room);
    for (const scored of rules.listPlayers(room)) {
      if (!scored.change) continue;
      const jackpotWin = room.roundState?.jackpotAmount && scored.change === room.roundState.jackpotAmount && scored.correct;
      if (jackpotWin) cue(room, { type: 'JACKPOT', playerId: scored.id, playerName: scored.name, amount: scored.change, description: `${scored.name} claimed the jackpot.` });
      else cue(room, { type: scored.change > 0 ? 'CASH_GAIN' : 'CASH_LOSS', playerId: scored.id, playerName: scored.name, amount: Math.abs(scored.change) });
    }
    const clock = rules.timings(room.settings, room.roundState, FAST_TEST);
    enterPhase(room, 'RESULTS', clock.results); event(room, 'ROUND_ENDED', { round: room.round });
  } else if (room.phase === 'RESULTS') {
    if (room.round >= room.settings.questionCount || rules.eliminationEndsMatch(room)) finishGame(room);
    else startRound(room);
  } else if (room.phase === 'HANGMAN') {
    enterPhase(room, 'HANGMAN_RESULT', FAST_TEST ? 1 : 5); event(room, 'HANGMAN_ENDED', { round: room.round });
  } else if (room.phase === 'HANGMAN_RESULT') {
    if (room.round >= (room.settings.hangmanWords || 3)) finishGame(room);
    else startHangmanRound(room);
  }
}
function finishEarlyIfReady(room) {
  const players = rules.listPlayers(room);
  if (room.phase === 'BETTING') {
    const needed = players.filter(player => player.connected && !player.satOut && player.balance > 0);
    if (needed.length && needed.every(player => player.bet !== null)) advance(room);
  } else if (room.phase === 'QUESTION') {
    const needed = players.filter(player => rules.mayAnswer(player, room));
    if (!needed.length || needed.every(player => player.answer !== null)) advance(room);
  } else if (room.phase === 'HANGMAN' && hangman.hangmanSettled(room)) advance(room);
}
function resetMatch(room) {
  const prepared = rules.preparePlayers(room.players.values(), room.settings);
  room.teams = prepared.teams; room.pot = prepared.pot; room.clues = prepared.clues; room.lightningLeft = 0; room.round = 0; room.roundState = null; room.puzzle = null; room.purchased = new Set(); room.usedQuestions.clear();
}
function beginMatch(room) {
  resetMatch(room);
  if (room.settings.gameMode === 'HANGMAN') startHangmanRound(room);
  else startRound(room);
}
function startHangmanRound(room) {
  room.round += 1;
  room.purchased = new Set();
  const picked = hangman.pickWord(room.usedQuestions, room.settings, (max) => crypto.randomInt(max), process.env.NODE_ENV === 'production' ? '' : (process.env.RISKIT_FORCE_WORD || ''));
  room.usedQuestions.add(picked.word);
  room.puzzle = { word: picked.word, category: picked.category, hint: picked.hint, difficulty: picked.difficulty, solvedCount: 0 };
  const lives = room.settings.hangmanLives || 6;
  for (const player of room.players.values()) player.puzzle = hangman.blankPuzzle(lives);
  let seconds = FAST_TEST ? 30 : (room.settings.hangmanSeconds || 60);
  if (room.lightningLeft > 0) { room.lightningLeft -= 1; seconds = Math.max(10, Math.floor(seconds / 2)); }
  enterPhase(room, 'HANGMAN', seconds);
  event(room, 'HANGMAN_STARTED', { round: room.round });
}
function validClientId(value) { return typeof value === 'string' && /^[a-f0-9-]{32,36}$/i.test(value) ? value : null; }
function reject(socket, code, message) {
  send(socket, { type: 'ERROR', code, message });
  const animation = animations.failureCue(code, message);
  if (animation) send(socket, { type: 'ANIMATION', animation });
}
function sanitizeName(input) {
  if (typeof input !== 'string') return null;
  const name = input.trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 18);
  return name.length >= 1 ? name : null;
}
const ACCOUNT_MESSAGES = {
  INVALID_USERNAME: 'Usernames are 3–16 letters, numbers, or underscores.',
  INVALID_EMAIL: 'Enter a valid email address.',
  WEAK_PASSWORD: 'Passwords need 8 to 72 characters.',
  USERNAME_TAKEN: 'That username is already taken.',
  EMAIL_TAKEN: 'That email is already registered.',
  BAD_LOGIN: 'Username or password is incorrect.',
  ACCOUNT_UNAVAILABLE: 'Accounts are unavailable right now. You can still play as a guest.',
};
function handleAccount(socket, msg) {
  if (!accountStore) return reject(socket, 'ACCOUNT_UNAVAILABLE', ACCOUNT_MESSAGES.ACCOUNT_UNAVAILABLE);
  try {
    if (msg.type === 'SIGNUP' || msg.type === 'LOGIN') {
      const result = msg.type === 'SIGNUP'
        ? accountStore.signup({ username: msg.username, email: msg.email, password: msg.password })
        : accountStore.login({ username: msg.username, password: msg.password });
      if (!result.ok) return reject(socket, result.error, ACCOUNT_MESSAGES[result.error] || 'Account request failed.');
      socket.account = result.user;
      send(socket, { type: 'ACCOUNT', sessionToken: result.sessionToken, user: result.user });
      return;
    }
    if (msg.type === 'LOGOUT') {
      accountStore.logout(msg.sessionToken);
      socket.account = null;
      send(socket, { type: 'LOGGED_OUT' });
      return;
    }
    if (msg.type === 'SESSION') {
      const user = accountStore.session(msg.sessionToken);
      socket.account = user;
      if (!user) return send(socket, { type: 'LOGGED_OUT' });
      send(socket, { type: 'ACCOUNT', user });
    }
  } catch (error) {
    console.error('Account request failed');
    reject(socket, 'ACCOUNT_UNAVAILABLE', ACCOUNT_MESSAGES.ACCOUNT_UNAVAILABLE);
  }
}
function handleMessage(socket, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return reject(socket, 'BAD_JSON', 'That message was not valid JSON.'); }
  if (!msg || typeof msg.type !== 'string') return reject(socket, 'BAD_MESSAGE', 'Message type is required.');
  if (msg.type === 'SIGNUP' || msg.type === 'LOGIN' || msg.type === 'LOGOUT' || msg.type === 'SESSION') return handleAccount(socket, msg);

  if (msg.type === 'CREATE') {
    const name = sanitizeName(msg.name); if (!name) return reject(socket, 'BAD_NAME', 'Choose a name between 1 and 18 characters.');
    if (socket.roomCode && socket.playerId) disconnect(socket, true);
    const code = roomCode(), playerId = id(), token = id(), clientId = validClientId(msg.clientId) || id();
    const player = { id: playerId, token, clientId, name, userId: socket.account?.id || null, balance: DEFAULT_SETTINGS.startingCash, score: 0, connected: true, bet: null, answer: null, correct: null, change: 0, socket };
    const room = { code, phase: 'LOBBY', round: 0, deadline: null, hostId: playerId, players: new Map([[playerId, player]]), kickedTokens: new Set(), kickedClientIds: new Set(), settings: { ...DEFAULT_SETTINGS, categories: [...DEFAULT_SETTINGS.categories], questionTypes: [...DEFAULT_SETTINGS.questionTypes], hangmanCategories: [...DEFAULT_SETTINGS.hangmanCategories], events: { ...DEFAULT_SETTINGS.events } }, usedQuestions: new Set(), question: null, chat: [], chatGuard: createChatGuard(), pot: 0, clues: [], teams: null, lightningLeft: 0, roundState: null, lastEvent: null };
    rooms.set(code, room); socket.playerId = playerId; socket.roomCode = code;
    send(socket, { type: 'WELCOME', token, playerId, clientId, room: publicRoom(room, playerId) }); return;
  }
  if (msg.type === 'JOIN') {
    const code = typeof msg.code === 'string' ? msg.code.trim().toUpperCase() : '';
    const room = rooms.get(code); if (!room) return reject(socket, 'ROOM_NOT_FOUND', 'Room code not found.');
    const name = sanitizeName(msg.name); if (!name) return reject(socket, 'BAD_NAME', 'Choose a name between 1 and 18 characters.');
    const clientId = validClientId(msg.clientId);
    if ((typeof msg.token === 'string' && room.kickedTokens.has(msg.token)) || (clientId && room.kickedClientIds.has(clientId))) return reject(socket, 'KICKED', 'The host removed you from this room.');
    const boundRoom = rooms.get(socket.roomCode);
    const boundPlayer = boundRoom?.players.get(socket.playerId);
    if (boundPlayer?.socket === socket && (socket.roomCode !== code || boundPlayer.token !== msg.token)) disconnect(socket, true);
    let player = [...room.players.values()].find(p => typeof msg.token === 'string' && p.token === msg.token);
    if (player) {
      if (player.socket && player.socket !== socket) player.socket.close(1000, 'Reconnected elsewhere');
      player.socket = socket; player.connected = true; if (socket.account?.id) player.userId = socket.account.id;
    } else {
      if (room.phase !== 'LOBBY') return reject(socket, 'GAME_IN_PROGRESS', 'This game has already started. Reconnect with your saved player token.');
      if (room.players.size >= MAX_PLAYERS) return reject(socket, 'ROOM_FULL', 'This room is full.');
      player = { id: id(), token: id(), clientId: clientId || id(), name, userId: socket.account?.id || null, balance: room.settings.startingCash, score: 0, connected: true, bet: null, answer: null, correct: null, change: 0, socket };
      room.players.set(player.id, player);
    }
    socket.playerId = player.id; socket.roomCode = code;
    send(socket, { type: 'WELCOME', token: player.token, playerId: player.id, clientId: player.clientId, room: publicRoom(room, player.id) });
    event(room, 'PLAYER_JOINED', { playerName: player.name }); return;
  }

  const room = rooms.get(socket.roomCode); const player = room?.players.get(socket.playerId);
  if (!room || !player || player.socket !== socket) return reject(socket, 'NOT_IN_ROOM', 'Create or join a room first.');
  if (msg.type === 'START') {
    if (player.id !== room.hostId) return reject(socket, 'NOT_HOST', 'Only the host can start the game.');
    if (room.phase !== 'LOBBY') return reject(socket, 'WRONG_PHASE', 'The game has already started.');
    if (connectedPlayers(room).length < 2) return reject(socket, 'NEED_PLAYERS', 'At least two connected players are needed.');
    if (room.settings.gameMode === 'HEAD_TO_HEAD' && connectedPlayers(room).length !== 2) return reject(socket, 'NEED_PLAYERS', 'Head-to-Head needs exactly two connected players.');
    event(room, 'GAME_STARTED'); beginMatch(room); return;
  }
  if (msg.type === 'UPDATE_SETTINGS') {
    if (player.id !== room.hostId) return reject(socket, 'NOT_HOST', 'Only the host can change game settings.');
    if (room.phase !== 'LOBBY') return reject(socket, 'SETTINGS_LOCKED', 'Game settings lock when the game starts.');
    if (!msg.settings || typeof msg.settings !== 'object' || Array.isArray(msg.settings)) return reject(socket, 'INVALID_SETTINGS', 'Choose valid game settings.');
    const updated = rules.applySettingsUpdate(room.settings, msg.settings, { startingCash: STARTING_CASH_OPTIONS, questionCount: QUESTION_COUNT_OPTIONS });
    if (!updated.ok) return reject(socket, 'INVALID_SETTINGS', updated.message);
    room.settings = updated.settings;
    if (room.settings.powerupsEnabled === false) powerups.clearPlayers(room);
    event(room, 'SETTINGS_UPDATED', { settings: { ...room.settings, isCustom: rules.isCustomMatch(room.settings) } }); return;
  }
  if (msg.type === 'KICK') {
    if (player.id !== room.hostId) return reject(socket, 'NOT_HOST', 'Only the host can remove players.');
    if (room.phase !== 'LOBBY') return reject(socket, 'KICK_LOCKED', 'Players can only be removed from the lobby.');
    const target = typeof msg.targetId === 'string' ? room.players.get(msg.targetId) : null;
    if (!target) return reject(socket, 'PLAYER_NOT_FOUND', 'That player is no longer in the room.');
    if (target.id === room.hostId) return reject(socket, 'CANNOT_KICK_HOST', 'The host cannot remove themselves.');
    room.kickedTokens.add(target.token); room.kickedClientIds.add(target.clientId);
    room.players.delete(target.id);
    if (target.socket && !target.socket.closed) { send(target.socket, { type: 'KICKED', message: 'The host removed you from this room.' }); target.socket.close(1008, 'Removed by host'); }
    event(room, 'PLAYER_KICKED', { playerName: target.name }); return;
  }
  if (msg.type === 'PLAY_AGAIN') {
    if (player.id !== room.hostId) return reject(socket, 'NOT_HOST', 'Only the host can start another game.');
    if (room.phase !== 'FINAL') return reject(socket, 'WRONG_PHASE', 'The current game is not finished.');
    event(room, 'GAME_RESTARTED'); beginMatch(room); return;
  }
  if (msg.type === 'BET') {
    if (room.phase !== 'BETTING') return reject(socket, 'WRONG_PHASE', 'Betting is closed.');
    if (player.bet !== null) return reject(socket, 'BET_LOCKED', 'Your bet is already locked.');
    if (room.settings.gameMode === 'TEAM_BATTLE' && rules.listPlayers(room).some(mate => mate.team === player.team && mate.bet !== null)) return reject(socket, 'BET_LOCKED', 'Your team wager is already locked.');
    const wager = rules.validateLiveBet(player, room, msg.amount);
    if (!wager.ok) return reject(socket, wager.error, wager.message);
    if (room.settings.gameMode === 'TEAM_BATTLE') { for (const mate of rules.listPlayers(room)) if (mate.team === player.team) mate.bet = wager.amount; }
    else player.bet = wager.amount;
    event(room, 'PLAYER_BET', { playerName: player.name }); finishEarlyIfReady(room); return;
  }
  if (msg.type === 'ANSWER') {
    if (room.phase !== 'QUESTION') return reject(socket, 'WRONG_PHASE', 'The question is not accepting answers.');
    if (!rules.mayAnswer(player, room)) return reject(socket, player.satOut ? 'SPECTATING' : 'NOT_BIDDER', player.satOut ? 'You are out of cash and can only spectate.' : 'Only the high bidder can answer this question.');
    if (player.answer !== null) return reject(socket, 'ANSWER_LOCKED', 'Your answer is already locked.');
    if (!Number.isInteger(msg.answer) || msg.answer < 0 || msg.answer > 3) return reject(socket, 'INVALID_ANSWER', 'Choose one of the four answers.');
    player.answer = msg.answer; event(room, 'PLAYER_ANSWERED', { playerName: player.name }); finishEarlyIfReady(room); return;
  }
  if (msg.type === 'HANGMAN_GUESS' || msg.type === 'HANGMAN_HINT' || msg.type === 'HANGMAN_LETTER' || msg.type === 'HANGMAN_ATTACK') {
    const target = typeof msg.targetId === 'string' ? room.players.get(msg.targetId) : null;
    const result = msg.type === 'HANGMAN_GUESS' ? hangman.guessLetter(room, player, msg.letter)
      : msg.type === 'HANGMAN_HINT' ? hangman.buyHint(room, player)
      : msg.type === 'HANGMAN_LETTER' ? hangman.buyLetter(room, player, (max) => crypto.randomInt(max))
      : hangman.attackLife(room, player, target);
    if (!result.ok) return reject(socket, result.error, result.message);
    const shared = result.message.startsWith('You solved') ? `${player.name} solved the word.` : msg.type === 'HANGMAN_GUESS' ? `${player.name} guessed a letter.` : msg.type === 'HANGMAN_HINT' ? `${player.name} bought a hint.` : msg.type === 'HANGMAN_LETTER' ? `${player.name} bought a letter.` : result.message;
    event(room, msg.type, { message: shared });
    send(socket, { type: 'NOTICE', message: result.message });
    const who = { playerId: player.id, playerName: player.name };
    if (msg.type === 'HANGMAN_HINT') cue(room, { ...who, type: 'BUY_HINT' });
    if (msg.type === 'HANGMAN_LETTER') cue(room, { ...who, type: 'BUY_LETTER' });
    if (msg.type === 'HANGMAN_ATTACK' && target && !result.blocked) {
      cue(room, { ...who, type: 'REMOVE_LIFE', targetPlayerId: target.id, targetName: target.name });
      if (target.puzzle?.lives <= 0) cue(room, { type: 'ELIMINATED', playerId: target.id, playerName: target.name });
    }
    flushPowerupCues(room);
    if (result.solved) cue(room, { ...who, type: 'WORD_SOLVED', amount: result.reward, metadata: { place: result.place } });
    else if (msg.type === 'HANGMAN_GUESS' && result.lives === 0) cue(room, { ...who, type: 'ELIMINATED' });
    if (room.phase === 'HANGMAN' && hangman.hangmanSettled(room)) advance(room);
    return;
  }
  if (msg.type === 'BUY_EVENT') {
    const target = typeof msg.targetId === 'string' ? room.players.get(msg.targetId) : null;
    const result = hangman.purchaseEvent(room, player, msg.eventId, target, (max) => crypto.randomInt(max));
    if (!result.ok) return reject(socket, result.error, result.message);
    event(room, 'EVENT_PURCHASED', { message: result.message });
    if (result.cue) cue(room, result.cue);
    flushPowerupCues(room);
    return;
  }
  if (msg.type === 'BUY_POWERUP') {
    const result = powerups.purchase(room, player, msg.powerupId);
    if (!result.ok) return reject(socket, result.error, result.message);
    event(room, 'POWERUP_PURCHASED', { message: result.message });
    return;
  }
  if (msg.type === 'ACTIVATE_POWERUP') {
    const target = typeof msg.targetId === 'string' ? room.players.get(msg.targetId) : null;
    const result = powerups.activate(room, player, msg.powerupId, target, (max) => crypto.randomInt(max));
    if (!result.ok) return reject(socket, result.error, result.message);
    event(room, 'POWERUP_ACTIVATED', { message: result.message });
    if (result.privateMessage) send(socket, { type: 'NOTICE', message: result.privateMessage });
    if (result.cue) cue(room, result.cue);
    flushPowerupCues(room);
    return;
  }
  if (msg.type === 'CHAT') {
    if (!room.chatGuard) room.chatGuard = createChatGuard();
    if (!room.chat) room.chat = [];
    const accepted = room.chatGuard.accept({ playerId: player.id, text: msg.text });
    if (!accepted.ok) {
      const messages = {
        EMPTY_MESSAGE: 'Type a message first.',
        MESSAGE_TOO_LONG: 'Messages can be up to 200 characters.',
        RATE_LIMITED: 'Slow down a little.',
        SPAM: 'That message was already sent.',
      };
      return reject(socket, accepted.error, messages[accepted.error] || 'Message was not sent.');
    }
    room.chat.push({ id: id(), playerId: player.id, name: player.name, text: accepted.text, at: Date.now() });
    if (room.chat.length > 40) room.chat.shift();
    event(room, 'CHAT_MESSAGE', { playerName: player.name });
    return;
  }
  if (msg.type === 'LEAVE') { disconnect(socket, true); return; }
  reject(socket, 'UNKNOWN_ACTION', 'That action is not available.');
}

function disconnect(socket, leaving = false) {
  const room = rooms.get(socket.roomCode); const player = room?.players.get(socket.playerId);
  if (!player || player.socket !== socket) return;
  player.socket = null; player.connected = false;
  if (player.id === room.hostId && !(leaving && room.phase === 'LOBBY')) {
    const nextHost = [...room.players.values()].find(p => p.connected && p.id !== player.id);
    if (nextHost) room.hostId = nextHost.id;
  }
  if (leaving && room.phase === 'LOBBY') {
    room.players.delete(player.id);
    if (!room.players.size) { clearTimeout(room.timer); rooms.delete(room.code); return; }
    if (player.id === room.hostId) room.hostId = [...room.players.keys()][0];
  }
  event(room, 'PLAYER_LEFT', { playerName: player.name });
}

function frame(payload, opcode = 1) {
  const body = Buffer.from(payload); let header;
  if (body.length < 126) { header = Buffer.from([0x80 | opcode, body.length]); }
  else if (body.length < 65536) { header = Buffer.alloc(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(body.length, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(body.length), 2); }
  return Buffer.concat([header, body]);
}
function createSocket(rawSocket) {
  const socket = { raw: rawSocket, buffer: Buffer.alloc(0), closed: false, send(data) { if (!this.closed) this.raw.write(frame(data)); }, close(code = 1000, reason = '') {
    if (this.closed) return; this.closed = true;
    const reasonBytes = Buffer.from(reason).subarray(0, 120); const payload = Buffer.alloc(2 + reasonBytes.length); payload.writeUInt16BE(code); reasonBytes.copy(payload, 2);
    this.raw.write(frame(payload, 8)); this.raw.end(); clients.delete(this);
  }};
  clients.add(socket);
  rawSocket.on('data', chunk => {
    socket.buffer = Buffer.concat([socket.buffer, chunk]);
    while (socket.buffer.length >= 2) {
      const b0 = socket.buffer[0], b1 = socket.buffer[1], opcode = b0 & 0x0f, masked = !!(b1 & 0x80);
      let len = b1 & 0x7f, offset = 2;
      if (len === 126) { if (socket.buffer.length < 4) return; len = socket.buffer.readUInt16BE(2); offset = 4; }
      else if (len === 127) { if (socket.buffer.length < 10) return; const large = socket.buffer.readBigUInt64BE(2); if (large > 1_000_000n) return socket.close(1009, 'Message too large'); len = Number(large); offset = 10; }
      if (!masked) return socket.close(1002, 'Client frames must be masked');
      if (socket.buffer.length < offset + 4 + len) return;
      const mask = socket.buffer.subarray(offset, offset + 4); offset += 4;
      const payload = Buffer.from(socket.buffer.subarray(offset, offset + len)); socket.buffer = socket.buffer.subarray(offset + len);
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
      if (opcode === 8) { socket.close(); return; }
      if (opcode === 9) { rawSocket.write(frame(payload, 10)); continue; }
      if (opcode === 1) handleMessage(socket, payload.toString('utf8'));
    }
  });
  rawSocket.on('close', () => { if (!socket.closed) socket.closed = true; clients.delete(socket); disconnect(socket); });
  rawSocket.on('error', () => { if (!socket.closed) socket.closed = true; clients.delete(socket); disconnect(socket); });
  return socket;
}

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const target = path.resolve(__dirname, 'public', relative);
  if (!target.startsWith(path.resolve(__dirname, 'public') + path.sep) && target !== path.resolve(__dirname, 'public', 'index.html')) { res.writeHead(403).end('Forbidden'); return; }
  fs.readFile(target, (err, data) => {
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  });
});
server.on('upgrade', (req, rawSocket) => {
  const key = req.headers['sec-websocket-key'];
  if (req.headers.upgrade?.toLowerCase() !== 'websocket' || !key) { rawSocket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  rawSocket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  createSocket(rawSocket);
});
if (require.main === module) server.listen(PORT, '0.0.0.0', () => console.log(`RISK IT is live at http://localhost:${server.address().port}`));

module.exports = { server, rooms, roomCode, publicRoom, advance };
