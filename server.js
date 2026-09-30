const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questions } = require('./questions');

const PORT = Number(process.env.PORT || 3000);
const FAST_TEST = process.env.NODE_ENV !== 'production' && process.env.RISKIT_TEST_FAST === '1';
const BET_SECONDS = FAST_TEST ? 1 : 10;
const QUESTION_SECONDS = FAST_TEST ? 1 : 15;
const RESULTS_SECONDS = FAST_TEST ? 1 : 5;
const ROUNDS = FAST_TEST ? 1 : 10;
const MAX_PLAYERS = 12;
const STARTING_CASH_OPTIONS = [500, 1000, 2500, 5000, 10000];
const QUESTION_COUNT_OPTIONS = FAST_TEST ? [1, 5, 10, 15, 20, 25] : [5, 10, 15, 20, 25];
const DEFAULT_SETTINGS = { startingCash: 1000, questionCount: ROUNDS, gameMode: 'CLASSIC' };
const rooms = new Map();
const clients = new Set();

function id() { return crypto.randomBytes(16).toString('hex'); }
function roomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do { code = Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join(''); } while (rooms.has(code));
  return code;
}
function sortedPlayers(room) { return [...room.players.values()].sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name)); }
function customMatch(settings) {
  return settings.startingCash !== 1000 || settings.questionCount !== 10 || settings.gameMode !== 'CLASSIC';
}
function publicRoom(room, viewerId) {
  const q = room.question;
  return {
    code: room.code, phase: room.phase, round: room.round, totalRounds: room.settings.questionCount,
    deadline: room.deadline, serverNow: Date.now(), hostId: room.hostId, viewerId,
    settings: { ...room.settings, isCustom: customMatch(room.settings) },
    players: sortedPlayers(room).map(p => ({ id: p.id, name: p.name, balance: p.balance, score: p.score, connected: p.connected, ready: p.connected, isHost: p.id === room.hostId, hasBet: p.bet !== null, hasAnswered: p.answer !== null, bet: p.id === viewerId ? p.bet : undefined, answer: room.phase === 'RESULTS' ? p.answer : undefined, correct: room.phase === 'RESULTS' ? p.correct : undefined, change: room.phase === 'RESULTS' ? p.change : undefined })),
    question: q && room.phase !== 'BETTING' ? { id: q.id, question: q.question, answers: q.answers, category: q.category, difficulty: q.difficulty } : (q ? { category: q.category, difficulty: q.difficulty } : null),
    result: room.phase === 'RESULTS' ? { correctAnswer: q.correctAnswer, correctText: q.answers[q.correctAnswer] } : null,
    winnerId: room.phase === 'FINAL' ? sortedPlayers(room)[0]?.id : null,
    lastEvent: room.lastEvent || null
  };
}
function send(socket, obj) { if (!socket.closed) socket.send(JSON.stringify(obj)); }
function broadcast(room) {
  for (const player of room.players.values()) if (player.socket && !player.socket.closed) send(player.socket, { type: 'STATE', room: publicRoom(room, player.id) });
}
function event(room, type, detail = {}) { room.lastEvent = { type, ...detail }; broadcast(room); }
function chooseQuestion(room) {
  let pool = questions.filter(q => !room.usedQuestions.has(q.id));
  if (!pool.length) { room.usedQuestions.clear(); pool = questions; }
  const q = pool[crypto.randomInt(pool.length)]; room.usedQuestions.add(q.id); return q;
}
function connectedPlayers(room) { return [...room.players.values()].filter(p => p.connected); }
function enterPhase(room, phase, seconds) {
  clearTimeout(room.timer); room.phase = phase; room.deadline = Date.now() + seconds * 1000;
  room.timer = setTimeout(() => advance(room), seconds * 1000); room.timer.unref?.();
}
function startRound(room) {
  room.round += 1; room.question = chooseQuestion(room);
  for (const p of room.players.values()) { p.bet = null; p.answer = null; p.correct = null; p.change = 0; }
  enterPhase(room, 'BETTING', BET_SECONDS); event(room, 'ROUND_STARTED', { round: room.round });
}
function advance(room) {
  if (room.phase === 'BETTING') {
    enterPhase(room, 'QUESTION', QUESTION_SECONDS); event(room, 'QUESTION_STARTED', { round: room.round });
  } else if (room.phase === 'QUESTION') {
    for (const p of room.players.values()) {
      const wager = p.bet || 0;
      p.correct = p.answer !== null && p.answer === room.question.correctAnswer;
      p.change = p.correct ? wager : -wager;
      p.balance = Math.max(0, p.balance + p.change);
      if (p.correct) p.score += 1;
    }
    enterPhase(room, 'RESULTS', RESULTS_SECONDS); event(room, 'ROUND_ENDED', { round: room.round });
  } else if (room.phase === 'RESULTS') {
    if (room.round >= room.settings.questionCount) { clearTimeout(room.timer); room.phase = 'FINAL'; room.deadline = null; event(room, 'GAME_FINISHED'); }
    else startRound(room);
  }
}
function finishEarlyIfReady(room) {
  if (room.phase === 'BETTING' && connectedPlayers(room).every(p => p.bet !== null)) advance(room);
  if (room.phase === 'QUESTION' && connectedPlayers(room).every(p => p.answer !== null)) advance(room);
}
function validClientId(value) { return typeof value === 'string' && /^[a-f0-9-]{32,36}$/i.test(value) ? value : null; }
function reject(socket, code, message) { send(socket, { type: 'ERROR', code, message }); }
function sanitizeName(input) {
  if (typeof input !== 'string') return null;
  const name = input.trim().replace(/[<>\u0000-\u001f]/g, '').slice(0, 18);
  return name.length >= 1 ? name : null;
}
function handleMessage(socket, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch { return reject(socket, 'BAD_JSON', 'That message was not valid JSON.'); }
  if (!msg || typeof msg.type !== 'string') return reject(socket, 'BAD_MESSAGE', 'Message type is required.');

  if (msg.type === 'CREATE') {
    const name = sanitizeName(msg.name); if (!name) return reject(socket, 'BAD_NAME', 'Choose a name between 1 and 18 characters.');
    if (socket.roomCode && socket.playerId) disconnect(socket, true);
    const code = roomCode(), playerId = id(), token = id(), clientId = validClientId(msg.clientId) || id();
    const player = { id: playerId, token, clientId, name, balance: DEFAULT_SETTINGS.startingCash, score: 0, connected: true, bet: null, answer: null, correct: null, change: 0, socket };
    const room = { code, phase: 'LOBBY', round: 0, deadline: null, hostId: playerId, players: new Map([[playerId, player]]), kickedTokens: new Set(), kickedClientIds: new Set(), settings: { ...DEFAULT_SETTINGS }, usedQuestions: new Set(), question: null, lastEvent: null };
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
      player.socket = socket; player.connected = true;
    } else {
      if (room.phase !== 'LOBBY') return reject(socket, 'GAME_IN_PROGRESS', 'This game has already started. Reconnect with your saved player token.');
      if (room.players.size >= MAX_PLAYERS) return reject(socket, 'ROOM_FULL', 'This room is full.');
      player = { id: id(), token: id(), clientId: clientId || id(), name, balance: room.settings.startingCash, score: 0, connected: true, bet: null, answer: null, correct: null, change: 0, socket };
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
    for (const p of room.players.values()) { p.balance = room.settings.startingCash; p.score = 0; }
    event(room, 'GAME_STARTED'); startRound(room); return;
  }
  if (msg.type === 'UPDATE_SETTINGS') {
    if (player.id !== room.hostId) return reject(socket, 'NOT_HOST', 'Only the host can change game settings.');
    if (room.phase !== 'LOBBY') return reject(socket, 'SETTINGS_LOCKED', 'Game settings lock when the game starts.');
    if (!msg.settings || typeof msg.settings !== 'object' || Array.isArray(msg.settings)) return reject(socket, 'INVALID_SETTINGS', 'Choose valid game settings.');
    const updates = msg.settings;
    if (!Object.keys(updates).length || Object.keys(updates).some(key => !['startingCash', 'questionCount'].includes(key))) return reject(socket, 'INVALID_SETTINGS', 'One or more settings are not supported.');
    if (Object.hasOwn(updates, 'startingCash') && !STARTING_CASH_OPTIONS.includes(updates.startingCash)) return reject(socket, 'INVALID_SETTINGS', 'Choose a supported starting balance.');
    if (Object.hasOwn(updates, 'questionCount') && !QUESTION_COUNT_OPTIONS.includes(updates.questionCount)) return reject(socket, 'INVALID_SETTINGS', 'Choose a supported number of questions.');
    room.settings = { ...room.settings, ...updates };
    event(room, 'SETTINGS_UPDATED', { settings: { ...room.settings, isCustom: customMatch(room.settings) } }); return;
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
    for (const p of room.players.values()) { p.balance = room.settings.startingCash; p.score = 0; p.bet = null; p.answer = null; p.correct = null; p.change = 0; }
    room.usedQuestions.clear(); room.round = 0; event(room, 'GAME_RESTARTED'); startRound(room); return;
  }
  if (msg.type === 'BET') {
    if (room.phase !== 'BETTING') return reject(socket, 'WRONG_PHASE', 'Betting is closed.');
    if (player.bet !== null) return reject(socket, 'BET_LOCKED', 'Your bet is already locked.');
    const amount = msg.amount;
    if (!Number.isInteger(amount) || amount < 0 || amount > player.balance || (amount > 0 && ![50, 100, 250, 500].includes(amount) && amount !== player.balance)) return reject(socket, 'INVALID_BET', 'Choose a listed bet or an all-in amount within your balance.');
    player.bet = amount; event(room, 'PLAYER_BET', { playerName: player.name }); finishEarlyIfReady(room); return;
  }
  if (msg.type === 'ANSWER') {
    if (room.phase !== 'QUESTION') return reject(socket, 'WRONG_PHASE', 'The question is not accepting answers.');
    if (player.answer !== null) return reject(socket, 'ANSWER_LOCKED', 'Your answer is already locked.');
    if (!Number.isInteger(msg.answer) || msg.answer < 0 || msg.answer > 3) return reject(socket, 'INVALID_ANSWER', 'Choose one of the four answers.');
    player.answer = msg.answer; event(room, 'PLAYER_ANSWERED', { playerName: player.name }); finishEarlyIfReady(room); return;
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
