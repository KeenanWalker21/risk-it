const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { questions } = require('../questions');
const rules = require('../match-rules');

test('broke players sit out, and jackpot or revival can bring them back', () => {
  const room = {
    settings: rules.defaultSettings(2),
    round: 1,
    pot: 0,
    clues: [],
    question: { question: 'Sample?', answers: ['A', 'B', 'C', 'D'], correctAnswer: 1, category: 'Science' },
    players: [
      { id: 'broke', name: 'Broke', balance: 0, score: 0, connected: true, satOut: true, bet: null, answer: 1 },
      { id: 'rich', name: 'Rich', balance: 1000, score: 0, connected: true, satOut: false, bet: 100, answer: 0 },
    ],
  };
  assert.equal(rules.mayAnswer(room.players[0], room), false);
  assert.equal(rules.validateLiveBet(room.players[0], room, 50).error, 'SPECTATING');
  room.roundState = rules.blankRoundState();
  assert.equal(rules.applyEvent(room, 'REVIVAL', () => 0), true);
  assert.equal(room.players[0].balance, 500);
  room.players[0].balance = 0;
  room.roundState = rules.blankRoundState();
  rules.applyEvent(room, 'JACKPOT', () => 4);
  assert.equal(room.roundState.jackpotAmount, 14000);
  assert.equal(room.roundState.openToAll, true);
  rules.markRoundParticipation(room);
  assert.equal(room.players[0].satOut, false);
  room.players[0].answer = 1;
  room.players[1].answer = 0;
  rules.scoreRound(room, () => 0);
  assert.equal(room.players[0].balance, 14000);
  assert.equal(room.players[1].balance, 1000);
});

test('modes change difficulty, wagers, and sudden-death elimination', () => {
  assert.equal(rules.desiredDifficulty({ gameMode: 'SURVIVAL', questionCount: 9, difficulty: 'ANY' }, 1), 'EASY');
  assert.equal(rules.desiredDifficulty({ gameMode: 'SURVIVAL', questionCount: 9, difficulty: 'ANY' }, 4), 'MEDIUM');
  assert.equal(rules.desiredDifficulty({ gameMode: 'SURVIVAL', questionCount: 9, difficulty: 'ANY' }, 7), 'HARD');
  assert.equal(rules.desiredDifficulty({ gameMode: 'CLASSIC', difficulty: 'HARD' }, 2), 'HARD');
  const high = rules.allowedWagers({ balance: 10000 }, { settings: { gameMode: 'HIGH_ROLLER' }, roundState: {} });
  assert.deepEqual(high, [500, 1000, 2500, 5000, 10000]);
  const room = {
    settings: { ...rules.defaultSettings(1), gameMode: 'SUDDEN_DEATH' },
    round: 1,
    pot: 0,
    question: { correctAnswer: 0, category: 'History', question: 'When?' },
    roundState: rules.blankRoundState(),
    players: [{ id: 'a', name: 'A', balance: 800, score: 0, connected: true, satOut: false, bet: 50, answer: 1 }],
  };
  rules.scoreRound(room, () => 0);
  assert.equal(room.players[0].balance, 0);
  assert.equal(room.players[0].eliminated, true);
  assert.equal(rules.normalizeMode('SPEED'), 'SPEED');
  assert.equal(rules.normalizeMode('NOT_A_MODE'), null);
});

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
function client(url) {
  const ws = new WebSocket(url), messages = [], waiters = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    messages.push(message);
    const index = waiters.findIndex(waiter => waiter.predicate(message));
    if (index >= 0) waiters.splice(index, 1)[0].resolve(message);
  });
  const next = (predicate, timeout = 5000) => {
    const previous = messages.find(predicate);
    if (previous) return Promise.resolve(previous);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve: value => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => { const i = waiters.indexOf(waiter); if (i >= 0) waiters.splice(i, 1); reject(new Error('Timed out waiting for server message')); }, timeout);
      waiters.push(waiter);
    });
  };
  return { ws, next, send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })), open: new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); }) };
}
function startServer(t, port, env) {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(() => child.kill());
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (output.includes(`:${port}`)) return resolve(child);
      if (child.exitCode !== null) return reject(new Error(output || 'server exited'));
      if (Date.now() - started > 5000) return reject(new Error(`Server did not start: ${output}`));
      setTimeout(poll, 30);
    };
    poll();
  });
}

