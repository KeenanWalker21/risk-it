const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

async function freePort() {
  const server=net.createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}
function client(url) {
  const ws=new WebSocket(url),messages=[],waiters=[];
  ws.addEventListener('message',event=>{const message=JSON.parse(event.data);messages.push(message);const index=waiters.findIndex(waiter=>waiter.predicate(message));if(index>=0)waiters.splice(index,1)[0].resolve(message);});
  const next=(predicate,timeout=3000)=>{const previous=messages.find(predicate);if(previous)return Promise.resolve(previous);return new Promise((resolve,reject)=>{const waiter={predicate,resolve:value=>{clearTimeout(timer);resolve(value);}};const timer=setTimeout(()=>{const i=waiters.indexOf(waiter);if(i>=0)waiters.splice(i,1);reject(new Error('Timed out waiting for server message'));},timeout);waiters.push(waiter);});};
  return {ws,next,send:(type,data={})=>ws.send(JSON.stringify({type,...data})),open:new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});})};
}

test('lobby settings synchronize, lock at start, and kicked clients cannot rejoin',async t=>{
  const port=await freePort();
  const child=spawn(process.execPath,[path.join(__dirname,'..','server.js')],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port),RISKIT_TEST_FAST:'1'},stdio:['ignore','pipe','pipe']});
  let output='',host,guest,kickHost,victim,rejoinWithToken,rejoinWithId;
  child.stdout.on('data',chunk=>{output+=chunk.toString();});child.stderr.on('data',chunk=>{output+=chunk.toString();});
  t.after(()=>{for(const c of [host?.ws,guest?.ws,kickHost?.ws,victim?.ws,rejoinWithToken?.ws,rejoinWithId?.ws])if(c&&c.readyState<WebSocket.CLOSING)c.close();child.kill();});
  await new Promise((resolve,reject)=>{const started=Date.now();const poll=()=>{if(output.includes(`:${port}`))return resolve();if(child.exitCode!==null)return reject(new Error(output||'server exited'));if(Date.now()-started>5000)return reject(new Error(`Server did not start: ${output}`));setTimeout(poll,30);};poll();});
  const url=`ws://127.0.0.1:${port}`;
  host=client(url);guest=client(url);kickHost=client(url);victim=client(url);
  await Promise.all([host.open,guest.open,kickHost.open,victim.open]);
  host.send('CREATE',{name:'Host'});const hostRoom=await host.next(m=>m.type==='WELCOME');
  guest.send('JOIN',{name:'Guest',code:hostRoom.room.code});const guestRoom=await guest.next(m=>m.type==='WELCOME');
  assert.deepEqual(hostRoom.room.settings,{startingCash:1000,questionCount:1,gameMode:'CLASSIC',isCustom:true});
  guest.send('UPDATE_SETTINGS',{settings:{startingCash:2500}});
  assert.equal((await guest.next(m=>m.type==='ERROR')).code,'NOT_HOST');
  host.send('UPDATE_SETTINGS',{settings:{startingCash:2500}});
  const cashState=await guest.next(m=>m.type==='STATE'&&m.room.settings.startingCash===2500);
  assert.equal(cashState.room.settings.isCustom,true);
  host.send('UPDATE_SETTINGS',{settings:{questionCount:5}});
  const roundState=await guest.next(m=>m.type==='STATE'&&m.room.settings.questionCount===5);
  assert.equal(roundState.room.totalRounds,5);
  host.send('UPDATE_SETTINGS',{settings:{gameMode:'SUDDEN_DEATH'}});
  assert.equal((await host.next(m=>m.type==='ERROR')).code,'INVALID_SETTINGS');
  host.send('START');
  const started=await host.next(m=>m.type==='STATE'&&m.room.phase==='BETTING');
  assert.equal(started.room.players.every(p=>p.balance===2500),true);
  assert.equal(started.room.totalRounds,5);
  host.send('UPDATE_SETTINGS',{settings:{startingCash:500}});
  assert.equal((await host.next(m=>m.type==='ERROR'&&m.code==='SETTINGS_LOCKED')).code,'SETTINGS_LOCKED');

  kickHost.send('CREATE',{name:'Kick host'});const kickRoom=await kickHost.next(m=>m.type==='WELCOME');
  victim.send('JOIN',{name:'Target',code:kickRoom.room.code,clientId:'a'.repeat(32)});const victimRoom=await victim.next(m=>m.type==='WELCOME');
  victim.send('KICK',{targetId:kickRoom.playerId});
  assert.equal((await victim.next(m=>m.type==='ERROR')).code,'NOT_HOST');
  kickHost.send('KICK',{targetId:kickRoom.playerId});
  assert.equal((await kickHost.next(m=>m.type==='ERROR')).code,'CANNOT_KICK_HOST');
  kickHost.send('KICK',{targetId:victimRoom.playerId});
  assert.equal((await victim.next(m=>m.type==='KICKED')).message,'The host removed you from this room.');
  rejoinWithToken=client(url);await rejoinWithToken.open;
  rejoinWithToken.send('JOIN',{name:'Target',code:kickRoom.room.code,token:victimRoom.token,clientId:'a'.repeat(32)});
  assert.equal((await rejoinWithToken.next(m=>m.type==='ERROR')).code,'KICKED');
  rejoinWithId=client(url);await rejoinWithId.open;
  rejoinWithId.send('JOIN',{name:'Target',code:kickRoom.room.code,clientId:'a'.repeat(32)});
  assert.equal((await rejoinWithId.next(m=>m.type==='ERROR')).code,'KICKED');
});
