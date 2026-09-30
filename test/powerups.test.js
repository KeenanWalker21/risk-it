const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const rules = require('../match-rules');
const hangman = require('../hangman');
const powerups = require('../powerups');
const animations = require('../public/animations/registry');

function player(id, name, extra = {}) {
  return { id, name, connected: true, balance: 1000, score: 0, satOut: false, bet: null, answer: null, change: 0, ...extra };
}

test('powerup inventory, rewards, shields, and mode rules stay server-owned', () => {
  const settings = rules.defaultSettings(10);
  assert.equal(settings.powerupsEnabled, true);
  assert.equal(rules.isCustomMatch(settings), false);
  assert.equal(rules.isCustomMatch({ ...settings, powerupsEnabled: false }), true);
  assert.match(rules.applySettingsUpdate(settings, { powerups: ['shield'] }, { startingCash: [1000], questionCount: [10] }).message, /powerups/);

  const ada = player('ada', 'Ada');
  const bea = player('bea', 'Bea');
  const room = { phase: 'BETTING', settings, players: new Map([['ada', ada], ['bea', bea]]), roundState: rules.blankRoundState(), question: { correctAnswer: 1, answers: ['A', 'B', 'C', 'D'] }, pot: 0, round: 1 };
  assert.equal(powerups.grant(ada, 'SHIELD', settings).count, 1);
  assert.equal(powerups.grant(ada, 'SHIELD', settings).count, 2);
  assert.equal(powerups.grant(ada, 'SHIELD', settings).count, 3);
  assert.equal(powerups.grant(ada, 'SHIELD', settings).ok, false);
  assert.equal(ada.balance, 1000);
  assert.equal(powerups.purchase(room, ada, 'EXTRA_LIFE').error, 'WRONG_MODE');
  assert.equal(ada.balance, 1000);
  assert.equal(powerups.activate(room, ada, 'EXTRA_LIFE').error, 'WRONG_MODE');
  room.settings = { ...settings, powerupsEnabled: false };
  assert.equal(powerups.purchase(room, ada, 'HINT').error, 'POWERUPS_OFF');
  room.settings = settings;
  ada.balance = 100;
  assert.equal(powerups.purchase(room, ada, 'HINT').error, 'INSUFFICIENT_CASH');
  assert.equal(ada.powerups.SHIELD, 3);
  ada.balance = 1000;

  powerups.grant(ada, 'STEAL', settings);
  assert.equal(powerups.activate(room, ada, 'STEAL', ada).error, 'INVALID_TARGET');
  assert.equal(ada.powerups.STEAL, 1);
  assert.equal(ada.powerups.SHIELD, 3);
  assert.equal(powerups.activate(room, bea, 'STEAL', ada).error, 'NOT_OWNED');
  assert.equal(bea.balance, 1000);

  assert.equal(powerups.activate(room, ada, 'SHIELD').ok, true);
  assert.equal(ada.powerups.SHIELD, 2);
  assert.equal(ada.armed.shield, 1);
  assert.equal(powerups.grant(bea, 'STEAL', settings).ok, true);
  const blocked = powerups.activate(room, bea, 'STEAL', ada);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.cue, null);
  assert.equal(ada.balance, 1000);
  assert.equal(bea.balance, 1000);
  assert.equal(bea.powerups.STEAL, 0);
  assert.equal(ada.armed.shield, 0);
  assert.equal(room.shieldLog[0].playerId, 'ada');

  powerups.grant(bea, 'STEAL', settings);
  const stole = powerups.activate(room, bea, 'STEAL', ada);
  assert.equal(stole.cue.type, 'POWER_STEAL');
  assert.equal(stole.cue.playerId, 'bea');
  assert.equal(stole.cue.targetPlayerId, 'ada');
  assert.equal(stole.cue.amount, 100);
  assert.equal(ada.balance, 900);
  assert.equal(bea.balance, 1100);
  assert.equal(animations.buildCue(stole.cue).type, 'POWER_STEAL');

  const trivia = { phase: 'QUESTION', settings, players: new Map([['ada', ada]]), question: room.question, pot: 0, round: 1, roundState: rules.blankRoundState() };
  ada.bet = 100;
  ada.answer = 1;
  powerups.grant(ada, 'DOUBLE_DOWN', settings);
  assert.equal(powerups.activate(trivia, ada, 'DOUBLE_DOWN').ok, true);
  powerups.grant(ada, 'RISK_BOOST', settings);
  assert.equal(powerups.activate(trivia, ada, 'RISK_BOOST').ok, true);
  rules.scoreRound(trivia, () => 0);
  assert.equal(ada.change, 300);
  assert.equal(ada.armed.doubleDown, false);
  assert.equal(ada.armed.riskBoost, false);
  assert.equal(ada.powerups.DOUBLE_DOWN, 0);

  const miss = player('cal', 'Cal', { bet: 100, answer: 0 });
  const missRoom = { phase: 'QUESTION', settings, players: [miss], question: { correctAnswer: 1 }, pot: 0, round: 1, roundState: rules.blankRoundState() };
  powerups.grant(miss, 'FREE_BET', settings);
  powerups.activate(missRoom, miss, 'FREE_BET');
  rules.scoreRound(missRoom, () => 0);
  assert.equal(miss.change, 0);
  assert.equal(miss.balance, 1000);
  assert.equal(miss.armed.freeBet, false);

  powerups.grant(ada, 'HINT', settings);
  const hinted = powerups.activate(trivia, ada, 'HINT', null, () => 0);
  assert.equal(hinted.ok, true);
  assert.equal(hinted.privateMessage, 'A is not the answer.');
  assert.equal(JSON.stringify(hinted.cue).includes('is not the answer'), false);
  assert.equal(ada.hintEliminated.includes(1), false);

  const puzzle = hangman.blankPuzzle(6);
  const racer = player('nia', 'Nia', { puzzle });
  const rival = player('cal', 'Cal', { puzzle: hangman.blankPuzzle(6) });
  const race = { phase: 'HANGMAN', settings: { ...settings, gameMode: 'HANGMAN' }, players: new Map([['nia', racer], ['cal', rival]]), puzzle: { word: 'ORBIT', hint: 'The path a planet follows around a star.', solvedCount: 0 } };
  powerups.grant(racer, 'EXTRA_LIFE', race.settings);
  assert.equal(powerups.activate(race, racer, 'EXTRA_LIFE').ok, true);
  assert.equal(racer.puzzle.lives, 7);
  powerups.grant(racer, 'HINT', race.settings);
  const clue = powerups.activate(race, racer, 'HINT');
  assert.equal(clue.privateMessage.toLowerCase().includes('planet'), true);
  assert.equal(JSON.stringify(clue.cue).toLowerCase().includes('planet'), false);
  assert.equal(JSON.stringify(clue.cue).includes('ORBIT'), false);
  powerups.grant(rival, 'SHIELD', race.settings);
  powerups.activate(race, rival, 'SHIELD');
  racer.balance = 1000;
  const attack = hangman.attackLife(race, racer, rival);
  assert.equal(attack.blocked, true);
  assert.equal(rival.puzzle.lives, 6);
  assert.equal(racer.balance, 500);

  const wallet = { balance: 1000 };
  animations.buildCue({ type: 'POWER_STEAL', amount: 100 });
  assert.equal(wallet.balance, 1000);
  powerups.ACQUISITION.dropChance = 100;
  const dropped = powerups.maybeDrop(race, () => 0);
  powerups.ACQUISITION.dropChance = 0;
  assert.equal(dropped.length, 2);
});

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
function client(url) {
  const ws = new WebSocket(url), messages = [], waiters = [];
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    messages.push(message);
    const index = waiters.findIndex((waiter) => waiter.predicate(message));
    if (index >= 0) { messages.splice(messages.indexOf(message), 1); waiters.splice(index, 1)[0].resolve(message); }
  });
  const next = (predicate, timeout = 3000) => {
    const previous = messages.find(predicate);
    if (previous) { messages.splice(messages.indexOf(previous), 1); return Promise.resolve(previous); }
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve: (value) => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => { const i = waiters.indexOf(waiter); if (i >= 0) waiters.splice(i, 1); reject(new Error('Timed out waiting for server message')); }, timeout);
      waiters.push(waiter);
    });
  };
  return { ws, next, messages, send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })), open: new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); }) };
}

