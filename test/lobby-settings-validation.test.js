const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const rules = require('../match-rules');

const LIMITS = {
  startingCash: [500, 1000, 2500, 5000, 10000],
  questionCount: [1, 5, 10, 15, 20, 25],
};
const BLOCKED = 'One or more settings are not supported.';

function published(settings, questionCount = settings.questionCount) {
  return {
    ...settings,
    categories: [...(settings.categories || [])],
    events: { ...settings.events },
    isCustom: rules.isCustomMatch({ ...settings, questionCount }),
    modeLabel: rules.modeLabel(settings.gameMode),
  };
}

test('published default lobby settings are valid, including display fields and zero events', () => {
  const defaults = rules.defaultSettings(10);
  const echoed = rules.applySettingsUpdate(defaults, published(defaults), LIMITS);
  assert.equal(echoed.ok, true);
  assert.equal(echoed.settings.gameMode, 'CLASSIC');
  assert.equal(echoed.settings.difficulty, 'ANY');
  assert.equal(echoed.settings.startingCash, 1000);
  assert.equal(echoed.settings.questionCount, 10);
  assert.equal(echoed.settings.isCustom, undefined);
  assert.equal(echoed.settings.modeLabel, undefined);
  assert.equal(Object.values(echoed.settings.events).every(Boolean), true);
  assert.equal(Object.keys(echoed.settings.events).length, rules.EVENT_IDS.length);

  const none = Object.fromEntries(rules.EVENT_IDS.map((id) => [id, false]));
  const cleared = rules.applySettingsUpdate(defaults, { events: none, isCustom: true, modeLabel: 'Classic Risk It' }, LIMITS);
  assert.equal(cleared.ok, true, cleared.message);
  assert.equal(Object.values(cleared.settings.events).every((enabled) => enabled === false), true);
  assert.notEqual(cleared.message, BLOCKED);

  const unknown = rules.applySettingsUpdate(defaults, { questionTypes: ['multiple'], powerups: [] }, LIMITS);
  assert.equal(unknown.ok, false);
  assert.match(unknown.message, /questionTypes/);
  assert.match(unknown.message, /powerups/);
  assert.notEqual(unknown.message, BLOCKED);
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
    if (index >= 0) waiters.splice(index, 1)[0].resolve(message);
  });
  const next = (predicate, timeout = 3000) => {
    const previous = messages.find(predicate);
    if (previous) return Promise.resolve(previous);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve: (value) => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => {
        const i = waiters.indexOf(waiter);
        if (i >= 0) waiters.splice(i, 1);
        reject(new Error('Timed out waiting for server message'));
      }, timeout);
      waiters.push(waiter);
    });
  };
  return {
    ws,
    next,
    send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })),
    open: new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    }),
  };
}

test('default lobby settings can start, and unknown settings name the bad fields', async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let host;
  let guest;
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  t.after(() => {
    for (const socket of [host?.ws, guest?.ws]) if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    child.kill();
  });
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
  host = client(url);
  guest = client(url);
  await Promise.all([host.open, guest.open]);
  host.send('CREATE', { name: 'Host' });
  const welcome = await host.next((message) => message.type === 'WELCOME');
  assert.equal(welcome.room.settings.gameMode, 'CLASSIC');
  assert.equal(welcome.room.settings.difficulty, 'ANY');
  assert.equal(welcome.room.settings.startingCash, 1000);
  assert.equal(Object.values(welcome.room.settings.events).filter(Boolean).length, rules.EVENT_IDS.length);

  host.send('UPDATE_SETTINGS', { settings: welcome.room.settings });
  const echoed = await host.next((message) => message.type === 'STATE' || message.type === 'ERROR');
  assert.equal(echoed.type, 'STATE');
  assert.notEqual(echoed.message, BLOCKED);
  assert.equal(Object.values(echoed.room.settings.events).every(Boolean), true);

  host.send('START');
  assert.equal((await host.next((message) => message.type === 'ERROR' && message.code === 'NEED_PLAYERS')).code, 'NEED_PLAYERS');

  guest.send('JOIN', { name: 'Guest', code: welcome.room.code });
  await guest.next((message) => message.type === 'WELCOME');
  host.send('UPDATE_SETTINGS', { settings: { difficulty: 'EASY' } });
  const seen = await guest.next((message) => message.type === 'STATE' && message.room.settings.difficulty === 'EASY');
  assert.equal(seen.room.settings.difficulty, 'EASY');

  const none = Object.fromEntries(rules.EVENT_IDS.map((id) => [id, false]));
  host.send('UPDATE_SETTINGS', { settings: { events: none } });
  const cleared = await guest.next((message) => message.type === 'STATE' && message.room.settings.events.JACKPOT === false);
  assert.equal(Object.values(cleared.room.settings.events).every((enabled) => enabled === false), true);

  host.send('UPDATE_SETTINGS', { settings: { questionTypes: ['multiple'], powerups: ['shield'] } });
  const rejected = await host.next((message) => message.type === 'ERROR' && message.code === 'INVALID_SETTINGS');
  assert.match(rejected.message, /questionTypes/);
  assert.match(rejected.message, /powerups/);
  assert.notEqual(rejected.message, BLOCKED);

  host.send('START');
  const started = await host.next((message) => message.type === 'STATE' && message.room.phase === 'BETTING');
  assert.equal(started.room.phase, 'BETTING');
  assert.equal(started.room.settings.difficulty, 'EASY');
});
