const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { createAccountStore } = require('../accounts');

test('passwords are hashed and sessions can be restored or logged out', () => {
  const file = path.join(os.tmpdir(), `riskit-accounts-${process.pid}-${Date.now()}.sqlite`);
  const accounts = createAccountStore(file);
  try {
    assert.equal(accounts.signup({ username: 'ab', email: 'ada@example.com', password: 'correct-horse' }).error, 'INVALID_USERNAME');
    assert.equal(accounts.signup({ username: 'AdaPlayer', email: 'not-an-email', password: 'correct-horse' }).error, 'INVALID_EMAIL');
    assert.equal(accounts.signup({ username: 'AdaPlayer', email: 'ada@example.com', password: 'short' }).error, 'WEAK_PASSWORD');
    const created = accounts.signup({ username: 'AdaPlayer', email: 'ada@example.com', password: 'correct-horse' });
    assert.equal(created.ok, true);
    assert.equal(created.user.username, 'AdaPlayer');
    assert.equal(typeof created.sessionToken, 'string');
    assert.equal(accounts.signup({ username: 'adaplayer', email: 'other@example.com', password: 'correct-horse' }).error, 'USERNAME_TAKEN');
    assert.equal(accounts.signup({ username: 'OtherName', email: 'Ada@Example.com', password: 'correct-horse' }).error, 'EMAIL_TAKEN');
    assert.equal(accounts.login({ username: 'AdaPlayer', password: 'wrong-password' }).error, 'BAD_LOGIN');
    const loggedIn = accounts.login({ username: 'ada@example.com', password: 'correct-horse' });
    assert.equal(loggedIn.user.id, created.user.id);
    assert.equal(accounts.session(loggedIn.sessionToken).username, 'AdaPlayer');
    accounts.logout(loggedIn.sessionToken);
    assert.equal(accounts.session(loggedIn.sessionToken), null);
    const stored = fs.readFileSync(file);
    assert.equal(stored.includes(Buffer.from('correct-horse')), false);
  } finally {
    accounts.close();
    fs.rmSync(file, { force: true });
    fs.rmSync(`${file}-wal`, { force: true });
    fs.rmSync(`${file}-shm`, { force: true });
  }
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
    ws, next,
    send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })),
    open: new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    }),
  };
}

test('guests can still create a room and a saved session survives a new connection', async t => {
  const port = await freePort();
  const dataFile = path.join(os.tmpdir(), `riskit-live-accounts-${process.pid}-${Date.now()}.sqlite`);
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1', RISKIT_DATA: dataFile },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let member, restored, guest;
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(async () => {
    for (const c of [member?.ws, restored?.ws, guest?.ws]) if (c && c.readyState < WebSocket.CLOSING) c.close();
    child.kill();
    await new Promise(resolve => {
      if (child.exitCode !== null) return resolve();
      child.once('exit', resolve);
      setTimeout(resolve, 800);
    });
    for (const file of [dataFile, `${dataFile}-wal`, `${dataFile}-shm`]) {
      try { fs.rmSync(file, { force: true }); } catch { /* Windows may keep the file briefly after the process exits. */ }
    }
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
  member = client(url);
  guest = client(url);
  await Promise.all([member.open, guest.open]);
  guest.send('CREATE', { name: 'Guest' });
  const guestRoom = await guest.next(m => m.type === 'WELCOME');
  assert.equal(guestRoom.room.phase, 'LOBBY');
  member.send('SIGNUP', { username: 'TableHost', email: 'host@example.com', password: 'correct-horse' });
  const account = await member.next(m => m.type === 'ACCOUNT');
  assert.equal(account.user.username, 'TableHost');
  assert.equal(Object.hasOwn(account.user, 'password'), false);
  member.send('CREATE', { name: 'TableHost' });
  assert.equal((await member.next(m => m.type === 'WELCOME')).room.players[0].name, 'TableHost');
  restored = client(url);
  await restored.open;
  restored.send('SESSION', { sessionToken: account.sessionToken });
  assert.equal((await restored.next(m => m.type === 'ACCOUNT')).user.username, 'TableHost');
  restored.send('LOGOUT', { sessionToken: account.sessionToken });
  assert.equal((await restored.next(m => m.type === 'LOGGED_OUT')).type, 'LOGGED_OUT');
  const again = client(url);
  t.after(() => { if (again.ws.readyState < WebSocket.CLOSING) again.ws.close(); });
  await again.open;
  again.send('SESSION', { sessionToken: account.sessionToken });
  assert.equal((await again.next(m => m.type === 'LOGGED_OUT')).type, 'LOGGED_OUT');
});
