const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const { questions } = require('../questions');

async function freePort() {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

function client(url) {
  const ws = new WebSocket(url);
  const messages = [];
  const waiters = [];
  ws.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    messages.push(data);
    const index = waiters.findIndex(w => w.predicate(data));
    if (index >= 0) waiters.splice(index, 1)[0].resolve(data);
  });
  const next = (predicate, timeout = 5000) => {
    const found = messages.find(predicate);
    if (found) return Promise.resolve(found);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve: value => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => { const i = waiters.indexOf(waiter); if (i >= 0) waiters.splice(i, 1); reject(new Error('Timed out waiting for server message')); }, timeout);
      waiters.push(waiter);
    });
  };
  const send = (type, data = {}) => ws.send(JSON.stringify({ type, ...data }));
  const open = new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  return { ws, messages, next, send, open };
}

test('two browser clients can play a server-scored round', async t => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1' }, stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(() => { for (const c of [host?.ws, guest?.ws, other?.ws]) if (c && c.readyState < WebSocket.CLOSING) c.close(); child.kill(); });
  let host, guest, other;
  try {
    await new Promise((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        if (output.includes(`:${port}`)) return resolve();
        if (child.exitCode !== null) return reject(new Error(output));
        if (Date.now() - started > 5000) return reject(new Error(`Server did not start: ${output}`));
        setTimeout(poll, 30);
      };
      poll();
    });
    const url = `ws://127.0.0.1:${port}`;
    host = client(url); guest = client(url); other = client(url);
    await Promise.all([host.open, guest.open, other.open]);
    host.send('CREATE', { name: 'Keenan' });
    const created = await host.next(m => m.type === 'WELCOME');
    assert.match(created.room.code, /^[A-HJ-NP-Z2-9]{6}$/);
    host.send('START');
    assert.equal((await host.next(m => m.type === 'ERROR')).code, 'NEED_PLAYERS');
    other.send('CREATE', { name: 'Taylor' });
    const otherRoom = await other.next(m => m.type === 'WELCOME');
    assert.notEqual(otherRoom.room.code, created.room.code);
    guest.send('JOIN', { name: 'Jordan', code: created.room.code });
    await guest.next(m => m.type === 'WELCOME');
    guest.send('START');
    assert.equal((await guest.next(m => m.type === 'ERROR')).code, 'NOT_HOST');
    host.send('START');
    const betting = await host.next(m => m.type === 'STATE' && m.room.phase === 'BETTING');
    assert.equal(betting.room.question.question, undefined, 'question is withheld during betting');
    host.send('BET', { amount: 5000 });
    assert.equal((await host.next(m => m.type === 'ERROR' && m.code === 'INVALID_BET')).code, 'INVALID_BET');
    host.send('BET', { amount: 250 });
    await host.next(m => m.type === 'STATE' && m.room.players.find(p => p.id === created.playerId)?.hasBet);
    host.send('BET', { amount: 50 });
    assert.equal((await host.next(m => m.type === 'ERROR' && m.code === 'BET_LOCKED')).code, 'BET_LOCKED');
    guest.send('BET', { amount: 100 });
    const qState = await host.next(m => m.type === 'STATE' && m.room.phase === 'QUESTION');
    const q = questions.find(item => item.question === qState.room.question.question);
    assert.ok(q, 'question is present in the local question bank');
    assert.equal(qState.room.question.answers.length, 4);
    await guest.next(m => m.type === 'STATE' && m.room.phase === 'QUESTION');
    host.send('ANSWER', { answer: q.correctAnswer });
    guest.send('ANSWER', { answer: (q.correctAnswer + 1) % 4 });
    const result = await host.next(m => m.type === 'STATE' && m.room.phase === 'RESULTS');
    const h = result.room.players.find(p => p.id === created.playerId);
    const g = result.room.players.find(p => p.id !== created.playerId);
    assert.equal(h.balance, 1250);
    assert.equal(h.change, 250);
    assert.equal(g.balance, 900);
    assert.equal(g.change, -100);
    assert.equal(result.room.result.correctAnswer, q.correctAnswer);
    const final = await host.next(m => m.type === 'STATE' && m.room.phase === 'FINAL', 5000);
    assert.equal(final.room.winnerId, created.playerId);
  } finally {
    child.kill();
  }
});
