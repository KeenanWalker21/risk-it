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
  const ws = new WebSocket(url), messages = [], waiters = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data); messages.push(message);
    const index = waiters.findIndex(waiter => waiter.predicate(message));
    if (index >= 0) waiters.splice(index, 1)[0].resolve(message);
  });
  const next = (predicate, timeout = 3000) => {
    const previous = messages.find(predicate); if (previous) return Promise.resolve(previous);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve: value => { clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => { const i=waiters.indexOf(waiter); if(i>=0)waiters.splice(i,1); reject(new Error('Timed out waiting for server message')); },timeout);
      waiters.push(waiter);
    });
  };
  return { ws, next, send: (type, data={}) => ws.send(JSON.stringify({type,...data})), open: new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});}) };
}

test('moving a socket to another room releases the old seat and start needs two connected players', async t => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: '1' }, stdio: ['ignore','pipe','pipe']
  });
  let output='', hostA, guest, hostB;
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  t.after(() => { for (const socket of [hostA?.ws,guest?.ws,hostB?.ws]) if(socket&&socket.readyState<WebSocket.CLOSING)socket.close(); child.kill(); });
  await new Promise((resolve,reject)=>{
    const started=Date.now(); const poll=()=>{if(output.includes(`:${port}`))return resolve();if(child.exitCode!==null)return reject(new Error(output||'server exited'));if(Date.now()-started>5000)return reject(new Error(`Server did not start: ${output}`));setTimeout(poll,30);};poll();
  });
  const base=`http://127.0.0.1:${port}`;
  const badPath=await fetch(`${base}/%ZZ`);
  assert.equal(badPath.status,400);
  const socketUrl=`ws://127.0.0.1:${port}`;
  hostA=client(socketUrl);guest=client(socketUrl);hostB=client(socketUrl);
  await Promise.all([hostA.open,guest.open,hostB.open]);
  hostA.send('CREATE',{name:'Avery'});
  const roomA=await hostA.next(message=>message.type==='WELCOME');
  guest.send('JOIN',{name:'Riley',code:roomA.room.code});
  const firstSeat=await guest.next(message=>message.type==='WELCOME');
  hostB.send('CREATE',{name:'Morgan'});
  const roomB=await hostB.next(message=>message.type==='WELCOME');

  guest.send('JOIN',{name:'Riley',code:roomB.room.code,token:firstSeat.token});
  const moved=await guest.next(message=>message.type==='WELCOME'&&message.room.code===roomB.room.code);
  assert.notEqual(moved.playerId,firstSeat.playerId);
  await hostA.next(message=>message.type==='STATE'&&message.room.players.length===1);
  hostA.send('START');
  assert.equal((await hostA.next(message=>message.type==='ERROR')).code,'NEED_PLAYERS');
  const seated=await hostB.next(message=>message.type==='STATE'&&message.room.players.length===2);
  assert.ok(seated.room.players.some(player=>player.id===moved.playerId&&player.connected));
  hostB.send('START');
  assert.equal((await hostB.next(message=>message.type==='STATE'&&message.room.phase==='BETTING')).room.players.length,2);
  hostB.send('BET',{amount:100});
  guest.send('BET',{amount:100});
  const asking=await hostB.next(message=>message.type==='STATE'&&message.room.phase==='QUESTION');
  const question=questions.find(item=>item.question===asking.room.question.question);
  assert.ok(question);
  hostB.send('ANSWER',{answer:question.correctAnswer});
  guest.send('ANSWER',{answer:(question.correctAnswer+1)%4});
  const results=await hostB.next(message=>message.type==='STATE'&&message.room.phase==='RESULTS');
  assert.equal(results.room.players.find(player=>player.id===roomB.playerId).score,1);
  assert.equal(results.room.players.find(player=>player.id===moved.playerId).score,0);
});
