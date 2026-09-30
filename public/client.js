(() => {
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const store = { get(k) { try { return localStorage.getItem(`riskit.${k}`); } catch { return null; } }, set(k,v) { try { localStorage.setItem(`riskit.${k}`,v); } catch {} }, del(k) { try { localStorage.removeItem(`riskit.${k}`); } catch {} } };
  let socket, room = null, roomReceivedAt = Date.now(), playerId = store.get('playerId'), token = store.get('token'), roomCode = store.get('roomCode'), playerName = store.get('name') || '', clientId = store.get('clientId') || makeClientId(), autoReconnect = false, toastTimer, chatDraft = '', chatOpen = false, settingsNotice = '', sessionToken = store.get('session'), accountUser = store.get('session') && store.get('accountName') ? { username: store.get('accountName') } : null, accountMode = 'hidden';
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
      if (sessionToken) send('SESSION', { sessionToken });
      if (autoReconnect && roomCode && token) send('JOIN', { code: roomCode, name: playerName, token, clientId });
    });
    socket.addEventListener('message', ev => {
      let data; try { data = JSON.parse(ev.data); } catch { return; }
      if (data.type === 'ERROR') {
        if (data.code === 'KICKED') { kickedOut(data.message); return; }
        if (data.code === 'INVALID_SETTINGS') settingsNotice = data.message;
        notify(data.message);
        if ((data.code === 'ROOM_NOT_FOUND' || data.code === 'GAME_IN_PROGRESS') && !room) {
          autoReconnect = false;
          if (data.code === 'ROOM_NOT_FOUND') { store.del('token'); store.del('playerId'); store.del('roomCode'); token = null; playerId = null; roomCode = null; }
          showHome();
        }
        if (data.code === 'INVALID_SETTINGS' && room?.phase === 'LOBBY') render();
        return;
      }
      if (data.type === 'KICKED') { kickedOut(data.message); return; }
      if (data.type === 'ACCOUNT') {
        accountUser = data.user; accountMode = 'hidden';
        if (data.sessionToken) { sessionToken = data.sessionToken; store.set('session', sessionToken); }
        store.set('accountName', data.user.username);
        if (!playerName) playerName = data.user.username;
        if (!room) showHome();
        return;
      }
      if (data.type === 'LOGGED_OUT') {
        accountUser = null; sessionToken = null; accountMode = 'hidden';
        store.del('session'); store.del('accountName');
        if (!room) showHome();
        return;
      }
      if (data.type === 'WELCOME') {
        settingsNotice = '';
        clearTimeout(toastTimer); toast.classList.remove('show');
        autoReconnect = true;
        token = data.token; playerId = data.playerId; roomCode = data.room.code;
        clientId = data.clientId || clientId;
        store.set('token', token); store.set('playerId', playerId); store.set('roomCode', roomCode); store.set('name', playerName); store.set('clientId', clientId);
        room = data.room; roomReceivedAt = Date.now(); render(); return;
      }
      if (data.type === 'STATE') { settingsNotice = ''; room = data.room; roomReceivedAt = Date.now(); render(); }
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
  function accountBox() {
    if (accountUser) return `<div class="account-box"><span>SIGNED IN AS <strong>${esc(accountUser.username)}</strong></span><button type="button" id="logout-btn">LOG OUT</button></div>`;
    const form = accountMode === 'signup'
      ? `<form id="account-form"><label class="field-label" for="account-user">USERNAME</label><input id="account-user" maxlength="16" autocomplete="username"><label class="field-label" for="account-email">EMAIL</label><input id="account-email" type="email" maxlength="120" autocomplete="email"><label class="field-label" for="account-password">PASSWORD</label><input id="account-password" type="password" maxlength="72" autocomplete="new-password"><button class="button button-secondary full" type="submit">CREATE ACCOUNT</button></form>`
      : accountMode === 'login'
      ? `<form id="account-form"><label class="field-label" for="account-user">USERNAME OR EMAIL</label><input id="account-user" maxlength="120" autocomplete="username"><label class="field-label" for="account-password">PASSWORD</label><input id="account-password" type="password" maxlength="72" autocomplete="current-password"><button class="button button-secondary full" type="submit">LOG IN</button></form>`
      : '';
    return `<div class="account-box"><div class="account-actions"><button type="button" id="show-login">LOG IN</button><button type="button" id="show-signup">SIGN UP</button><span>OR CONTINUE AS A GUEST</span></div>${form}</div>`;
  }
  function bindAccount() {
    document.querySelector('#show-login')?.addEventListener('click', () => { accountMode = accountMode === 'login' ? 'hidden' : 'login'; showHome(); });
    document.querySelector('#show-signup')?.addEventListener('click', () => { accountMode = accountMode === 'signup' ? 'hidden' : 'signup'; showHome(); });
    document.querySelector('#logout-btn')?.addEventListener('click', () => { connect(); const wait = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) { clearInterval(wait); send('LOGOUT', { sessionToken }); } }, 40); });
    document.querySelector('#account-form')?.addEventListener('submit', event => {
      event.preventDefault();
      const username = document.querySelector('#account-user').value.trim();
      const password = document.querySelector('#account-password').value;
      const email = document.querySelector('#account-email')?.value.trim();
      connect();
      const wait = setInterval(() => { if (socket?.readyState === WebSocket.OPEN) { clearInterval(wait); send(accountMode === 'signup' ? 'SIGNUP' : 'LOGIN', { username, email, password }); } }, 40);
    });
  }
  function showHome() {
    room = null;
    app.innerHTML = `<section class="home-shell"><header class="topbar"><a class="brand" href="/"><span class="brand-mark">R</span><span>RISK<span class="brand-light"> IT</span></span></a><span class="top-note"><i></i> LIVE TRIVIA, HIGHER STAKES</span></header><div class="hero"><div class="hero-copy"><div class="eyebrow"><span>THE GAME OF</span> KNOWING WHEN TO RISK IT</div><h1>Know it.<br><em>Bet on it.</em></h1><p>Ten questions. One shot at the top. Put your money where your mind is.</p><div class="hero-tags"><span>✦ &nbsp;2–12 players</span><span>◷ &nbsp;10 quick rounds</span><span>♢ &nbsp;Play for bragging rights</span></div></div><div class="entry-card"><div class="card-kicker">JUMP INTO THE ACTION</div><h2>Ready to risk it?</h2>${accountBox()}<label class="field-label" for="player-name">YOUR NAME</label><input id="player-name" maxlength="18" placeholder="What should we call you?" autocomplete="nickname" value="${esc(playerName)}"><button class="button button-primary full" id="create-btn"><span>CREATE A GAME</span><span>↗</span></button><div class="divider"><span>OR JOIN YOUR CREW</span></div><label class="field-label" for="room-code">ROOM CODE</label><div class="join-row"><input id="room-code" maxlength="6" placeholder="E.G. X7K92A" autocomplete="off"><button class="button button-secondary" id="join-btn">JOIN <span>→</span></button></div><p class="entry-error" id="entry-error" aria-live="polite"></p></div></div><footer class="home-footer"><span>GOOD INSTINCTS. QUESTIONABLE BETS.</span><span>PLAY AS A GUEST, OR SAVE YOUR NAME.</span></footer></section>`;
    document.querySelector('#room-code').addEventListener('input', e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''));
    for (const selector of ['#player-name','#room-code']) document.querySelector(selector).addEventListener('keydown', e => { if (e.key === 'Enter') (selector === '#player-name' ? document.querySelector('#create-btn') : document.querySelector('#join-btn')).click(); });
    bindAccount();
  }
  function cleanName() { const input = document.querySelector('#player-name'); const value = input.value.trim(); if (!value) { entryError('Add your name to get started.'); input.focus(); return null; } return value.slice(0,18); }
  function entryError(text) { document.querySelector('#entry-error').textContent = text; }
  function kickedOut(message) {
    autoReconnect=false; store.del('token');store.del('playerId');store.del('roomCode');
    token=null;playerId=null;roomCode=null;room=null;
    if(socket&&socket.readyState===WebSocket.OPEN)socket.close();
    showHome(); notify(message || 'The host removed you from this room.');
  }
  function chatBox() {
    const messages = room.chat || [];
    const lines = messages.map(m => `<p><strong>${esc(m.name)}</strong> ${esc(m.text)}</p>`).join('') || '<p class="chat-empty">The table is quiet.</p>';
    return `<aside class="chat-panel ${chatOpen ? 'open' : ''}" id="chat-drawer"><button type="button" class="chat-toggle" id="chat-toggle">CHAT${messages.length ? ` · ${messages.length}` : ''}</button><div class="chat-body"><div class="chat-log">${lines}</div><form id="chat-form"><input id="chat-input" maxlength="200" placeholder="Type a message..." value="${esc(chatDraft)}" autocomplete="off"><button type="submit">SEND</button></form></div></aside>`;
  }
  const GAME_MODES = [['CLASSIC','Classic Risk It','Answer, wager, and finish with the most cash.'],['LAST_STANDING','Last Player Standing','Hit $0 and you are out. Last player with cash wins.'],['SPEED','Speed Risk','Shorter timers for a fast game.'],['SUDDEN_DEATH','Sudden Death','One wrong answer wipes your balance.'],['HIGH_ROLLER','High Roller','A large bankroll and bigger wagers.'],['SURVIVAL','Survival','Questions get harder as you go.'],['HEAD_TO_HEAD','Head-to-Head','Exactly two players, with larger minimum wagers.'],['TEAM_BATTLE','Team Battle','Two teams share one bankroll.'],['IMPOSTER','Imposter','One player secretly sees the answer.'],['COMEBACK','Comeback','Players behind the leader earn double.'],['JACKPOT','Jackpot','A shared pot is awarded on the last question.'],['REVERSE','Reverse Risk','Even rounds pay you for a wrong answer.'],['AUCTION','Auction','The high bid earns the only answer.'],['TREASURE','Treasure Hunt','Correct answers build clues and a final prize.'],['CUSTOM','Custom Match','Set cash, timers, categories, and events.']];
  const MATCH_EVENTS = [['DOUBLE_DOWN','Double Down'],['MARKET_CRASH','Market Crash'],['CASH_DROP','Cash Drop'],['TAX_COLLECTOR','Tax Collector'],['JACKPOT','Jackpot'],['REVIVAL','Revival'],['BANK_HEIST','Bank Heist'],['ALL_IN','All-In'],['LIGHTNING','Lightning Round'],['BOUNTY','Bounty'],['KINGS_CROWN',"King's Crown"],['STEAL','Steal Chance'],['CHAOS','Chaos Round'],['HIDDEN_RULE','Hidden Rule'],['RISK_STORM','Risk Storm'],['FINAL_GAMBLE','Final Gamble']];
  const QUESTION_CATEGORIES = ['General Knowledge','Science','History','Sports','Technology','Entertainment','Geography'];
  function settingsBox(isHost, settings) {
    const mode = GAME_MODES.find(item => item[0] === settings.gameMode) || GAME_MODES[0];
    const eventCount = MATCH_EVENTS.filter(([id]) => settings.events?.[id]).length;
    if (!isHost) return `<div class="settings-box"><div class="settings-heading"><span>GAME SETTINGS</span><span class="match-tag ${settings.isCustom?'custom':''}">${settings.isCustom?'CUSTOM MATCH':'STANDARD MATCH'}</span></div><div class="settings-readonly"><span>${esc(settings.modeLabel || mode[1])}</span><span>${esc(settings.difficulty || 'ANY')} difficulty</span><span>${money(settings.startingCash)} starting cash</span><span>${settings.questionCount} questions</span><span>${eventCount} events</span></div><p class="mode-copy">${esc(mode[2])}</p></div>`;
    const options = (values, selected, prefix='') => values.map(value => `<option value="${value}" ${value===selected?'selected':''}>${prefix}${typeof value==='number'?Number(value).toLocaleString('en-US'):value}</option>`).join('');
    const custom = settings.gameMode === 'CUSTOM' ? `<div class="settings-grid"><label class="setting-item"><span>BET TIMER</span><select data-setting="betSeconds">${options([3,5,10,15], settings.betSeconds)}</select></label><label class="setting-item"><span>QUESTION TIMER</span><select data-setting="questionSeconds">${options([5,7,15,20,30], settings.questionSeconds)}</select></label><label class="setting-item"><span>RESULTS TIMER</span><select data-setting="resultsSeconds">${options([3,5], settings.resultsSeconds)}</select></label></div><label class="check-row"><input id="eliminate-toggle" type="checkbox" ${settings.eliminateAtZero!==false?'checked':''}> Eliminate at $0</label><div class="category-row">${QUESTION_CATEGORIES.map(category => `<label class="check-row"><input type="checkbox" data-category="${esc(category)}" ${(settings.categories||[]).includes(category)?'checked':''}> ${esc(category)}</label>`).join('')}</div>` : '';
    return `<div class="settings-box"><div class="settings-heading"><span>GAME SETTINGS</span><span class="match-tag ${settings.isCustom?'custom':''}">${settings.isCustom?'CUSTOM MATCH':'STANDARD MATCH'}</span></div><div class="settings-grid"><label class="setting-item"><span>GAME MODE</span><select data-setting="gameMode">${GAME_MODES.map(([id,label]) => `<option value="${id}" ${id===settings.gameMode?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="setting-item"><span>DIFFICULTY</span><select data-setting="difficulty">${options(['ANY','EASY','MEDIUM','HARD'], settings.difficulty || 'ANY')}</select></label><label class="setting-item"><span>STARTING CASH</span><select data-setting="startingCash">${options([500,1000,2500,5000,10000], settings.startingCash, '$')}</select></label><label class="setting-item"><span>QUESTIONS</span><select data-setting="questionCount">${options([5,10,15,20,25], settings.questionCount)}</select></label></div><p class="mode-copy">${esc(mode[2])}</p>${custom}<details class="event-drawer" open><summary>EVENTS · ${eventCount} ON</summary><div class="event-grid">${MATCH_EVENTS.map(([id,label]) => `<label class="check-row"><input type="checkbox" data-event="${id}" ${settings.events?.[id]?'checked':''}> ${esc(label)}</label>`).join('')}</div></details></div>`;
  }
  function leaderboard() { return `<aside class="leaderboard"><div class="leader-head"><span class="leader-title">LEADERBOARD</span><span class="live">LIVE</span></div><div class="leader-list">${room.players.map((p,i)=>`<div class="leader-row ${p.connected?'':'disconnected'}"><span class="leader-rank">${String(i+1).padStart(2,'0')}</span><span class="leader-name">${esc(p.name)}${p.id===room.viewerId?' <small>YOU</small>':''}${p.isHost?' <small>HOST</small>':''}${p.team?` <small>TEAM ${esc(p.team)}</small>`:''}${p.spectating?' <small>SPECTATING</small>':''}${!p.connected?' <small>OFFLINE</small>':''}</span><span class="leader-money">${money(p.balance)}</span></div>`).join('')}</div><div class="leader-hint">${room.pot?`Pot ${money(room.pot)}<br>`:''}Your balance is your score.<br>Make it count.</div></aside>`; }
  function header() { return `<header class="game-top"><a class="brand" href="#"><span class="brand-mark">R</span><span>RISK<span class="brand-light"> IT</span></span></a><div class="game-top-right"><span class="phase-chip">${esc(room.phase)}</span>${room.phase !== 'LOBBY' && room.phase !== 'FINAL' ? `<span class="round-pill">ROUND ${room.round} / ${room.totalRounds}</span>` : ''}<button class="icon-btn" id="leave-btn" title="Leave or return home">LEAVE&nbsp; ↗</button></div></header>`; }
  function countdown() { const serverNow = (room.serverNow || Date.now()) + (Date.now() - roomReceivedAt); const left = room.deadline ? Math.max(0, Math.ceil((room.deadline - serverNow) / 1000)) : 0; return `<div class="timer-wrap"><div class="timer ${left<=3?'urgent':''}" id="timer">${String(left).padStart(2,'0')}</div><div class="timer-label">SECONDS</div></div>`; }
  function progress() { return `<div class="round-progress">${Array.from({length:room.totalRounds},(_,i)=>`<span class="${i<room.round?'done':''}"></span>`).join('')}</div>`; }
  function lobby() {
    const isHost = room.viewerId === room.hostId;
    const online = room.players.filter(p=>p.connected).length;
    const settings=room.settings;
    const headToHead = settings?.gameMode === 'HEAD_TO_HEAD';
    const canStart = online >= 2 && (!headToHead || online === 2);
    const startReason = settingsNotice || (online < 2 ? 'Waiting for one more connected player.' : headToHead && online !== 2 ? 'Head-to-Head needs exactly two connected players.' : 'Everyone in? You’re in charge.');
    return `${header()}<section class="lobby-wrap"><div class="eyebrow"><span>YOUR TABLE IS READY</span></div><h1 class="lobby-title">Bring your <em>best guess.</em></h1><p class="lobby-sub">Share your room code and get the crew together.</p><div class="room-code-box"><span class="room-label">ROOM CODE</span><strong>${esc(room.code)}</strong><button id="copy-code">COPY ⧉</button></div><div class="lobby-panel"><div class="lobby-panel-head"><h2>AT THE TABLE</h2><span class="player-count">${online} ONLINE · ${room.players.length} / 12 SEATS</span></div><div class="lobby-players">${room.players.map(p=>`<div class="lobby-player"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><span class="lobby-player-name">${esc(p.name)}</span>${p.isHost?'<span class="host-tag">HOST</span>':''}${!p.connected?'<span class="host-tag">OFFLINE</span>':''}${isHost&&p.id!==room.hostId?`<button class="kick-btn" data-kick="${esc(p.id)}" title="Remove ${esc(p.name)}">KICK</button>`:''}</div>`).join('')}</div>${settingsBox(isHost, settings)}<div class="lobby-bottom"><span class="lobby-note">${isHost?startReason:'Waiting for the host to start the game.'}</span>${isHost?`<button class="button start-btn" id="start-btn" ${canStart?'':'disabled'}>START GAME &nbsp; →</button>`:''}</div></div>${chatBox()}</section>`;
  }
  function bets() {
    const me = room.players.find(p=>p.id===room.viewerId); const locked = me?.hasBet;
    if (me?.spectating && !room.roundEvent?.openToAll) return `<h2 class="bet-title">You’re spectating</h2><p class="bet-copy">You’re out of cash. A jackpot or revival can bring you back in.</p>`;
    const options = (room.viewerWagers || []).map(amount => ({ text: amount === me?.balance ? 'ALL IN' : money(amount), amount }));
    return `<h2 class="bet-title">${room.settings?.gameMode==='AUCTION'?'What is your bid?':'How much are you risking?'}</h2><p class="bet-copy">${room.roundEvent?.reverse?'This one pays if you are wrong.':'You only need to be right once. Lock in your wager.'}</p><div class="bet-options">${options.map(o=>{const unavailable=locked||o.amount>(me?.balance||0);return `<button class="bet-button ${locked&&me.bet===o.amount?'selected':''} ${locked?'locked':''}" data-bet="${o.amount}" ${unavailable?'disabled':''}>${o.text}</button>`;}).join('')}</div><div class="bet-lock">${locked?`WAGER LOCKED · ${money(me.bet)} ON THE LINE`:'PICK YOUR BET · ONCE IT’S IN, IT’S IN'}</div>`;
  }
  function answers() {
    const q=room.question, me=room.players.find(p=>p.id===room.viewerId); const letters=['A','B','C','D'];
    return `<div class="answers">${q.answers.map((a,i)=>{let cls='answer-btn';if(me?.answer===i)cls+=' chosen';if(room.phase==='RESULTS'&&i===room.result.correctAnswer)cls+=' correct';else if(room.phase==='RESULTS'&&me?.answer===i)cls+=' wrong';const closed=room.phase!=='QUESTION'||!room.viewerCanAnswer||me?.hasAnswered;return `<button class="${cls}" data-answer="${i}" ${closed?'disabled':''}><span class="answer-key">${letters[i]}</span><span class="answer-text">${esc(a)}</span>${room.phase==='RESULTS'&&i===room.result.correctAnswer?'<span class="answer-result">CORRECT</span>':''}</button>`;}).join('')}</div>`;
  }
  function results() {
    const me=room.players.find(p=>p.id===room.viewerId); const success=me?.correct;
    if (me?.spectating && !me?.hasAnswered && !room.roundEvent?.openToAll) return `<div class="result-banner"><div class="result-headline">You’re still spectating.</div><div class="result-copy">The correct answer was <strong>${esc(room.result.correctText)}</strong>.</div></div>`;
    return `<div class="result-banner ${success?'':'wrong-banner'}"><div class="result-symbol">${success?'↗':'↘'}</div><div class="result-headline">${success?'That’s the one.':'Not this time.'}</div><div class="result-copy">The correct answer was <strong>${esc(room.result.correctText)}</strong> · ${me?.change >= 0?'+':'−'}${money(Math.abs(me?.change||0))} · New balance ${money(me?.balance)}</div></div>`;
  }
  function eventBanner() { const event = room.roundEvent; if (!event?.title) return ''; return `<div class="event-banner"><strong>${esc(event.title)}${event.jackpotAmount?` · ${money(event.jackpotAmount)}`:''}</strong><p>${esc(event.detail || '')}</p></div>`; }
  function privateBanner() { return room.privateNote ? `<div class="event-banner imposter-banner"><strong>IMPOSTER</strong><p>${esc(room.privateNote)}</p></div>` : ''; }
  function clueList() { const clues = room.clues || []; if (!clues.length) return ''; return `<div class="clue-list">${clues.map(clue => `<p>Clue ${clue.round}: ${esc(clue.text)}</p>`).join('')}</div>`; }
  function game() {
    const me=room.players.find(p=>p.id===room.viewerId); const phase=room.phase;
    let main='';
    if(phase==='BETTING') main=`<div class="game-card"><div class="game-card-head"><span class="category">${esc(room.roundEvent?.title || room.question?.category || 'PLACE YOUR BET')}</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div>${eventBanner()}${privateBanner()}${bets()}</div>`;
    else if(phase==='QUESTION'||phase==='RESULTS') main=`<div class="game-card"><div class="game-card-head"><span class="category">${esc(room.roundEvent?.title || room.question?.category || 'GENERAL KNOWLEDGE')} · ${esc(room.question?.difficulty || '')}</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div>${eventBanner()}${privateBanner()}${phase==='RESULTS'?results():''}<h2 class="question-title">${esc(room.question.question)}</h2>${answers()}${clueList()}<div class="phase-message">${phase==='QUESTION'?(me?.spectating && !room.viewerCanAnswer?'SPECTATING · WAITING FOR THE TABLE':me?.hasAnswered?'✓ &nbsp; ANSWER LOCKED · WAITING FOR THE TABLE':'Choose your answer before time runs out.'):'NEXT ROUND IN A MOMENT'}</div></div>`;
    return `${header()}<div class="game-content"><section class="play-column"><div class="balance-panel"><div><div class="overline">YOUR BALANCE</div><div class="balance-value">${money(me?.balance)}</div>${progress()}</div>${countdown()}</div>${main}</section>${leaderboard()}</div>${chatBox()}`;
  }
  function final() {
    const winner=room.players.find(p=>p.id===room.winnerId); const isHost=room.viewerId===room.hostId;
    return `<div class="final-wrap"><div class="trophy">🏆</div><div class="overline">${room.totalRounds} ROUNDS. ONE WINNER.</div><h1>GAME <em>OVER</em></h1><div class="overline">THE ONE WHO RISKED IT ALL</div><div class="winner-name">${esc(winner?.name||'No winner')}</div><div class="winner-money">${money(winner?.balance)}</div><div class="final-table"><div class="leader-head"><span class="leader-title">FINAL STANDINGS</span><span class="player-count">${room.players.length} PLAYERS</span></div><div class="leader-list">${room.players.map((p,i)=>`<div class="leader-row"><span class="leader-rank">${String(i+1).padStart(2,'0')}</span><span class="leader-name">${esc(p.name)}${p.id===room.viewerId?' <small>YOU</small>':''}</span><span class="leader-money">${money(p.balance)}</span></div>`).join('')}</div></div><div class="final-actions">${isHost?'<button class="button" id="play-again">PLAY AGAIN &nbsp; ↻</button>':''}<button class="button button-secondary" id="return-home">RETURN HOME</button></div>${!isHost?'<div class="phase-message"><span class="waiting-dot"></span>HOST CAN START ANOTHER GAME</div>':''}</div>`;
  }
  function render() {
    const typing = document.activeElement?.id === 'chat-input';
    const currentDraft = document.querySelector('#chat-input');
    if (currentDraft) chatDraft = currentDraft.value;
    if (!room) return showHome();
    if (room.phase==='FINAL') { app.innerHTML=`<section class="game-shell">${header()}${final()}${chatBox()}</section>`; }
    else if (room.phase==='LOBBY') { app.innerHTML=`<section class="game-shell">${lobby()}</section>`; }
    else { app.innerHTML=`<section class="game-shell">${game()}</section>`; }
    document.querySelector('#leave-btn')?.addEventListener('click', leaveRoom);
    document.querySelector('#copy-code')?.addEventListener('click', async()=>{try{await navigator.clipboard.writeText(room.code);notify('Room code copied.');}catch{notify(`Room code: ${room.code}`);}});
    document.querySelector('#start-btn')?.addEventListener('click',()=>send('START'));
    document.querySelectorAll('[data-setting]').forEach(select=>select.addEventListener('change',()=>{ const key=select.dataset.setting; const numeric=['startingCash','questionCount','betSeconds','questionSeconds','resultsSeconds']; const value=numeric.includes(key)?Number(select.value):select.value; if (room?.settings?.[key] === value) return; send('UPDATE_SETTINGS',{settings:{[key]: value}}); }));
    document.querySelectorAll('[data-event]').forEach(box=>box.addEventListener('change',()=>{ if (Boolean(room?.settings?.events?.[box.dataset.event]) === box.checked) return; send('UPDATE_SETTINGS',{settings:{events:{[box.dataset.event]:box.checked}}}); }));
    document.querySelectorAll('[data-category]').forEach(box=>box.addEventListener('change',()=>{ const categories=[...document.querySelectorAll('[data-category]:checked')].map(item=>item.dataset.category); send('UPDATE_SETTINGS',{settings:{categories}}); }));
    document.querySelector('#eliminate-toggle')?.addEventListener('change',event=>send('UPDATE_SETTINGS',{settings:{eliminateAtZero:event.target.checked}}));
    document.querySelectorAll('[data-kick]').forEach(button=>button.addEventListener('click',()=>send('KICK',{targetId:button.dataset.kick})));
    document.querySelectorAll('[data-bet]').forEach(b=>b.addEventListener('click',()=>send('BET',{amount:Number(b.dataset.bet)})));
    document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>send('ANSWER',{answer:Number(b.dataset.answer)})));
    document.querySelector('#play-again')?.addEventListener('click',()=>send('PLAY_AGAIN'));
    document.querySelector('#return-home')?.addEventListener('click',leaveRoom);
    document.querySelector('#chat-toggle')?.addEventListener('click', () => { chatOpen = !chatOpen; render(); });
    document.querySelector('#chat-form')?.addEventListener('submit', event => { event.preventDefault(); const input = document.querySelector('#chat-input'); const text = input.value; chatDraft = ''; send('CHAT', { text }); input.value = ''; });
    if (typing) document.querySelector('#chat-input')?.focus();
    clearInterval(window.riskTimer); window.riskTimer=setInterval(()=>{const el=document.querySelector('#timer');if(el&&room?.deadline){const serverNow=(room.serverNow||Date.now())+(Date.now()-roomReceivedAt);const sec=Math.max(0,Math.ceil((room.deadline-serverNow)/1000));el.textContent=String(sec).padStart(2,'0');el.classList.toggle('urgent',sec<=3);}},200);
  }
  function leaveRoom() {
    autoReconnect=false; send('LEAVE'); store.del('token');store.del('playerId');store.del('roomCode');token=null;playerId=null;roomCode=null;room=null;
    if(socket&&socket.readyState===WebSocket.OPEN)socket.close(); showHome();
  }
  document.addEventListener('click', event => {
    const create = event.target.closest?.('#create-btn');
    const join = event.target.closest?.('#join-btn');
    if (!create && !join) return;
    const name = cleanName();
    if (!name) return;
    if (create) startCreate(name);
    else {
      const code = document.querySelector('#room-code').value.trim();
      if (code.length !== 6) { entryError('Enter a 6-character room code.'); return; }
      startJoin(name, code);
    }
  });
  showHome();
  if (roomCode && token) { autoReconnect = true; connect(); }
  else if (sessionToken) connect();
})();