test('a player at zero cannot bet the next round', async t => {
  const port = await freePort();
  await startServer(t, port);
  const url = `ws://127.0.0.1:${port}`;
  const host = client(url);
  const guest = client(url);
  t.after(() => { for (const socket of [host.ws, guest.ws]) if (socket && socket.readyState < WebSocket.CLOSING) socket.close(); });
  await Promise.all([host.open, guest.open]);
  host.send('CREATE', { name: 'Host' });
  const created = await host.next(message => message.type === 'WELCOME');
  guest.send('JOIN', { name: 'Guest', code: created.room.code });
  await guest.next(message => message.type === 'WELCOME');
  host.send('UPDATE_SETTINGS', { settings: { questionCount: 5 } });
  await host.next(message => message.type === 'STATE' && message.room.settings.questionCount === 5);
  host.send('START');
  await host.next(message => message.type === 'STATE' && message.room.phase === 'BETTING');
  host.send('BET', { amount: 50 });
  guest.send('BET', { amount: 1000 });
  const question = await host.next(message => message.type === 'STATE' && message.room.phase === 'QUESTION');
  const bank = questions.find(item => item.question === question.room.question.question);
  host.send('ANSWER', { answer: bank.correctAnswer });
  guest.send('ANSWER', { answer: (bank.correctAnswer + 1) % 4 });
  const scored = await guest.next(message => message.type === 'STATE' && message.room.phase === 'RESULTS');
  assert.equal(scored.room.players.find(player => player.name === 'Guest').balance, 0);
  const nextRound = await guest.next(message => message.type === 'STATE' && message.room.phase === 'BETTING' && message.room.round === 2);
  assert.equal(nextRound.room.players.find(player => player.name === 'Guest').spectating, true);
  guest.send('BET', { amount: 50 });
  assert.equal((await guest.next(message => message.type === 'ERROR' && message.code === 'SPECTATING')).code, 'SPECTATING');
});

test('jackpot lets every connected player answer and pays the winner', async t => {
  const port = await freePort();
  await startServer(t, port, { RISKIT_FORCE_EVENT: 'JACKPOT' });
  const url = `ws://127.0.0.1:${port}`;
  const host = client(url);
  const guest = client(url);
  t.after(() => { for (const socket of [host.ws, guest.ws]) if (socket && socket.readyState < WebSocket.CLOSING) socket.close(); });
  await Promise.all([host.open, guest.open]);
  host.send('CREATE', { name: 'Host' });
  const created = await host.next(message => message.type === 'WELCOME');
  guest.send('JOIN', { name: 'Guest', code: created.room.code });
  await guest.next(message => message.type === 'WELCOME');
  host.send('START');
  const question = await host.next(message => message.type === 'STATE' && message.room.phase === 'QUESTION');
  assert.equal(question.room.roundEvent.id, 'JACKPOT');
  assert.ok(question.room.roundEvent.jackpotAmount >= 10000 && question.room.roundEvent.jackpotAmount <= 100000);
  const bank = questions.find(item => item.question === question.room.question.question);
  host.send('ANSWER', { answer: bank.correctAnswer });
  guest.send('ANSWER', { answer: (bank.correctAnswer + 1) % 4 });
  const scored = await host.next(message => message.type === 'STATE' && message.room.phase === 'RESULTS');
  const winner = scored.room.players.find(player => player.name === 'Host');
  const loser = scored.room.players.find(player => player.name === 'Guest');
  assert.equal(winner.balance, 1000 + question.room.roundEvent.jackpotAmount);
  assert.equal(loser.balance, 1000);
});
