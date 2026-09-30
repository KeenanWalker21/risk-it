(() => {
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const store = { get(k) { try { return localStorage.getItem(`riskit.${k}`); } catch { return null; } }, set(k,v) { try { localStorage.setItem(`riskit.${k}`,v); } catch {} }, del(k) { try { localStorage.removeItem(`riskit.${k}`); } catch {} } };
  let socket, room = null, roomReceivedAt = Date.now(), playerId = store.get('playerId'), token = store.get('token'), roomCode = store.get('roomCode'), playerName = store.get('name') || '', clientId = store.get('clientId') || makeClientId(), autoReconnect = false, toastTimer, chatDraft = '', chatOpen = false, settingsNotice = '', pendingConfirm = null, seenNotice = '', sessionToken = store.get('session'), accountUser = store.get('session') && store.get('accountName') ? { username: store.get('accountName') } : null, accountMode = 'hidden';
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
      if (data.type === 'NOTICE') { notify(data.message || ''); return; }
      if (data.type === 'ANIMATION') { window.RiskItStage?.play(data.animation); return; }
      if (data.type === 'STATE') { settingsNotice = '';
        room = data.room; roomReceivedAt = Date.now();
        const notice = room.lastEvent?.message;
        const noticeId = room.lastEvent?.noticeId;
        if (notice && noticeId && noticeId !== seenNotice) { seenNotice = noticeId; notify(notice); }
        render();
      }
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
  const GAME_MODES = [['CLASSIC','Classic Risk It','Answer questions, wager your cash, and finish with the biggest bankroll.'],['LAST_STANDING','Last Player Standing','Survive by protecting your cash. Hit $0 and you\'re eliminated.'],['SPEED','Speed Risk','Fast questions, short timers, and rapid-fire betting.'],['SUDDEN_DEATH','Sudden Death','One major mistake can eliminate you. Every decision matters.'],['HIGH_ROLLER','High Roller','Start rich, wager big, and risk massive amounts of cash.'],['SURVIVAL','Survival','Keep answering correctly as the questions become harder.'],['HEAD_TO_HEAD','Head-to-Head','Two players compete directly for the biggest bankroll.'],['TEAM_BATTLE','Team Battle','Work together with your team and build the largest team bankroll.'],['IMPOSTER','Imposter','One or more players have a hidden objective. Find out who is different.'],['COMEBACK','Comeback','Players behind get powerful opportunities to make a comeback.'],['JACKPOT','Jackpot','Build the jackpot and fight to claim it.'],['REVERSE','Reverse Risk','Predict when you\'ll be wrong and turn mistakes into opportunities.'],['AUCTION','Auction','Bid for the chance to answer valuable questions.'],['TREASURE','Treasure Hunt','Solve questions and clues to reach the final prize.'],['HANGMAN','Hangman','Race to solve the hidden word. Save lives to earn more cash.'],['CUSTOM','Custom Match','Create your own Risk It rules, modes, questions, events, and powerups.']];
  const MATCH_EVENTS = [['DOUBLE_DOWN','Double Down'],['MARKET_CRASH','Market Crash'],['CASH_DROP','Cash Drop'],['TAX_COLLECTOR','Tax Collector'],['JACKPOT','Jackpot'],['REVIVAL','Revival'],['BANK_HEIST','Bank Heist'],['ALL_IN','All-In'],['LIGHTNING','Lightning Round'],['BOUNTY','Bounty'],['KINGS_CROWN',"King's Crown"],['STEAL','Steal Chance'],['CHAOS','Chaos Round'],['HIDDEN_RULE','Hidden Rule'],['RISK_STORM','Risk Storm'],['FINAL_GAMBLE','Final Gamble']];
  const QUESTION_CATEGORIES = ['General Knowledge','Science','History','Sports','Technology','Entertainment','Geography'];
  const QUESTION_TYPES = [['WHO','Who'],['WHAT','What'],['WHICH','Which'],['WHERE','Where'],['WHEN','When'],['HOW_MANY','How many']];
  function settingsBox(isHost, settings) {
    const mode = GAME_MODES.find(item => item[0] === settings.gameMode) || GAME_MODES[0];
    const eventCount = MATCH_EVENTS.filter(([id]) => settings.events?.[id]).length;
    const categoryText = (settings.categories||[]).length ? settings.categories.join(', ') : 'All categories';
    const typeText = (settings.questionTypes||[]).length ? settings.questionTypes.map(id => QUESTION_TYPES.find(item => item[0]===id)?.[1] || id).join(', ') : 'All question types';
    const hangmanMode = settings.gameMode === 'HANGMAN';
    if (!isHost) return `<div class="settings-box"><div class="settings-heading"><span>GAME SETTINGS</span><span class="match-tag ${settings.isCustom?'custom':''}">${settings.isCustom?'CUSTOM MATCH':'STANDARD MATCH'}</span></div><div class="settings-readonly"><span>${esc(settings.modeLabel || mode[1])}</span><span>${money(settings.startingCash)} starting cash</span>${hangmanMode ? `<span>${settings.hangmanLives || 6} lives</span><span>${settings.hangmanWords || 3} words</span><span>${settings.hangmanSeconds || 60}s timer</span>` : `<span>${esc(settings.difficulty || 'ANY')} difficulty</span><span>${settings.questionCount} questions</span><span>${esc(typeText)}</span><span>${esc(categoryText)}</span>`}<span>${eventCount} events</span><span>${settings.cashEventsEnabled===false?'Cash events off':'Cash events on'}</span><span>${settings.powerupsEnabled===false?'Powerups off':'Powerups on'}</span></div><p class="mode-copy">${esc(mode[2])}</p></div>`;
    const options = (values, selected, prefix='') => values.map(value => `<option value="${value}" ${value===selected?'selected':''}>${prefix}${typeof value==='number'?Number(value).toLocaleString('en-US'):value}</option>`).join('');
    const custom = settings.gameMode === 'CUSTOM' ? `<div class="settings-grid"><label class="setting-item"><span>BET TIMER</span><select data-setting="betSeconds">${options([3,5,10,15], settings.betSeconds)}</select></label><label class="setting-item"><span>QUESTION TIMER</span><select data-setting="questionSeconds">${options([5,7,15,20,30], settings.questionSeconds)}</select></label><label class="setting-item"><span>RESULTS TIMER</span><select data-setting="resultsSeconds">${options([3,5], settings.resultsSeconds)}</select></label></div><label class="check-row"><input id="eliminate-toggle" type="checkbox" ${settings.eliminateAtZero!==false?'checked':''}> Eliminate at $0</label>` : '';
    const activeTypes = settings.questionTypes?.length ? settings.questionTypes : QUESTION_TYPES.map(([id]) => id);
    const activeCategories = settings.categories?.length ? settings.categories : QUESTION_CATEGORIES;
    const questionsPanel = `<details class="event-drawer" open><summary>QUESTIONS · ${activeTypes.length} TYPES · ${activeCategories.length} CATEGORIES</summary><p class="mode-copy">Checked boxes are dealt. Leave them all on for the full bank.</p><p class="question-label">QUESTION TYPES</p><div class="category-row">${QUESTION_TYPES.map(([id,label]) => `<label class="check-row"><input type="checkbox" data-question-type="${id}" ${activeTypes.includes(id)?'checked':''}> ${esc(label)}</label>`).join('')}</div><p class="question-label">CATEGORIES</p><div class="category-row">${QUESTION_CATEGORIES.map(category => `<label class="check-row"><input type="checkbox" data-category="${esc(category)}" ${activeCategories.includes(category)?'checked':''}> ${esc(category)}</label>`).join('')}</div></details>`;
    const wordCats = ['Transportation','Movies','TV Shows','Colors','Slogans and Jingles','Birds','Mammals','Food','Space','Weather','Landforms','Household Objects','Towns and Harbors','Plants'];
    const activeWords = settings.hangmanCategories?.length ? settings.hangmanCategories : wordCats;
    const hangmanPanel = `<div class="settings-grid"><label class="setting-item"><span>LIVES</span><select data-setting="hangmanLives">${options([4,6,8], settings.hangmanLives || 6)}</select></label><label class="setting-item"><span>WORDS</span><select data-setting="hangmanWords">${options([1,3,5,8,10,15], settings.hangmanWords || 3)}</select></label><label class="setting-item"><span>ROUND TIMER</span><select data-setting="hangmanSeconds">${options([30,45,60,90], settings.hangmanSeconds || 60)}</select></label><label class="setting-item"><span>WORD DIFFICULTY</span><select data-setting="hangmanDifficulty">${options(['ANY','EASY','MEDIUM','HARD'], settings.hangmanDifficulty || 'ANY')}</select></label><label class="setting-item"><span>REWARD</span><select data-setting="hangmanRewardMultiplier">${[1,2,3].map(value => `<option value="${value}" ${value===(settings.hangmanRewardMultiplier||1)?'selected':''}>x${value}</option>`).join('')}</select></label></div><label class="check-row"><input id="hangman-purchases" type="checkbox" ${settings.hangmanPurchases!==false?'checked':''}> Hint and letter purchases</label><label class="check-row"><input id="hangman-attacks" type="checkbox" ${settings.hangmanAttacks!==false?'checked':''}> Life attacks</label><p class="question-label">WORD CATEGORIES</p><div class="category-row">${wordCats.map(category => `<label class="check-row"><input type="checkbox" data-hangman-category="${esc(category)}" ${activeWords.includes(category)?'checked':''}> ${esc(category)}</label>`).join('')}</div>`;
    const modeControls = hangmanMode ? '' : `<label class="setting-item"><span>DIFFICULTY</span><select data-setting="difficulty">${options(['ANY','EASY','MEDIUM','HARD'], settings.difficulty || 'ANY')}</select></label><label class="setting-item"><span>QUESTIONS</span><select data-setting="questionCount">${options([5,10,15,20,25], settings.questionCount)}</select></label>`;
    return `<div class="settings-box"><div class="settings-heading"><span>GAME SETTINGS</span><span class="match-tag ${settings.isCustom?'custom':''}">${settings.isCustom?'CUSTOM MATCH':'STANDARD MATCH'}</span></div><div class="settings-grid"><label class="setting-item"><span>GAME MODE</span><select data-setting="gameMode">${GAME_MODES.map(([id,label]) => `<option value="${id}" ${id===settings.gameMode?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="setting-item"><span>STARTING CASH</span><select data-setting="startingCash">${options([500,1000,2500,5000,10000], settings.startingCash, '$')}</select></label>${modeControls}</div><p class="mode-copy">${esc(mode[2])}</p><label class="check-row"><input id="cash-events-toggle" type="checkbox" ${settings.cashEventsEnabled!==false?'checked':''}> Cash-powered events</label><label class="check-row"><input id="powerups-toggle" type="checkbox" ${settings.powerupsEnabled!==false?'checked':''}> Powerups</label>${hangmanMode ? hangmanPanel : `${custom}${questionsPanel}`}<details class="event-drawer"><summary>RANDOM EVENTS · ${eventCount} ON</summary><div class="event-grid">${MATCH_EVENTS.map(([id,label]) => `<label class="check-row"><input type="checkbox" data-event="${id}" ${settings.events?.[id]?'checked':''}> ${esc(label)}</label>`).join('')}</div></details></div>`;
  }
  function leaderboard() { return `<aside class="leaderboard"><div class="leader-head"><span class="leader-title">LEADERBOARD</span><span class="live">LIVE</span></div><div class="leader-list">${room.players.map((p,i)=>`<div class="leader-row ${p.connected?'':'disconnected'} ${p.shielded?'shielded':''}" data-player="${esc(p.id)}"><span class="leader-rank">${String(i+1).padStart(2,'0')}</span><span class="leader-name">${esc(p.name)}${p.id===room.viewerId?' <small>YOU</small>':''}${p.isHost?' <small>HOST</small>':''}${p.team?` <small>TEAM ${esc(p.team)}</small>`:''}${p.spectating?' <small>SPECTATING</small>':''}${p.solvedWord?' <small>SOLVED</small>':''}${p.shielded?' <small>SHIELD</small>':''}${!p.connected?' <small>OFFLINE</small>':''}</span><span class="leader-money">${p.lives != null ? `${'♥'.repeat(Math.max(0, p.lives))} ` : ''}${money(p.balance)}</span></div>`).join('')}</div><div class="leader-hint">${room.pot?`Pot ${money(room.pot)}<br>`:''}Your balance is your score.<br>Make it count.</div></aside>`; }
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
    return `<div class="answers">${q.answers.map((a,i)=>{let cls='answer-btn';if(me?.answer===i)cls+=' chosen';if((room.powerups?.hintIndexes||[]).includes(i))cls+=' eliminated';if(room.phase==='RESULTS'&&i===room.result.correctAnswer)cls+=' correct';else if(room.phase==='RESULTS'&&me?.answer===i)cls+=' wrong';const closed=room.phase!=='QUESTION'||!room.viewerCanAnswer||me?.hasAnswered;return `<button class="${cls}" data-answer="${i}" ${closed?'disabled':''}><span class="answer-key">${letters[i]}</span><span class="answer-text">${esc(a)}</span>${(room.powerups?.hintIndexes||[]).includes(i)?'<span class="answer-result">OUT</span>':''}${room.phase==='RESULTS'&&i===room.result.correctAnswer?'<span class="answer-result">CORRECT</span>':''}</button>`;}).join('')}</div>`;
  }
  function results() {
    const me=room.players.find(p=>p.id===room.viewerId); const success=me?.correct;
    if (me?.spectating && !me?.hasAnswered && !room.roundEvent?.openToAll) return `<div class="result-banner"><div class="result-headline">You’re still spectating.</div><div class="result-copy">The correct answer was <strong>${esc(room.result.correctText)}</strong>.</div></div>`;
    return `<div class="result-banner ${success?'':'wrong-banner'}"><div class="result-symbol">${success?'↗':'↘'}</div><div class="result-headline">${success?'That’s the one.':'Not this time.'}</div><div class="result-copy">The correct answer was <strong>${esc(room.result.correctText)}</strong> · ${me?.change >= 0?'+':'−'}${money(Math.abs(me?.change||0))} · New balance ${money(me?.balance)}</div></div>`;
  }
  function eventBanner() { const event = room.roundEvent; if (!event?.title) return ''; return `<div class="event-banner"><strong>${esc(event.title)}${event.jackpotAmount?` · ${money(event.jackpotAmount)}`:''}</strong><p>${esc(event.detail || '')}</p></div>`; }
  function privateBanner() { return room.privateNote ? `<div class="event-banner imposter-banner"><strong>IMPOSTER</strong><p>${esc(room.privateNote)}</p></div>` : ''; }
  function clueList() { const clues = room.clues || []; if (!clues.length) return ''; return `<div class="clue-list">${clues.map(clue => `<p>Clue ${clue.round}: ${esc(clue.text)}</p>`).join('')}</div>`; }
  function hearts(lives, maxLives) { const filled = Math.max(0, lives || 0); const total = Math.max(filled, maxLives || filled); return `${'♥'.repeat(filled)}${'♡'.repeat(Math.max(0, total - filled))}`; }
  function hangmanBoard() {
    const board = room.viewerHangman;
    const me = room.players.find(p => p.id === room.viewerId);
    if (!board) return '<p class="hm-status">Waiting for the word.</p>';
    const pattern = (board.pattern || []).map(letter => letter === ' ' ? '<span class="hm-gap"></span>' : (letter && !/^[A-Z]$/.test(letter) ? `<span class="hm-mark">${esc(letter)}</span>` : `<span class="hm-slot">${letter ? esc(letter) : ''}</span>`)).join('');
    const guessed = (board.guessed || []).map(letter => `<span class="${(board.wrong || []).includes(letter) ? 'hm-miss' : 'hm-hit'}">${esc(letter)}</span>`).join('') || '<span class="hm-empty">None yet</span>';
    const closed = board.solved || board.lives <= 0 || room.phase !== 'HANGMAN';
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => `<button type="button" class="hm-key ${(board.guessed || []).includes(letter) ? 'used' : ''}" data-guess="${letter}" ${(board.guessed || []).includes(letter) || closed ? 'disabled' : ''}>${letter}</button>`).join('');
    const buys = board.purchasesEnabled ? `<button type="button" class="button button-secondary" id="buy-hint" ${board.hint || closed || (me?.balance || 0) < board.costs.hint ? 'disabled' : ''}>BUY HINT · ${money(board.costs.hint)}</button><button type="button" class="button button-secondary" id="buy-letter" ${closed || (me?.balance || 0) < board.costs.letter ? 'disabled' : ''}>BUY LETTER · ${money(board.costs.letter)}</button>` : '';
    const targets = room.players.filter(p => p.id !== room.viewerId && p.connected && (p.lives || 0) > 0 && !p.solvedWord);
    const attack = board.attacksEnabled ? `<div class="hm-attack"><select id="attack-target">${targets.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('') || '<option value="">No target</option>'}</select><button type="button" class="button button-secondary" id="buy-attack" ${!targets.length || closed || (me?.balance || 0) < board.costs.attack ? 'disabled' : ''}>ATTACK · ${money(board.costs.attack)}</button></div>` : '';
    const status = room.phase === 'HANGMAN_RESULT' ? `The word was ${board.word || ''}.` : board.solved ? `You solved it${board.place ? ` · place ${board.place}` : ''}.` : board.lives <= 0 ? 'No lives left. You can watch the race.' : `Solve it with lives left. Bonus now ${money(board.rewardPreview)}.`;
    return `<div class="hm-board"><div class="game-card-head"><span class="category">HANGMAN</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div><p class="hm-category"><span>CATEGORY</span><strong>${esc(board.category || 'WORD')}</strong></p><div class="hm-word">${pattern}</div>${board.hint ? `<p class="hm-hint">${esc(board.hint)}</p>` : ''}<div class="hm-lives" aria-label="${board.lives} lives">${hearts(board.lives, board.maxLives)}</div><p class="hm-status">${esc(status)}</p><div class="hm-guessed">${guessed}</div><div class="hm-keys">${keys}</div><div class="hm-buys">${buys}${attack}</div></div>`;
  }
  function powerupTray() {
    const view = room.powerups;
    if (!view || room.phase === 'LOBBY' || room.phase === 'FINAL') return '';
    if (!view.enabled) return `<section class="power-tray"><span class="overline">POWERUPS</span><p>Powerups are off for this match.</p></section>`;
    const owned = (view.inventory || []).filter(item => item.count > 0 || item.armed);
    const cards = owned.map(item => `<button type="button" class="power-card" data-power="${esc(item.id)}" ${item.usable ? '' : 'disabled'}><b>${esc(item.icon)}</b><strong>${esc(item.name)} ×${item.count}</strong><span>${item.armed ? 'Active. ' : ''}${esc(item.description)}</span>${item.reason && !item.usable ? `<em>${esc(item.reason)}</em>` : ''}</button>`).join('') || '<p>No powerups yet.</p>';
    const offers = (view.offers || []).map(offer => `<button type="button" class="shop-card" data-power-shop="${esc(offer.id)}" ${offer.affordable ? '' : 'disabled'}><strong>${esc(offer.icon)} ${esc(offer.name)}</strong><span>${esc(offer.description)} · ${esc(offer.rarity)}</span><em>${money(offer.cost)} · ${offer.owned}/${offer.maxInventory}</em></button>`).join('');
    return `<section class="power-tray"><span class="overline">POWERUPS</span><div class="power-grid">${cards}</div>${offers ? `<div class="shop-grid">${offers}</div>` : ''}</section>`;
  }
  function shopPanel() {
    const offers = room.shop || [];
    if (!offers.length) return '';
    const me = room.players.find(p => p.id === room.viewerId);
    return `<details class="event-drawer shop-drawer" open><summary>EVENT SHOP · CASH ${money(me?.balance)}</summary><div class="shop-grid">${offers.map(offer => `<button type="button" class="shop-card" data-shop="${esc(offer.id)}" ${offer.affordable ? '' : 'disabled'}><strong>${esc(offer.name)}</strong><span>${esc(offer.description)}</span><em>${money(offer.cost)}</em></button>`).join('')}</div></details>`;
  }
  function confirmLayer() {
    if (!pendingConfirm) return '';
    const targets = (room.players || []).filter(p => p.id !== room.viewerId && p.connected && (pendingConfirm.kind !== 'power' || p.balance > 0));
    const picker = pendingConfirm.needsTarget ? `<label class="setting-item confirm-target"><span>TARGET</span><select id="confirm-target">${targets.map(p => `<option value="${esc(p.id)}">${esc(p.name)} · ${money(p.balance)}</option>`).join('')}</select></label>` : '';
    return `<div class="confirm-layer"><div class="confirm-card"><p>${esc(pendingConfirm.text)}</p>${picker}<div class="confirm-actions"><button type="button" class="button button-secondary" id="confirm-cancel">CANCEL</button><button type="button" class="button" id="confirm-ok">${esc(pendingConfirm.ok)}</button></div></div></div>`;
  }
  function game() {
    const me=room.players.find(p=>p.id===room.viewerId); const phase=room.phase;
    let main='';
    if(phase==='BETTING') main=`<div class="game-card"><div class="game-card-head"><span class="category">${esc(room.roundEvent?.title || room.question?.category || 'PLACE YOUR BET')}</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div>${eventBanner()}${privateBanner()}${bets()}${shopPanel()}</div>`;
    else if(phase==='QUESTION'||phase==='RESULTS') main=`<div class="game-card"><div class="game-card-head"><span class="category">${esc(room.roundEvent?.title || room.question?.category || 'GENERAL KNOWLEDGE')} · ${esc(room.question?.difficulty || '')}</span><span class="question-counter">${room.round} OF ${room.totalRounds}</span></div>${eventBanner()}${privateBanner()}${phase==='RESULTS'?results():''}<h2 class="question-title">${esc(room.question.question)}</h2>${answers()}${clueList()}<div class="phase-message">${phase==='QUESTION'?(me?.spectating && !room.viewerCanAnswer?'SPECTATING · WAITING FOR THE TABLE':me?.hasAnswered?'✓ &nbsp; ANSWER LOCKED · WAITING FOR THE TABLE':'Choose your answer before time runs out.'):'NEXT ROUND IN A MOMENT'}</div>${shopPanel()}</div>`;
    else if(phase==='HANGMAN'||phase==='HANGMAN_RESULT') main=`<div class="game-card">${hangmanBoard()}${shopPanel()}</div>`;
    return `${header()}<div class="game-content"><section class="play-column"><div class="balance-panel"><div><div class="overline">YOUR BALANCE</div><div class="balance-value">${money(me?.balance)}</div>${progress()}</div>${countdown()}</div>${main}${powerupTray()}</section>${leaderboard()}</div>${chatBox()}${confirmLayer()}`;
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
    document.querySelectorAll('[data-setting]').forEach(select=>select.addEventListener('change',()=>{ const key=select.dataset.setting; const numeric=['startingCash','questionCount','betSeconds','questionSeconds','resultsSeconds','hangmanLives','hangmanWords','hangmanSeconds','hangmanRewardMultiplier']; const value=numeric.includes(key)?Number(select.value):select.value; if (room?.settings?.[key] === value) return; send('UPDATE_SETTINGS',{settings:{[key]: value}}); }));
    document.querySelectorAll('[data-event]').forEach(box=>box.addEventListener('change',()=>{ if (Boolean(room?.settings?.events?.[box.dataset.event]) === box.checked) return; send('UPDATE_SETTINGS',{settings:{events:{[box.dataset.event]:box.checked}}}); }));
    const sendList = (selector, dataKey, settingKey) => document.querySelectorAll(selector).forEach(box => box.addEventListener('change', () => {
      const boxes = [...document.querySelectorAll(selector)];
      const checked = boxes.filter(item => item.checked);
      if (!checked.length) { box.checked = true; return; }
      const values = checked.map(item => item.dataset[dataKey]);
      const next = values.length === boxes.length ? [] : values;
      const current = room?.settings?.[settingKey] || [];
      if (current.length === next.length && next.every(value => current.includes(value))) return;
      send('UPDATE_SETTINGS', { settings: { [settingKey]: next } });
    }));
    sendList('[data-question-type]', 'questionType', 'questionTypes');
    sendList('[data-category]', 'category', 'categories');
    sendList('[data-hangman-category]', 'hangmanCategory', 'hangmanCategories');
    document.querySelector('#eliminate-toggle')?.addEventListener('change',event=>send('UPDATE_SETTINGS',{settings:{eliminateAtZero:event.target.checked}}));
    document.querySelector('#cash-events-toggle')?.addEventListener('change',event=>send('UPDATE_SETTINGS',{settings:{cashEventsEnabled:event.target.checked}}));
    document.querySelector('#powerups-toggle')?.addEventListener('change',event=>send('UPDATE_SETTINGS',{settings:{powerupsEnabled:event.target.checked}}));
    document.querySelector('#hangman-purchases')?.addEventListener('change',event=>send('UPDATE_SETTINGS',{settings:{hangmanPurchases:event.target.checked}}));
    document.querySelector('#hangman-attacks')?.addEventListener('change',event=>send('UPDATE_SETTINGS',{settings:{hangmanAttacks:event.target.checked}}));
    document.querySelectorAll('[data-guess]').forEach(button=>button.addEventListener('click',()=>send('HANGMAN_GUESS',{letter:button.dataset.guess})));
    document.querySelector('#buy-hint')?.addEventListener('click',()=>{ const cost=room.viewerHangman?.costs?.hint; pendingConfirm={kind:'hint',text:`Buy a hint for ${money(cost)}?`,ok:`BUY · ${money(cost)}`}; render(); });
    document.querySelector('#buy-letter')?.addEventListener('click',()=>{ const cost=room.viewerHangman?.costs?.letter; pendingConfirm={kind:'letter',text:`Buy a letter for ${money(cost)}? The table picks the letter.`,ok:`BUY · ${money(cost)}`}; render(); });
    document.querySelector('#buy-attack')?.addEventListener('click',()=>{ const targetId=document.querySelector('#attack-target')?.value; const target=room.players.find(p=>p.id===targetId); const cost=room.viewerHangman?.costs?.attack; if(!target) return; pendingConfirm={kind:'attack',targetId,text:`Remove a life from ${target.name} for ${money(cost)}?`,ok:`ATTACK · ${money(cost)}`}; render(); });
    document.querySelectorAll('[data-shop]').forEach(button=>button.addEventListener('click',()=>{ const offer=(room.shop||[]).find(item=>item.id===button.dataset.shop); if(!offer?.affordable) return; pendingConfirm={kind:'shop',id:offer.id,needsTarget:offer.needsTarget,text:`Buy ${offer.name} for ${money(offer.cost)}?`,ok:`BUY · ${money(offer.cost)}`}; render(); }));
    document.querySelectorAll('[data-power]').forEach(button=>button.addEventListener('click',()=>{ const item=(room.powerups?.inventory||[]).find(entry=>entry.id===button.dataset.power); if(!item?.usable) return; if(item.needsTarget){ pendingConfirm={kind:'power',id:item.id,needsTarget:true,text:`Use ${item.name}. Choose a player.`,ok:'USE'}; render(); return; } send('ACTIVATE_POWERUP',{powerupId:item.id}); }));
    document.querySelectorAll('[data-power-shop]').forEach(button=>button.addEventListener('click',()=>{ const offer=(room.powerups?.offers||[]).find(item=>item.id===button.dataset.powerShop); if(!offer?.affordable) return; pendingConfirm={kind:'power-shop',id:offer.id,text:`Buy ${offer.name} for ${money(offer.cost)}?`,ok:`BUY · ${money(offer.cost)}`}; render(); }));
    document.querySelector('#confirm-cancel')?.addEventListener('click',()=>{ pendingConfirm=null; render(); });
    document.querySelector('#confirm-ok')?.addEventListener('click',()=>{ const action=pendingConfirm; const targetId=document.querySelector('#confirm-target')?.value || action?.targetId; pendingConfirm=null; if(action?.kind==='hint') send('HANGMAN_HINT',{}); else if(action?.kind==='letter') send('HANGMAN_LETTER',{}); else if(action?.kind==='attack') send('HANGMAN_ATTACK',{targetId}); else if(action?.kind==='shop') send('BUY_EVENT',{eventId:action.id,targetId}); else if(action?.kind==='power') send('ACTIVATE_POWERUP',{powerupId:action.id,targetId}); else if(action?.kind==='power-shop') send('BUY_POWERUP',{powerupId:action.id}); render(); });
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
