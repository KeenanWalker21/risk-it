const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');
const rules = require('../match-rules');
const hangman = require('../hangman');

test('hangman rewards, costs, and mode descriptions stay explicit', () => {
  assert.equal(hangman.hangmanReward(6, { hangmanRewardMultiplier: 1 }), 400);
  assert.equal(hangman.hangmanReward(0, {}), 100);
  assert.equal(hangman.hangmanReward(-4, {}), 100);
  assert.equal(hangman.hangmanReward(6, { hangmanRewardMultiplier: 2 }), 800);
  assert.ok(hangman.hangmanReward(6, { hangmanRewardMultiplier: 9 }) >= 0);
  assert.deepEqual(hangman.EVENT_COSTS, {
    DOUBLE_DOWN: 250, CASH_DROP: 200, BANK_HEIST: 500, LIGHTNING: 400, BOUNTY: 350, STEAL: 300, CHAOS: 450, FINAL_GAMBLE: 600,
  });
  assert.equal(hangman.HANGMAN_COSTS.hint, 250);
  assert.equal(hangman.HANGMAN_COSTS.letter, 400);
  assert.equal(hangman.HANGMAN_COSTS.attack, 500);
  const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'client.js'), 'utf8');
  for (const [id, label, copy] of rules.MODES) {
    assert.ok(copy && copy.length > 12, id);
    assert.equal(rules.modeCopy(id), copy);
    assert.ok(client.includes(id), id);
    assert.ok(client.includes(label), label);
  }
  assert.ok(client.includes('Save lives to earn more cash.'));
  const offers = hangman.shopOffers({ balance: 1000 }, { gameMode: 'CLASSIC', cashEventsEnabled: true }, 'BETTING');
  assert.equal(offers.find((offer) => offer.id === 'DOUBLE_DOWN').cost, 250);
  assert.equal(offers.find((offer) => offer.id === 'MARKET_CRASH'), undefined);
  const hangmanShop = hangman.shopOffers({ balance: 1000 }, { gameMode: 'HANGMAN', cashEventsEnabled: true }, 'HANGMAN');
  assert.equal(hangmanShop.some((offer) => offer.id === 'BOUNTY'), false);
  assert.equal(hangmanShop.some((offer) => offer.id === 'BANK_HEIST'), true);
  assert.ok(hangman.HANGMAN_WORDS_OPTIONS.includes(15));
  assert.equal(hangman.WORDS.find((entry) => entry.word === 'TRAIN').category, 'Transportation');
  assert.equal(hangman.WORDS.find((entry) => entry.word === 'AVENGERS').category, 'Movies');
  for (const entry of hangman.WORDS) assert.ok(hangman.HANGMAN_CATEGORIES.includes(entry.category), entry.word);
  assert.equal(new Set(hangman.WORDS.map((entry) => entry.word)).size, hangman.WORDS.length);
  assert.ok(hangman.WORDS.length >= 15);
  const slogan = hangman.blankPuzzle(6);
  const board = hangman.viewerHangman({
    phase: 'HANGMAN',
    settings: {},
    puzzle: { word: 'GOT MILK', category: 'Slogans and Jingles', hint: 'A short dairy slogan.', difficulty: 'EASY' },
  }, { puzzle: slogan });
  assert.equal(board.category, 'Slogans and Jingles');
  assert.equal(board.pattern[3], ' ');
  assert.equal(board.pattern[0], null);
  assert.deepEqual(hangman.shopOffers({ balance: 1000 }, { cashEventsEnabled: false }, 'BETTING'), []);
});