test('players buy, activate, block, and reconnect through the same powerup cue', async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const sockets = [];
  t.after(() => { for (const socket of sockets) if (socket.readyState < WebSocket.CLOSING) socket.close(); child.kill(); });
  await new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (output.includes(`:${port}`)) return resolve();
      if (child.exitCode !== null) return reject(new Error(output || 'server exited'));
      if (Date.now() - started > 5000) return reject(new Error(`Server did not start: ${output}`));
      setTimeout(poll, 30);
    };
    poll();
  });
  const url = `ws://127.0.0.1:${port}`;
  const host = client(url);
  const guest = client(url);
  sockets.push(host.ws, guest.ws);
  await Promise.all([host.open, guest.open]);
  host.send('CREATE', { name: 'Ada' });
  const created = await host.next((m) => m.type === 'WELCOME');
  assert.equal(created.room.settings.powerupsEnabled, true);
  guest.send('JOIN', { name: 'Bea', code: created.room.code });
  await guest.next((m) => m.type === 'WELCOME');
  host.send('START');
  await host.next((m) => m.type === 'STATE' && m.room.phase === 'BETTING');
  host.send('BUY_POWERUP', { powerupId: 'EXTRA_LIFE' });
  assert.equal((await host.next((m) => m.type === 'ERROR')).code, 'WRONG_MODE');
  const denied = await host.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'POWERUP_UNAVAILABLE');
  assert.equal(denied.animation.level, 'small');
  host.send('BUY_POWERUP', { powerupId: 'SHIELD' });
  const owned = await host.next((m) => m.type === 'STATE' && m.room.powerups?.inventory?.find((item) => item.id === 'SHIELD')?.count === 1);
  assert.equal(owned.room.players.find((p) => p.id === created.playerId).balance, 700);
  host.ws.close();
  const again = client(url);
  sockets.push(again.ws);
  await again.open;
  again.send('JOIN', { name: 'Ada', code: created.room.code, token: created.token });
  const back = await again.next((m) => m.type === 'WELCOME');
  assert.equal(back.room.powerups.inventory.find((item) => item.id === 'SHIELD').count, 1);
  await assert.rejects(() => again.next((m) => m.type === 'ANIMATION', 400));
  again.send('ACTIVATE_POWERUP', { powerupId: 'SHIELD' });
  const raised = await again.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'POWER_SHIELD');
  const saw = await guest.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'POWER_SHIELD');
  assert.equal(raised.animation.id, saw.animation.id);
  assert.equal(raised.animation.playerId, created.playerId);
  guest.send('BUY_POWERUP', { powerupId: 'STEAL' });
  await guest.next((m) => m.type === 'STATE' && m.room.players.find((p) => p.name === 'Bea')?.balance === 600);
  guest.send('ACTIVATE_POWERUP', { powerupId: 'STEAL', targetId: created.playerId });
  const block = await guest.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'POWER_SHIELD_BLOCK');
  const blockToo = await again.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'POWER_SHIELD_BLOCK');
  assert.equal(block.animation.id, blockToo.animation.id);
  assert.equal(block.animation.playerId, created.playerId);
  const settled = await again.next((m) => m.type === 'STATE' && m.room.players.find((p) => p.name === 'Bea')?.balance === 600 && m.room.players.find((p) => p.id === created.playerId)?.balance === 700);
  assert.equal(settled.room.players.find((p) => p.name === 'Bea').balance, 600);
  assert.equal(guest.messages.some((m) => m.animation?.type === 'POWER_STEAL'), false);

  const offHost = client(url);
  const offGuest = client(url);
  sockets.push(offHost.ws, offGuest.ws);
  await Promise.all([offHost.open, offGuest.open]);
  offHost.send('CREATE', { name: 'Nia' });
  const quiet = await offHost.next((m) => m.type === 'WELCOME');
  offGuest.send('JOIN', { name: 'Cal', code: quiet.room.code });
  await offGuest.next((m) => m.type === 'WELCOME');
  offHost.send('UPDATE_SETTINGS', { settings: { powerupsEnabled: false } });
  const synced = await offGuest.next((m) => m.type === 'STATE' && m.room.settings.powerupsEnabled === false);
  assert.equal(synced.room.powerups.enabled, false);
  offHost.send('START');
  await offHost.next((m) => m.type === 'STATE' && m.room.phase === 'BETTING');
  offHost.send('BUY_POWERUP', { powerupId: 'SHIELD' });
  assert.equal((await offHost.next((m) => m.type === 'ERROR')).code, 'POWERUPS_OFF');
});
