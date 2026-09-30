(function () {
  const registry = window.RiskItAnimations;
  if (!registry) return;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const queue = new registry.AnimationQueue();
  let root, floatLayer, majorLayer, muteButton, timer = 0, floatTimer = 0;
  const seen = new Set();

  const SoundManager = {
    muted: localStorage.getItem("riskit.muted") === "1",
    context: null,
    ensure() {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.context) this.context = new AudioCtx();
      return this.context;
    },
    unlock() {
      const context = this.ensure();
      if (context && context.state === "suspended") context.resume().catch(() => {});
    },
    toggle() {
      this.muted = !this.muted;
      localStorage.setItem("riskit.muted", this.muted ? "1" : "0");
      if (muteButton) muteButton.textContent = this.muted ? "SOUND OFF" : "SOUND ON";
      if (!this.muted) this.unlock();
      return this.muted;
    },
    play(id) {
      if (this.muted || !id || reduced) return;
      const context = this.ensure();
      if (!context || context.state !== "running") return;
      const notes = { jackpot: [523, 659, 784], cashDrop: [880, 1175], heist: [196, 165], chaos: [311, 415, 233], deny: [180], solve: [659, 880], default: [440] };
      const tones = notes[id] || notes.default;
      tones.forEach((frequency, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = "triangle";
        osc.frequency.value = frequency;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(context.destination);
        const start = context.currentTime + index * 0.08;
        gain.gain.exponentialRampToValueAtTime(0.04, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    },
  };

  function money(amount) {
    if (!Number.isFinite(amount)) return "";
    const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
    return `${sign}$${Math.abs(amount).toLocaleString("en-US")}`;
  }

  function mediaScene(cue) {
    const media = cue.media;
    if (!media?.src) return "";
    const src = escapeHtml(media.src);
    if (media.kind === "gif" || media.kind === "image" || media.kind === "svg") return `<img class="anim-media" alt="" src="${src}">`;
    if (media.kind === "webm" || media.kind === "mp4" || media.kind === "video") return `<video class="anim-media" autoplay muted playsinline src="${src}"></video>`;
    return "";
  }

  function scene(cue) {
    const external = mediaScene(cue);
    if (external) return `<div class="anim-scene media">${external}</div>`;
    const kind = cue.animation;
    if (reduced) return `<div class="anim-scene calm" data-kind="${kind}"></div>`;
    if (kind === "cash-drop" || kind === "jackpot") return `<div class="anim-scene coins">${Array.from({ length: kind === "jackpot" ? 14 : 8 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>`;
    if (kind === "bank-heist") return `<div class="anim-scene vault"><b></b><b></b></div>`;
    if (kind === "lightning-round") return `<div class="anim-scene countdown"><span>3</span><span>2</span><span>1</span><span>GO</span></div>`;
    if (kind === "final-gamble") return `<div class="anim-scene countdown"><span>3</span><span>2</span><span>1</span><span>FINAL</span></div>`;
    if (kind === "risk-storm") return `<div class="anim-scene bolt"></div>`;
    if (kind === "bounty") return `<div class="anim-scene crosshair"></div>`;
    if (kind === "double-down") return `<div class="anim-scene multiplier">2×</div>`;
    if (kind === "chaos-round") return `<div class="anim-scene chaos"><span>✦</span><span>⚡</span><span>◆</span></div>`;
    if (kind === "kings-crown") return `<div class="anim-scene crown">♛</div>`;
    if (kind === "steal" || kind === "cash-gain") return `<div class="anim-scene bills"><i></i><i></i><i></i></div>`;
    if (kind === "protection") return `<div class="anim-scene shield"></div>`;
    if (kind === "shield-break") return `<div class="anim-scene shield crack"></div>`;
    if (kind === "risk-boost") return `<div class="anim-scene multiplier">1.5×</div>`;
    if (kind === "free-bet") return `<div class="anim-scene wager">SAFE</div>`;
    if (kind === "extra-life") return `<div class="anim-scene heart">+♥</div>`;
    if (kind === "buy-hint") return `<div class="anim-scene glass"></div>`;
    if (kind === "buy-letter") return `<div class="anim-scene tile">?</div>`;
    if (kind === "remove-life" || kind === "elimination") return `<div class="anim-scene heart">♥</div>`;
    if (kind === "solve-word") return `<div class="anim-scene burst">${Array.from({ length: 10 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>`;
    if (kind === "market-crash" || kind === "cash-loss") return `<div class="anim-scene drop">↘</div>`;
    return `<div class="anim-scene mark">◆</div>`;
  }

  function line(label, value) {
    return value ? `<p class="anim-line"><span>${label}</span> ${escapeHtml(value)}</p>` : "";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function card(cue, modest) {
    const effect = cue.metadata && cue.metadata.effect ? registry.EVENT_ANIMATIONS[cue.metadata.effect]?.name : "";
    const amount = cue.type === "CASH_LOSS" ? money(-(cue.amount || 0)) : money(cue.amount);
    return `<article class="anim-card ${modest ? "modest" : cue.level}" data-animation="${cue.animation}" role="status">
      ${scene(cue)}
      <div class="anim-copy">
        <strong>${escapeHtml(cue.name)}</strong>
        <p>${escapeHtml(effect ? `${cue.description} ${effect}.` : cue.description)}</p>
        ${line("", cue.playerName)}
        ${line("TARGET", cue.targetName)}
        ${amount ? `<em>${amount}</em>` : ""}
        ${cue.metadata && cue.metadata.place ? `<small>Place ${escapeHtml(cue.metadata.place)}</small>` : ""}
      </div>
    </article>`;
  }

  function mount() {
    if (root) return;
    root = document.createElement("div");
    root.className = `anim-root${reduced ? " anim-calm" : ""}`;
    floatLayer = document.createElement("div");
    floatLayer.className = "anim-floats";
    majorLayer = document.createElement("div");
    majorLayer.className = "anim-major";
    root.append(floatLayer, majorLayer);
    muteButton = document.createElement("button");
    muteButton.type = "button";
    muteButton.className = "anim-mute";
    muteButton.textContent = SoundManager.muted ? "SOUND OFF" : "SOUND ON";
    muteButton.addEventListener("click", () => SoundManager.toggle());
    root.append(muteButton);
    document.body.append(root);
    document.addEventListener("pointerdown", () => SoundManager.unlock(), { once: true });
  }

  function clearMajor() {
    clearTimeout(timer);
    timer = 0;
    if (majorLayer) majorLayer.innerHTML = "";
  }

  function showCurrent() {
    if (!queue.current || !majorLayer) return;
    const cue = queue.current;
    majorLayer.innerHTML = card(cue, false);
    SoundManager.play(cue.sound);
    const duration = reduced ? Math.min(cue.duration, 1200) : cue.duration;
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue.finishCurrent();
      if (queue.current) showCurrent();
      else clearMajor();
    }, duration);
  }

  function showFloats() {
    const cues = queue.takeFloats(4);
    if (!cues.length || !floatLayer) return;
    for (const cue of cues) {
      const node = document.createElement("div");
      node.innerHTML = card(cue, true);
      const article = node.firstElementChild;
      floatLayer.append(article);
      SoundManager.play(cue.sound);
      const duration = reduced ? 700 : cue.duration;
      setTimeout(() => article.remove(), duration);
    }
    clearTimeout(floatTimer);
    floatTimer = setTimeout(showFloats, reduced ? 400 : 700);
  }

  function flyCash(cue) {
    if (cue.metadata?.travel !== "to-player" || !cue.playerId || !cue.targetPlayerId) return;
    const from = document.querySelector(`[data-player="${CSS.escape(cue.targetPlayerId)}"]`);
    const to = document.querySelector(`[data-player="${CSS.escape(cue.playerId)}"]`);
    if (!from || !to || !root) return;
    const start = from.getBoundingClientRect();
    const end = to.getBoundingClientRect();
    const chip = document.createElement("div");
    chip.className = "cash-flight";
    chip.textContent = money(cue.amount);
    chip.style.left = `${start.left + start.width / 2}px`;
    chip.style.top = `${start.top + start.height / 2}px`;
    root.append(chip);
    from.classList.add("flight-from");
    to.classList.add("flight-to");
    const dx = (end.left + end.width / 2) - (start.left + start.width / 2);
    const dy = (end.top + end.height / 2) - (start.top + start.height / 2);
    if (!reduced && chip.animate) chip.animate([{ transform: "translate(-50%, -50%)" }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))` }], { duration: 900, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" });
    setTimeout(() => { chip.remove(); from.classList.remove("flight-from"); to.classList.remove("flight-to"); }, reduced ? 700 : 1000);
  }

  function play(animation) {
    const cue = animation && animation.type ? animation : null;
    if (!cue || seen.has(cue.id)) return;
    seen.add(cue.id);
    if (seen.size > 40) seen.delete(seen.values().next().value);
    mount();
    flyCash(cue);
    const result = queue.enqueue(cue);
    if (result.channel === "float") showFloats();
    else if (result.channel === "interrupt") showCurrent();
    else if (result.channel === "play") showCurrent();
  }

  window.RiskItStage = { play, SoundManager, queue, destroy() { clearMajor(); clearTimeout(floatTimer); root?.remove(); root = null; } };
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