test('hangman purchases reject bad targets, duplicates, and disconnected players', () => {
  const puzzle = hangman.blankPuzzle(6);
  const attacker = { id: 'a', name: 'Ada', connected: true, balance: 1000, puzzle: { ...puzzle, revealed: [], wrong: [], guessed: [] } };
  const target = { id: 'b', name: 'Bea', connected: true, balance: 1000, puzzle: hangman.blankPuzzle(6) };
  const room = { phase: 'HANGMAN', settings: { gameMode: 'HANGMAN', hangmanPurchases: true, hangmanAttacks: true, cashEventsEnabled: true }, puzzle: { word: 'ORBIT', category: 'Science', hint: 'secret', solvedCount: 0 }, purchased: new Set(), players: new Map([['a', attacker], ['b', target]]) };
  assert.equal(hangman.attackLife(room, attacker, attacker).error, 'INVALID_TARGET');
  assert.equal(attacker.balance, 1000);
  target.puzzle.lives = 0;
  assert.equal(hangman.attackLife(room, attacker, target).error, 'INVALID_TARGET');
  target.puzzle.lives = 6;
  attacker.connected = false;
  assert.equal(hangman.purchaseEvent(room, attacker, 'BANK_HEIST', target, () => 0).error, 'NOT_PLAYING');
  attacker.connected = true;
  room.phase = 'FINAL';
  assert.equal(hangman.buyHint(room, attacker).error, 'WRONG_PHASE');
  room.phase = 'HANGMAN';
  assert.equal(hangman.buyHint(room, attacker).ok, true);
  assert.equal(attacker.balance, 750);
  assert.equal(hangman.buyHint(room, attacker).error, 'DUPLICATE_PURCHASE');
  assert.equal(attacker.balance, 750);
  attacker.balance = 100;
  assert.equal(hangman.buyLetter(room, attacker, () => 0).error, 'INSUFFICIENT_CASH');
  assert.equal(attacker.balance, 100);
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
  return { ws, next, send: (type, data = {}) => ws.send(JSON.stringify({ type, ...data })), open: new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); }) };
}

