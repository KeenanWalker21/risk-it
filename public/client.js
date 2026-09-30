(() => {
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const store = { get(k) { try { return localStorage.getItem(`riskit.${k}`); } catch { return null; } }, set(k,v) { try { localStorage.setItem(`riskit.${k}`,v); } catch {} }, del(k) { try { localStorage.removeItem(`riskit.${k}`); } catch {} } };
  let socket, room = null, roomReceivedAt = Date.now(), playerId = store.get('playerId'), token = store.get('token'), roomCode = store.get('roomCode'), playerName = store.get('name') || '', clientId = store.get('clientId') || makeClientId(), autoReconnect = false, toastTimer;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = v => '$' + Number(v || 0).toLocaleString('en-US');
  function makeClientId() { try { return crypto.randomUUID().replace(/-/g,''); } catch { return Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join(''); } }
  const send = (type, data = {}) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...data })); };
  function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2800); }
  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${scheme}//${location.host}`);
    socket.addEventListener('open', () => {
      if (autoReconnect && roomCode && token) send('JOIN', { code: roomCode, name: playerName, token, clientId });
    });
    socket.addEventListener('message', ev => {
      let data; try { data = JSON.parse(ev.data); } catch { return; }
      if (data.type === 'ERROR') { if (data.code === 'KICKED') { kickedOut(data.message); return; } notify(data.message); if (data.code === 'ROOM_NOT_FOUND') { autoReconnect = false; } return; }
      if (data.type === 'KICKED') { kickedOut(data.message); return; }
      if (data.type === 'WELCOME') {
        autoReconnect = true;
        token = data.token; playerId = data.playerId; roomCode = data.room.code;
        clientId = data.clientId || clientId;
        store.set('token', token); store.set('playerId', playerId); store.set('roomCode', roomCode); store.set('name', playerName); store.set('clientId', clientId);
        room = data.room; roomReceivedAt = Date.now(); render(); return;
      }
      if (data.type === 'STATE') { room = data.room; roomReceivedAt = Date.now(); render(); }
    });
    socket.addEventListener('close', () => {
      if (autoReconnect && roomCode && token) {
        notify('Connection lost. Reconnecting…');
        setTimeout(connect, 1200);
      }
    });
    socket.addEventListener('error', () => socket.close());
  }
  function startCreate(name) { playerName = name; autoReconnect = false; store.set('name', name); connect(); const wait = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) { clearInterval(wait); send('CREATE', { name, clientId }); } }, 40); }
  function startJoin(name, code) { playerName = name; roomCode = code.toUpperCase(); autoReconnect = false; store.set('name', name); connect(); const wait = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) { clearInterval(wait); send('JOIN', { name, code: roomCode, token, clientId }); } }, 40); }
  function showHome() {
    room = null;
    app.innerHTML = `<section class="home-shell"><header class="topbar"><a class="brand" href="/"><span class="brand-mark">R</span><span>RISK<span class="brand-light"> IT</span></span></a><span class="top-note"><i></i> LIVE TRIVIA, HIGHER STAKES</span></header><div class="hero"><div class="hero-copy"><div class="eyebrow"><span>THE GAME OF</span> KNOWING WHEN TO RISK IT</div><h1>Know it.<br><em>Bet on it.</em></h1><p>Ten questions. One shot at the top. Put your money where your mind is.</p><div class="hero-tags"><span>✦ &nbsp;2–12 players</span><span>◷ &nbsp;10 quick rounds</span><span>♢ &nbsp;Play for bragging rights</span></div></div><div class="entry-card"><div class="card-kicker">JUMP INTO THE ACTION</div><h2>Ready to risk it?</h2><label class="field-label" for="player-name">YOUR NAME</label><input id="player-name" maxlength="18" placeholder="What should we call you?" autocomplete="nickname" value="${esc(playerName)}"><button class="button button-primary full" id="create-btn"><span>CREATE A GAME</span><span>↗</span></button><div class="divider"><span>OR JOIN YOUR CREW</span></div><label class="field-label" for="room-code">ROOM CODE</label><div class="join-row"><input id="room-code" maxlength="6" placeholder="E.G. X7K92A" autocomplete="off"><button class="button button-secondary" id="join-btn">JOIN <span>→</span></button></div><p class="entry-error" id="entry-error" aria-live="polite"></p></div></div><footer class="home-footer"><span>GOOD INSTINCTS. QUESTIONABLE BETS.</span><span>NO ACCOUNTS. JUST FRIENDS &amp; FORTUNE.</span></footer></section>`;
    document.querySelector('#create-btn').onclick = () => { const name = cleanName(); if (name) startCreate(name); };
    document.querySelector('#join-btn').onclick = () => { const name = cleanName(); const code = document.querySelector('#room-code').value.trim(); if (!name) return; if (code.length !== 6) { entryError('Enter a 6-character room code.'); return; } startJoin(name, code); };
    document.querySelector('#room-code').addEventListener('input', e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''));
    for (const selector of ['#player-name','#room-code']) document.querySelector(selector).addEventListener('keydown', e => { if (e.key === 'Enter') (selector === '#player-name' ? document.querySelector('#create-btn') : document.querySelector('#join-btn')).click(); });
  }
  function cleanName() { const input = document.querySelector('#player-name'); const value = input.value.trim(); if (!value) { entryError('Add your name to get started.'); input.focus(); return null; } return value.slice(0,18); }
  function entryError(text) { document.querySelector('#entry-error').textContent = text; }
  function kickedOut(message) {
    autoReconnect=false; store.del('token');store.del('playerId');store.del('roomCode');
    token=null;playerId=null;roomCode=null;room=null;
    if(socket&&socket.readyState===WebSocket.OPEN)socket.close();
    showHome(); notify(message || 'The host removed you from this room.');
  }
  function leaderboard() { return `<aside class="leaderboard"><div class="leader-head"><span class="leader-title">LEADERBOARD</span><span class="live">LIVE</span></div><div class="leader-list">${room.players.map((p,i)=>`<div class="leader-row ${p.connected?'':'disconnected'}"><span class="leader-rank">${String(i+1).padStart(2,'0')}</span><span class="leader-name">${esc(p.name)}${p.id===room.viewerId?' <small>YOU</small>':''}${p.isHost?' <small>HOST</small>':''}${!p.connected?' <small>OFFLINE</small>':''}</span><span class="leader-money">${money(p.balance)}</span></div>`).join('')}</div><div class="leader-hint">Your balance is your score.<br>Make it count.</div></aside>`; }
  function header() { return `<header class="game-top"><a class="brand" href="#"><span class="brand-mark">R</span><span>RISK<span class="brand-light"> IT</span></span></a><div class="game-top-right"><span class="phase-chip">${esc(room.phase)}</span>${room.phase !== 'LOBBY' && room.phase !== 'FINAL' ? `<span class="round-pill">ROUND ${room.round} / ${room.totalRounds}</span>` : ''}<button class="icon-btn" id="leave-btn" title="Leave or return home">LEAVE&nbsp; ↗</button></div></header>`; }
  function countdown() { const serverNow = (room.serverNow || Date.now()) + (Date.now() - roomReceivedAt); const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - serverNow) / 1000)) : 0; return `<div class="timer-wrap"><div class="timer ${left<=3?'urgent':''}" id="timer">${String(left).padStart(2,'0')}</div><div class="timer-label">SECONDS</div></div>`; }
  function progress() { return `<div class="round-progress">${Array.from({length:room.totalRounds},(_,i)=>`<span class="${i<room.round?'done':''}"></span>`).join('')}</div>`; }
  function lobby() {
    const isHost = room.viewerId === room.hostId;
    const online = room.players.filter(p=>p.connected).length;
    const settings=room.settings;
    const optionList=(values,selected,prefix='')=>values.map(value=>`<option value="${value}" ${value===selected?'selected':''}>${prefix}${Number(value).toLocaleString('en-US')}</option>`).join('');
    return `${header()}<section class="lobby-wrap"><div class="eyebrow"><span>YOUR TABLE IS READY</span></div><h1 class="lobby-title">Bring your <em>best guess.</em></h1><p class="lobby-sub">Share your room code and get the crew together.</p><div class="room-code-box"><span class="room-label">ROOM CODE</span><strong>${esc(room.code)}</strong><button id="copy-code">COPY ⧉</button></div><div class="lobby-panel"><div class="lobby-panel-head"><h2>AT THE TABLE</h2><span class="player-count">${online} ONLINE · ${room.players.length} / 12 SEATS</span></div><div class="lobby-players">${room.players.map(p=>`<div class="lobby-player"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><span class="lobby-player-name">${esc(p.name)}</span>${p.isHost?'<span class="host-tag">HOST</span>':''}${!p.connected?'<span class="host-tag">OFFLINE</span>':''}${isHost&&p.id!==room.hostId?`<button class="kick-btn" data-kick="${esc(p.id)}" title="Remove ${esc(p.name)}">KICK</button>`:''}</div>`).join('')}</div>${isHost?`<div class="settings-box"><div class="settings-heading"><span>GAME SETTINGS</span><span class="match-tag ${settings.isCustom?'custom':''}">${settings.isCustom?'CUSTOM MATCH':'STANDARD MATCH'}</span></div><div class="settings-grid"><label class="setting-item"><span>STARTING CASH</span><select data-setting="startingCash">${optionList([500,1000,2500,5000,10000],settings.startingCash,'$')}</select></label><label class="setting-item"><span>QUESTIONS</span><select data-setting="questionCount">${optionList([5,10,15,20,25],settings.questionCount)}</select></label><div class="setting-item setting-mode"><span>GAME MODE</span><strong>CLASSIC</strong><small>More modes unlock as they’re implemented.</small></div></div></div>`:`<div class="settings-box"><div class="settings-heading"><span>GAME SETTINGS</span><span class="match-tag ${settings.isCustom?'custom':''}">${settings.isCustom?'CUSTOM MATCH':'STANDARD MATCH'}</span></div><div class="settings-readonly"><span>${money(settings.startingCash)} starting cash</span><span>${settings.questionCount} questions</span><span>Classic mode</span></div></div>`}<div class="lobby-bottom"><span class="lobby-note">${isHost?(online<2?'Waiting for one more connected player.':'Everyone in? You’re in charge.'):'Waiting for the host to start the game.'}</span>${isHost?`<button class="button start-btn" id="start-btn" ${online<2?'disabled':''}>START GAME &nbsp; →</button>`:''}</div></div></section>`;
  }
  function bets() {
    const me = room.players.find(p=>p.id===room.viewerId); const locked = me?.hasBet;
    const options = [{text:'$50',amount:50},{text:'$100',amount:100},{text:'$250',amount:250},{text:'$500',amount:500},{text:'ALL IN',amount:me?.balance||0}];
    return `<h2 class="bet-title">How much are you risking?</h2><p class="bet-copy">You only need to be right once. Lock in your wager.</p><div class="bet-options">${options.map(o=>{const unavailable=locked||o.amount>(me?.balance||0);return `<button class="bet-button ${locked&&me.bet===o.amount?'selected':''} ${locked?'locked':''}" data-bet="${o.amount}" ${unavailable?'disabled':''}>${o.text}</button>`;}).join('')}</div><div class="bet-lock">${locked?`WAGER LOCKED · ${money(me.bet)} ON THE LINE`:'PICK YOUR BET · ONCE IT’S IN, IT’S IN'}</div>`;
  }
  function answers() {
    const q=room.question, me=room.players.find(p=>p.id===room.viewerId); const letters=['A','B','C','D'];
    return `<div class="answers">${q.answers.map((a,i)=>{let cls='answer-btn';if(me?.answer===i)cls+=' chosen';if(room.phase==='RESULTS'&&i===room.result.correctAnswer)cls+=' correct';else if(room.phase==='RESULTS'&&me?.answer===i)cls+=' wrong';return `<button class="${cls}" data-answer="${i}" ${room.phase!=='QUESTION'||me?.hasAnswered?'disabled':''}><span class="answer-key">${letters[i]}</span><span class="answer-text">${esc(a)}</span>${room.phase==='RESULTS'&&i===room.result.correctAnswer?'<span class="answer-result">CORRECT</span>':''}</button>`;}).join('')}</div>`;
  }
  function results() {
    const me=room.players.find(p=>p.id===room.viewerId); const success=me?.correct;
    return `<div class="result-banner ${success?'':'wrong-banner'}"><div class="result-symbol">${success?'↗':'↘'}</div><div class="result-headline">${success?'That’s the one.':'Not this time.'}</div><div class="result-copy">The correct answer was <strong>${esc(room.result.correctText)}</strong> · ${me?.change >= 0?'+':'−'}${money(Math.abs(me?.change||0))} · New balance ${money(me?.balance)}</div></div>`;
  }
  function game() {
    const me=room.players.find(p=>p.id===room.viewerId); const phase=room.phase;
    let main='';
    if(phase==='BETTING') main=`<div class="game-card"><div class="game-card-head"><span class="category">${esc(room.question?.category||'PLACE YOUR BET')}</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div>${bets()}</div>`;
    else if(phase==='QUESTION'||phase==='RESULTS') main=`<div class="game-card"><div class="game-card-head"><span class="category">${esc(room.question?.category||'GENERAL KNOWLEDGE')} · ${esc(room.question?.difficulty||'')}</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div>${phase==='RESULTS'?results():''}<h2 class="question-title">${esc(room.question.question)}</h2>${answers()}<div class="phase-message">${phase==='QUESTION'?(me?.hasAnswered?'✓ &nbsp; ANSWER LOCKED · WAITING FOR THE TABLE':'Choose your answer before time runs out.'):'NEXT ROUND IN A MOMENT'}</div></div>`;
    return `${header()}<div class="game-content"><section class="play-column"><div class="balance-panel"><div><div class="overline">YOUR BALANCE</div><div class="balance-value">${money(me?.balance)}</div>${progress()}</div>${countdown()}</div>${main}</section>${leaderboard()}</div>`;
  }
  function final() {
    const winner=room.players.find(p=>p.id===room.winnerId); const isHost=room.viewerId===room.hostId;
    return `<div class="final-wrap"><div class="trophy">🏆</div><div class="overline">${room.totalRounds} ROUNDS. ONE WINNER.</div><h1>GAME <em>OVER</em></h1><div class="overline">THE ONE WHO RISKED IT ALL</div><div class="winner-name">${esc(winner?.name||'No winner')}</div><div class="winner-money">${money(winner?.balance)}</div><div class="final-table"><div class="leader-head"><span class="leader-title">FINAL STANDINGS</span><span class="player-count">${room.players.length} PLAYERS</span></div><div class="leader-list">${room.players.map((p,i)=>`<div class="leader-row"><span class="leader-rank">${String(i+1).padStart(2,'0')}</span><span class="leader-name">${esc(p.name)}${p.id===room.viewerId?' <small>YOU</small>':''}</span><span class="leader-money">${money(p.balance)}</span></div>`).join('')}</div></div><div class="final-actions">${isHost?'<button class="button" id="play-again">PLAY AGAIN &nbsp; ↻</button>':''}<button class="button button-secondary" id="return-home">RETURN HOME</button></div>${!isHost?'<div class="phase-message"><span class="waiting-dot"></span>HOST CAN START ANOTHER GAME</div>':''}</div>`;
  }
  function render() {
    if (!room) return showHome();
    if (room.phase==='FINAL') { app.innerHTML=`<section class="game-shell">${header()}${final()}</section>`; }
    else if (room.phase==='LOBBY') { app.innerHTML=`<section class="game-shell">${lobby()}</section>`; }
    else { app.innerHTML=`<section class="game-shell">${game()}</section>`; }
    document.querySelector('#leave-btn')?.addEventListener('click', leaveRoom);
    document.querySelector('#copy-code')?.addEventListener('click', async()=>{try{await navigator.clipboard.writeText(room.code);notify('Room code copied.');}catch{notify(`Room code: ${room.code}`);}});
    document.querySelector('#start-btn')?.addEventListener('click',()=>send('START'));
    document.querySelectorAll('[data-setting]').forEach(select=>select.addEventListener('change',()=>send('UPDATE_SETTINGS',{settings:{[select.dataset.setting]:Number(select.value)}})));
    document.querySelectorAll('[data-kick]').forEach(button=>button.addEventListener('click',()=>send('KICK',{targetId:button.dataset.kick})));
    document.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>send('BET',{amount:Number(b.dataset.bet)})));
    document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>send('ANSWER',{answer:Number(b.dataset.answer)})));
    document.querySelector('#play-again')?.addEventListener('click',()=>send('PLAY_AGAIN'));
    document.querySelector('#return-home')?.addEventListener('click',leaveRoom);
    clearInterval(window.riskTimer); window.riskTimer=setInterval(()=>{const el=document.querySelector('#timer');if(el&&room?.deadline){const serverNow=(room.serverNow||Date.now())+(Date.now()-roomReceivedAt);const sec=Math.max(0,Math.ceil((room.deadline-serverNow)/1000));el.textContent=String(sec).padStart(2,'0');el.classList.toggle('urgent',sec<=3);}},200);
  }
  function leaveRoom() {
    autoReconnect=false; send('LEAVE'); store.del('token');store.del('playerId');store.del('roomCode');token=null;playerId=null;roomCode=null;room=null;
    if(socket&&socket.readyState===WebSocket.OPEN)socket.close(); showHome();
  }
  document.addEventListener('click',e=>{if(e.target?.id==='create-btn'||e.target?.id==='join-btn'){} });
  if (roomCode && token) { autoReconnect=true; connect(); }
  else { showHome(); }
})();
