const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

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
  const next = (predicate, timeout = 3000) => {
    const previous = messages.find(predicate);
    if (previous) return Promise.resolve(previous);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve: value => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => {
        const i = waiters.indexOf(waiter);
        if (i >= 0) waiters.splice(i, 1);
        reject(new Error('Timed out waiting for server message'));
      }, timeout);
      waiters.push(waiter);
    });
  };
  return {
    ws, next, messages,
    send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })),
    send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })),
    open: new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    }),
  };
}

test('chat stays inside a room and rejects empty, long, and unfiltered language', async t => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let host, guest, outsider;
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(() => {
    for (const c of [host?.ws, guest?.ws, outsider?.ws]) if (c && c.readyState < WebSocket.CLOSING) c.close();
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
  outsider = client(url);
  await Promise.all([host.open, guest.open, outsider.open]);
  host.send('CREATE', { name: 'Host' });
  const hostRoom = await host.next(m => m.type === 'WELCOME');
  assert.deepEqual(hostRoom.room.chat, []);
  guest.send('JOIN', { name: 'Guest', code: hostRoom.room.code });
  await guest.next(m => m.type === 'WELCOME');
  outsider.send('CREATE', { name: 'Other' });
  const otherRoom = await outsider.next(m => m.type === 'WELCOME');

  host.send('CHAT', { text: '   ' });
  assert.equal((await host.next(m => m.type === 'ERROR')).code, 'EMPTY_MESSAGE');
  host.send('CHAT', { text: 'a'.repeat(201) });
  assert.equal((await host.next(m => m.type === 'ERROR' && m.code === 'MESSAGE_TOO_LONG')).code, 'MESSAGE_TOO_LONG');
  host.send('CHAT', { text: 'this is shit' });
  const masked = await guest.next(m => m.type === 'STATE' && m.room.chat.length === 1);
  assert.equal(masked.room.chat[0].name, 'Host');
  assert.equal(masked.room.chat[0].text, 'this is ****');
  assert.equal(masked.room.chat[0].text.includes('shit'), false);
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(outsider.messages.some(m => JSON.stringify(m).includes('this is')), false);

  host.send('CHAT', { text: 'hello table' });
  const shared = await guest.next(m => m.type === 'STATE' && m.room.chat.some(message => message.text === 'hello table'));
  assert.equal(shared.room.code, hostRoom.room.code);
  assert.equal(otherRoom.room.code === hostRoom.room.code, false);

  for (const text of ['one more', 'two more', 'three more']) host.send('CHAT', { text });
  await guest.next(m => m.type === 'STATE' && m.room.chat.some(message => message.text === 'three more'));
  host.send('CHAT', { text: 'too fast' });
  assert.equal((await host.next(m => m.type === 'ERROR' && m.code === 'RATE_LIMITED')).code, 'RATE_LIMITED');
  assert.equal(outsider.messages.some(m => JSON.stringify(m).includes('hello table')), false);
});