test('hangman race, cash purchases, events, settings, and reconnect stay server-owned', async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1', RISKIT_FORCE_WORD: 'ORBIT' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '', host, guest, again;
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  t.after(() => { for (const c of [host?.ws, guest?.ws, again?.ws]) if (c && c.readyState < WebSocket.CLOSING) c.close(); child.kill(); });
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
  host = client(url); guest = client(url);
  await Promise.all([host.open, guest.open]);
  host.send('CREATE', { name: 'Ada' });
  const created = await host.next((m) => m.type === 'WELCOME');
  guest.send('JOIN', { name: 'Bea', code: created.room.code });
  const joined = await guest.next((m) => m.type === 'WELCOME');
  assert.equal(joined.room.phase, 'LOBBY');
  host.send('UPDATE_SETTINGS', { settings: { gameMode: 'HANGMAN', hangmanWords: 1, hangmanLives: 4 } });
  const synced = await guest.next((m) => m.type === 'STATE' && m.room.settings.gameMode === 'HANGMAN' && m.room.settings.hangmanLives === 4);
  assert.equal(synced.room.settings.hangmanWords, 1);
  assert.equal(synced.room.totalRounds, 1);
  host.send('UPDATE_SETTINGS', { settings: { hangmanLives: 6 } });
  await guest.next((m) => m.type === 'STATE' && m.room.settings.hangmanLives === 6);
  host.send('START');
  const started = await host.next((m) => m.type === 'STATE' && m.room.phase === 'HANGMAN');
  assert.equal(started.room.viewerHangman.word, null);
  assert.equal(started.room.viewerHangman.pattern.every((letter) => letter === null), true);
  assert.equal(JSON.stringify(started.room).includes('ORBIT'), false);
  const guestStart = await guest.next((m) => m.type === 'STATE' && m.room.phase === 'HANGMAN');
  assert.equal(JSON.stringify(guestStart.room).includes('ORBIT'), false);

  host.send('HANGMAN_GUESS', { letter: 'Z' });
  const missed = await host.next((m) => m.type === 'STATE' && m.room.viewerHangman?.lives === 5);
  assert.deepEqual(missed.room.viewerHangman.wrong, ['Z']);
  const guestUntouched = await guest.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.name === 'Ada')?.lives === 5);
  assert.equal(guestUntouched.room.viewerHangman.lives, 6);
  assert.equal(guestUntouched.room.viewerHangman.guessed.includes('Z'), false);

  host.send('HANGMAN_GUESS', { letter: 'O' });
  const hit = await host.next((m) => m.type === 'STATE' && m.room.viewerHangman?.pattern?.[0] === 'O');
  assert.equal(hit.room.viewerHangman.solved, false);
  host.ws.close();
  again = client(url);
  await again.open;
  again.send('JOIN', { name: 'Ada', code: created.room.code, token: created.token });
  const back = await again.next((m) => m.type === 'WELCOME');
  assert.equal(back.room.viewerHangman.pattern[0], 'O');
  assert.equal(back.room.viewerHangman.word, null);
  assert.equal(back.room.viewerHangman.lives, 5);
  host = again;

  host.send('HANGMAN_HINT', {});
  const hinted = await host.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.id === created.playerId)?.balance === 750);
  assert.match(hinted.room.viewerHangman.hint, /planet/i);
  const guestHidden = await guest.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.name === 'Ada')?.balance === 750);
  assert.equal(guestHidden.room.viewerHangman.hint, null);
  assert.equal(JSON.stringify(guestHidden.room).toLowerCase().includes('planet'), false);
  host.send('HANGMAN_HINT', {});
  assert.equal((await host.next((m) => m.type === 'ERROR')).code, 'DUPLICATE_PURCHASE');
  host.send('HANGMAN_ATTACK', { targetId: created.playerId });
  assert.equal((await host.next((m) => m.type === 'ERROR')).code, 'INVALID_TARGET');
  host.send('HANGMAN_ATTACK', {});
  assert.equal((await host.next((m) => m.type === 'ERROR')).code, 'INVALID_TARGET');
  host.send('HANGMAN_ATTACK', { targetId: joined.playerId });
  const attacked = await guest.next((m) => m.type === 'STATE' && m.room.viewerHangman?.lives === 5 && m.room.players?.find((p) => p.name === 'Ada')?.balance === 250);
  assert.equal(attacked.room.players.find((p) => p.name === 'Ada').balance, 250);
  host.send('HANGMAN_LETTER', {});
  assert.equal((await host.next((m) => m.type === 'ERROR')).code, 'INSUFFICIENT_CASH');
  guest.send('HANGMAN_LETTER', {});
  const bought = await guest.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.id === joined.playerId)?.balance === 600);
  assert.equal(bought.room.viewerHangman.pattern.some(Boolean), true);
  assert.equal(JSON.stringify(bought.room).includes('ORBIT'), false);

  for (const letter of ['R', 'B', 'I', 'T']) host.send('HANGMAN_GUESS', { letter });
  const solved = await host.next((m) => m.type === 'STATE' && m.room.viewerHangman?.solved);
  assert.equal(solved.room.viewerHangman.word, 'ORBIT');
  assert.equal(solved.room.viewerHangman.place, 1);
  assert.equal(solved.room.players.find((p) => p.name === 'Ada').balance, 600);
  const guestStillRacing = await guest.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.name === 'Ada')?.solvedWord);
  assert.equal(guestStillRacing.room.viewerHangman.word, null);

  const shopHost = client(url), shopGuest = client(url);
  await Promise.all([shopHost.open, shopGuest.open]);
  t.after(() => { shopHost.ws.close(); shopGuest.ws.close(); });
  shopHost.send('CREATE', { name: 'Cash' });
  const shopRoom = await shopHost.next((m) => m.type === 'WELCOME');
  shopGuest.send('JOIN', { name: 'Mark', code: shopRoom.room.code });
  const shopJoin = await shopGuest.next((m) => m.type === 'WELCOME');
  shopHost.send('START');
  const betting = await shopHost.next((m) => m.type === 'STATE' && m.room.phase === 'BETTING');
  assert.equal(betting.room.shop.find((offer) => offer.id === 'DOUBLE_DOWN').cost, hangman.EVENT_COSTS.DOUBLE_DOWN);
  shopHost.send('BUY_EVENT', { eventId: 'DOUBLE_DOWN' });
  const doubled = await shopHost.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.id === shopRoom.playerId)?.balance === 750);
  assert.match(doubled.room.lastEvent.message, /Double Down activated/);
  shopHost.send('BUY_EVENT', { eventId: 'DOUBLE_DOWN' });
  assert.equal((await shopHost.next((m) => m.type === 'ERROR')).code, 'DUPLICATE_PURCHASE');
  shopHost.send('BUY_EVENT', { eventId: 'MARKET_CRASH' });
  assert.equal((await shopHost.next((m) => m.type === 'ERROR')).code, 'UNKNOWN_EVENT');
  shopHost.send('BUY_EVENT', { eventId: 'BANK_HEIST', targetId: shopJoin.playerId });
  const heist = await shopGuest.next((m) => m.type === 'STATE' && m.room.players?.find((p) => p.id === shopJoin.playerId)?.balance === 900);
  assert.equal(heist.room.players.find((p) => p.name === 'Cash').balance, 350);
});
