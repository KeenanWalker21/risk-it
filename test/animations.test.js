const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const animations = require('../public/animations/registry');

test('animation registry and queue keep priority without touching game state', () => {
  const cue = animations.buildCue({ type: 'DOUBLE_DOWN', playerId: 'ada', playerName: 'Ada', amount: 250 });
  assert.equal(cue.type, 'DOUBLE_DOWN');
  assert.equal(cue.playerId, 'ada');
  assert.equal(cue.priority, 'MEDIUM');
  assert.equal(cue.level, 'major');
  assert.equal(animations.EVENT_ANIMATIONS.BANK_HEIST.supportsTarget, true);
  assert.equal(animations.EVENT_ANIMATIONS.JACKPOT.fullscreen, true);
  assert.equal(animations.buildCue({ type: 'NOT_A_POWERUP' }), null);
  const wallet = { balance: 1000 };
  animations.buildCue({ type: 'CASH_GAIN', amount: 500 });
  assert.equal(wallet.balance, 1000);

  const queue = new animations.AnimationQueue();
  assert.equal(queue.enqueue(animations.buildCue({ type: 'DOUBLE_DOWN', id: 'a' })).channel, 'play');
  assert.equal(queue.enqueue(animations.buildCue({ type: 'BANK_HEIST', id: 'b', targetPlayerId: 'bea' })).channel, 'queue');
  assert.equal(queue.enqueue(animations.buildCue({ type: 'CASH_GAIN', id: 'low', amount: 50 })).channel, 'float');
  assert.equal(queue.enqueue(animations.buildCue({ type: 'JACKPOT', id: 'c' })).channel, 'interrupt');
  assert.equal(queue.current.type, 'JACKPOT');
  assert.equal(queue.current.playerId, null);
  queue.finishCurrent();
  assert.equal(queue.current.type, 'BANK_HEIST');
  assert.equal(queue.current.targetPlayerId, 'bea');
  queue.finishCurrent();
  assert.equal(queue.current.type, 'DOUBLE_DOWN');
  assert.deepEqual(queue.takeFloats().map((item) => item.type), ['CASH_GAIN']);
  const denied = animations.failureCue('INSUFFICIENT_CASH', 'You need $500.');
  assert.equal(denied.type, 'INSUFFICIENT_CASH');
  assert.equal(denied.level, 'small');
  assert.equal(animations.failureCue('NOT_HOST', 'Only the host.'), null);
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

test('purchases, rejections, hangman cues, and reconnect stay server-owned', async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1', RISKIT_FORCE_WORD: 'ORBIT' },
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
  guest.send('JOIN', { name: 'Bea', code: created.room.code });
  const joined = await guest.next((m) => m.type === 'WELCOME');
  host.send('START');
  await host.next((m) => m.type === 'STATE' && m.room.phase === 'BETTING');
  host.send('BUY_EVENT', { eventId: 'DOUBLE_DOWN' });
  const hostCue = await host.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'DOUBLE_DOWN');
  const guestCue = await guest.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'DOUBLE_DOWN');
  assert.equal(hostCue.animation.id, guestCue.animation.id);
  assert.equal(hostCue.animation.playerId, created.playerId);
  assert.equal(hostCue.animation.playerName, 'Ada');
  assert.equal(hostCue.animation.targetPlayerId, null);
  const paid = await host.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.id === created.playerId)?.balance === 750);
  assert.equal(paid.room.players.find((p) => p.id === created.playerId).balance, 750);
  host.send('BUY_EVENT', { eventId: 'BANK_HEIST' });
  const denied = await host.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'INVALID_TARGET');
  assert.equal(denied.animation.level, 'small');
  assert.equal((await host.next((m) => m.type === 'ERROR' && m.code === 'INVALID_TARGET')).code, 'INVALID_TARGET');
  assert.equal(host.messages.some((m) => m.type === 'ANIMATION' && m.animation?.type === 'BANK_HEIST'), false);
  assert.equal(guest.messages.some((m) => m.animation?.type === 'INVALID_TARGET'), false);

  host.send('UPDATE_SETTINGS', { settings: { gameMode: 'HANGMAN', hangmanWords: 1 } });
  assert.equal((await host.next((m) => m.type === 'ERROR' && m.code === 'SETTINGS_LOCKED')).code, 'SETTINGS_LOCKED');
  const hangHost = client(url);
  const hangGuest = client(url);
  sockets.push(hangHost.ws, hangGuest.ws);
  await Promise.all([hangHost.open, hangGuest.open]);
  hangHost.send('CREATE', { name: 'Nia' });
  const room = await hangHost.next((m) => m.type === 'WELCOME');
  hangGuest.send('JOIN', { name: 'Cal', code: room.room.code });
  await hangGuest.next((m) => m.type === 'WELCOME');
  hangHost.send('UPDATE_SETTINGS', { settings: { gameMode: 'HANGMAN', hangmanWords: 1 } });
  await hangGuest.next((m) => m.type === 'STATE' && m.room.settings.gameMode === 'HANGMAN');
  hangHost.send('START');
  await hangHost.next((m) => m.type === 'STATE' && m.room.phase === 'HANGMAN');
  hangHost.send('HANGMAN_HINT', {});
  const hint = await hangGuest.next((m) => m.type === 'ANIMATION' && m.animation?.type === 'BUY_HINT');
  assert.equal(hint.animation.playerName, 'Nia');
  assert.equal(JSON.stringify(hint.animation).includes('ORBIT'), false);
  assert.equal(JSON.stringify(hint.animation).toLowerCase().includes('planet'), false);
  hangHost.ws.close();
  const again = client(url);
  sockets.push(again.ws);
  await again.open;
  again.send('JOIN', { name: 'Nia', code: room.room.code, token: room.token });
  const back = await again.next((m) => m.type === 'WELCOME');
  assert.equal(back.room.viewerHangman.hint.toLowerCase().includes('planet'), true);
  await assert.rejects(() => again.next((m) => m.type === 'ANIMATION', 400));
});
