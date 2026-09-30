"use strict";

const HANGMAN_LIVES = [4, 6, 8];
const HANGMAN_TIMES = [30, 45, 60, 90];
const HANGMAN_MULTIPLIERS = [1, 2, 3];
const HANGMAN_WORDS_OPTIONS = [1, 3, 5, 8, 10, 15];
const HANGMAN_CATEGORIES = ["Transportation", "Movies", "TV Shows", "Colors", "Slogans and Jingles", "Birds", "Mammals", "Food", "Space", "Weather", "Landforms", "Household Objects", "Towns and Harbors", "Plants"];
const HANGMAN_COSTS = { hint: 250, letter: 400, attack: 500 };
const HANGMAN_REWARD = { base: 100, perLife: 50 };

const EVENT_COSTS = {
  DOUBLE_DOWN: 250,
  CASH_DROP: 200,
  BANK_HEIST: 500,
  LIGHTNING: 400,
  BOUNTY: 350,
  STEAL: 300,
  CHAOS: 450,
  FINAL_GAMBLE: 600,
};

const PURCHASABLE = [
  ["DOUBLE_DOWN", "Double Down", "Increase your next eligible reward.", false],
  ["CASH_DROP", "Cash Drop", "Add bonus cash to your next correct answer.", false],
  ["BANK_HEIST", "Bank Heist", "Take a small cut from another player's cash.", true],
  ["LIGHTNING", "Lightning Round", "Queue a faster round.", false],
  ["BOUNTY", "Bounty", "Mark another player for the trivia bounty.", true],
  ["STEAL", "Steal Chance", "Steal a slice of cash if your next answer is right.", true],
  ["CHAOS", "Chaos Round", "Trigger another purchasable effect at random.", false],
  ["FINAL_GAMBLE", "Final Gamble", "Double the swing of your next wager.", false],
];

const WORDS = [
  ["TRAIN", "Transportation", "It rolls on rails.", "EASY"],
  ["SUBWAY", "Transportation", "An underground city train.", "EASY"],
  ["BICYCLE", "Transportation", "Two wheels you pedal.", "EASY"],
  ["AIRPLANE", "Transportation", "It carries people through the sky.", "EASY"],
  ["FERRY", "Transportation", "A boat that carries cars and people across water.", "MEDIUM"],
  ["SCOOTER", "Transportation", "A small two-wheeler you stand on.", "EASY"],
  ["TAXI", "Transportation", "You hail it for a paid ride.", "EASY"],
  ["ROCKET", "Transportation", "It launches off the planet.", "EASY"],
  ["SAILBOAT", "Transportation", "Wind pushes this boat along.", "MEDIUM"],
  ["MONORAIL", "Transportation", "A train that rides one rail.", "MEDIUM"],
  ["AVENGERS", "Movies", "A team of superheroes shares this movie title.", "MEDIUM"],
  ["TITANIC", "Movies", "A famous shipwreck movie.", "EASY"],
  ["JAWS", "Movies", "A shark movie with two notes of warning.", "EASY"],
  ["FROZEN", "Movies", "A movie about two sisters and an icy kingdom.", "EASY"],
  ["STAR WARS", "Movies", "A space saga with a lightsaber.", "MEDIUM"],
  ["TOY STORY", "Movies", "Toys come to life in this movie.", "EASY"],
  ["INCEPTION", "Movies", "A movie about dreams inside dreams.", "HARD"],
  ["SHREK", "Movies", "A green ogre movie.", "EASY"],
  ["FINDING NEMO", "Movies", "A clownfish searches the ocean in this movie.", "MEDIUM"],
  ["BLACK PANTHER", "Movies", "A Wakandan hero movie.", "MEDIUM"],
  ["FRIENDS", "TV Shows", "Six roommates in New York share this sitcom title.", "EASY"],
  ["SEINFELD", "TV Shows", "A sitcom about nothing.", "MEDIUM"],
  ["THE OFFICE", "TV Shows", "A paper-company mockumentary.", "EASY"],
  ["BREAKING BAD", "TV Shows", "A teacher starts cooking in the desert.", "MEDIUM"],
  ["THE SIMPSONS", "TV Shows", "A yellow cartoon family.", "EASY"],
  ["STRANGER THINGS", "TV Shows", "Kids face the Upside Down.", "MEDIUM"],
  ["TED LASSO", "TV Shows", "An American coach takes a soccer job.", "MEDIUM"],
  ["SQUID GAME", "TV Shows", "Contestants play deadly playground games.", "MEDIUM"],
  ["SHERLOCK", "TV Shows", "A modern detective in London.", "EASY"],
  ["THE MANDALORIAN", "TV Shows", "A bounty hunter travels with a small green child.", "HARD"],
  ["CRIMSON", "Colors", "A deep red.", "MEDIUM"],
  ["VIOLET", "Colors", "A purple at the edge of the rainbow.", "EASY"],
  ["MAROON", "Colors", "A dark brownish red.", "MEDIUM"],
  ["TEAL", "Colors", "A blue-green.", "EASY"],
  ["SCARLET", "Colors", "A bright red.", "MEDIUM"],
  ["MAGENTA", "Colors", "A vivid pink-purple.", "MEDIUM"],
  ["TURQUOISE", "Colors", "A blue-green stone color.", "HARD"],
  ["LAVENDER", "Colors", "A pale purple.", "MEDIUM"],
  ["EMERALD", "Colors", "A rich green.", "MEDIUM"],
  ["COBALT", "Colors", "A strong blue.", "HARD"],
  ["JUST DO IT", "Slogans and Jingles", "A sportswear slogan that tells you to act.", "EASY"],
  ["IM LOVIN IT", "Slogans and Jingles", "A fast-food jingle about loving it.", "MEDIUM"],
  ["GOT MILK", "Slogans and Jingles", "A short dairy slogan.", "EASY"],
  ["EAT FRESH", "Slogans and Jingles", "A sandwich-shop slogan.", "EASY"],
  ["BA DA BA BA BA", "Slogans and Jingles", "The sung hook of a burger jingle.", "MEDIUM"],
  ["SNAP CRACKLE POP", "Slogans and Jingles", "Three sounds from a cereal jingle.", "MEDIUM"],
  ["TASTE THE RAINBOW", "Slogans and Jingles", "A candy slogan about many colors.", "MEDIUM"],
  ["FINGER LICKIN GOOD", "Slogans and Jingles", "A fried-chicken slogan.", "HARD"],
  ["HAVE IT YOUR WAY", "Slogans and Jingles", "A burger slogan about customizing the order.", "MEDIUM"],
  ["LIKE A GOOD NEIGHBOR", "Slogans and Jingles", "An insurance jingle about being there.", "HARD"],
  ["FALCON", "Birds", "A fast bird of prey.", "EASY"],
  ["PENGUIN", "Birds", "A bird that swims more than it flies.", "EASY"],
  ["PARROT", "Birds", "A colorful bird that can mimic speech.", "EASY"],
  ["SPARROW", "Birds", "A small common songbird.", "MEDIUM"],
  ["OTTER", "Mammals", "A playful river mammal.", "EASY"],
  ["JAGUAR", "Mammals", "A spotted big cat.", "MEDIUM"],
  ["RABBIT", "Mammals", "A long-eared hopper.", "EASY"],
  ["WALRUS", "Mammals", "A tusked sea mammal.", "MEDIUM"],
  ["MANGO", "Food", "A sweet tropical fruit.", "EASY"],
  ["PRETZEL", "Food", "A salty twisted snack.", "MEDIUM"],
  ["NOODLE", "Food", "A long strand in soup.", "EASY"],
  ["BISCUIT", "Food", "A small baked bite.", "MEDIUM"],
  ["PAPAYA", "Food", "A soft orange fruit with black seeds.", "MEDIUM"],
  ["ORBIT", "Space", "The path a planet follows around a star.", "EASY"],
  ["PLANET", "Space", "A world that travels around a star.", "EASY"],
  ["GRAVITY", "Space", "The pull that keeps your feet on the ground.", "MEDIUM"],
  ["COMET", "Space", "An icy traveler with a bright tail.", "EASY"],
  ["FROST", "Weather", "Ice crystals on a cold morning.", "EASY"],
  ["THUNDER", "Weather", "The sound after a lightning flash.", "EASY"],
  ["BLIZZARD", "Weather", "A severe snowstorm.", "MEDIUM"],
  ["MONSOON", "Weather", "A season of heavy rain.", "MEDIUM"],
  ["CANYON", "Landforms", "A deep gap cut by a river.", "MEDIUM"],
  ["MEADOW", "Landforms", "An open field of grass.", "EASY"],
  ["GLACIER", "Landforms", "A slow river of ice.", "MEDIUM"],
  ["FOREST", "Landforms", "A large stand of trees.", "EASY"],
  ["PEBBLE", "Landforms", "A small smooth stone.", "EASY"],
  ["LANTERN", "Household Objects", "A portable light.", "MEDIUM"],
  ["KETTLE", "Household Objects", "A pot for boiling water.", "EASY"],
  ["MIRROR", "Household Objects", "A glass that shows your reflection.", "EASY"],
  ["MAGNET", "Household Objects", "It pulls iron toward itself.", "EASY"],
  ["COMPASS", "Household Objects", "A tool that points north.", "MEDIUM"],
  ["HARBOR", "Towns and Harbors", "A sheltered place for boats.", "EASY"],
  ["VILLAGE", "Towns and Harbors", "A small settlement.", "EASY"],
  ["HAMLET", "Towns and Harbors", "A settlement even smaller than a village.", "MEDIUM"],
  ["OUTPOST", "Towns and Harbors", "A remote station far from a city.", "MEDIUM"],
  ["CLOVER", "Plants", "A little plant often drawn with three leaves.", "EASY"],
  ["CACTUS", "Plants", "A spiny desert plant.", "EASY"],
  ["BAMBOO", "Plants", "A tall hollow-stemmed plant.", "EASY"],
  ["DAISY", "Plants", "A flower with a yellow center.", "EASY"],
].map(([word, category, hint, difficulty]) => ({ word, category, hint, difficulty }));

function isLetter(char) {
  return typeof char === "string" && char >= "A" && char <= "Z";
}

function hangmanReward(livesRemaining, settings = {}) {
  const base = Number.isFinite(settings.hangmanBaseReward) ? settings.hangmanBaseReward : HANGMAN_REWARD.base;
  const perLife = Number.isFinite(settings.hangmanBonusPerLife) ? settings.hangmanBonusPerLife : HANGMAN_REWARD.perLife;
  const multiplier = HANGMAN_MULTIPLIERS.includes(settings.hangmanRewardMultiplier) ? settings.hangmanRewardMultiplier : 1;
  const lives = Math.max(0, Math.floor(Number(livesRemaining) || 0));
  return Math.max(0, Math.round((base + lives * perLife) * multiplier));
}

function wordPool(settings = {}, force = "") {
  const forced = WORDS.find((entry) => entry.word === String(force || "").toUpperCase());
  if (forced) return [forced];
  const categories = settings.hangmanCategories || [];
  const difficulty = settings.hangmanDifficulty && settings.hangmanDifficulty !== "ANY" ? settings.hangmanDifficulty : null;
  const filtered = WORDS.filter((entry) => (!categories.length || categories.includes(entry.category)) && (!difficulty || entry.difficulty === difficulty));
  return filtered.length ? filtered : WORDS;
}

function pickWord(used, settings, randomInt, force = "") {
  const pool = wordPool(settings, force);
  const fresh = pool.filter((entry) => !used?.has?.(entry.word));
  const source = fresh.length ? fresh : pool;
  return source[randomInt(source.length)];
}

function blankPuzzle(lives) {
  const count = HANGMAN_LIVES.includes(lives) ? lives : 6;
  return { revealed: [], wrong: [], guessed: [], lives: count, maxLives: count, solved: false, place: null, hint: false };
}

function patternFor(puzzle, word) {
  const revealed = new Set(puzzle?.revealed || []);
  return [...word].map((letter) => (isLetter(letter) ? (revealed.has(letter) ? letter : null) : letter));
}

function revealLetter(puzzle, word, letter) {
  if (isLetter(letter) && !puzzle.revealed.includes(letter)) puzzle.revealed.push(letter);
  if ([...word].every((char) => !isLetter(char) || puzzle.revealed.includes(char))) puzzle.solved = true;
}

function spend(player, amount) {
  const cost = Math.floor(Number(amount) || 0);
  if (cost < 0 || player.balance < cost) return false;
  player.balance -= cost;
  player.change = (player.change || 0) - cost;
  return true;
}

function activeGuesser(player) {
  return !!(player?.connected && player.puzzle && player.puzzle.lives > 0 && !player.puzzle.solved);
}

function guessLetter(room, player, raw) {
  if (room.phase !== "HANGMAN" || !room.puzzle) return { ok: false, error: "WRONG_PHASE", message: "Guesses are closed." };
  if (!player?.connected) return { ok: false, error: "NOT_PLAYING", message: "Reconnect before you guess." };
  if (!player.puzzle) return { ok: false, error: "NOT_PLAYING", message: "You are not in this race." };
  if (player.puzzle.solved) return { ok: false, error: "ALREADY_SOLVED", message: "You already solved this word." };
  if (player.puzzle.lives <= 0) return { ok: false, error: "OUT_OF_LIVES", message: "You are out of guesses and can only watch." };
  const letter = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!/^[A-Z]$/.test(letter)) return { ok: false, error: "INVALID_LETTER", message: "Guess one letter." };
  if (player.puzzle.guessed.includes(letter)) return { ok: false, error: "ALREADY_GUESSED", message: `${letter} is already on your board.` };
  player.puzzle.guessed.push(letter);
  const word = room.puzzle.word;
  if (word.includes(letter)) {
    revealLetter(player.puzzle, word, letter);
    if (player.puzzle.solved) awardSolve(room, player);
    return { ok: true, message: player.puzzle.solved ? `You solved it for $${player.change.toLocaleString("en-US")}.` : `${letter} is in the word.` };
  }
  player.puzzle.wrong.push(letter);
  player.puzzle.lives -= 1;
  return { ok: true, message: player.puzzle.lives > 0 ? `${letter} is not in the word.` : "That miss used your last life. You can watch the rest of the race." };
}

function awardSolve(room, player) {
  room.puzzle.solvedCount = (room.puzzle.solvedCount || 0) + 1;
  player.puzzle.place = room.puzzle.solvedCount;
  player.puzzle.solved = true;
  const reward = hangmanReward(player.puzzle.lives, room.settings);
  player.change = reward;
  player.balance += reward;
  player.score += 1;
}

function buyHint(room, player) {
  if (room.settings?.hangmanPurchases === false) return { ok: false, error: "PURCHASES_OFF", message: "Hints are turned off for this match." };
  if (room.phase !== "HANGMAN") return { ok: false, error: "WRONG_PHASE", message: "Hints are only sold during the race." };
  if (!activeGuesser(player)) return { ok: false, error: "NOT_PLAYING", message: "Only racers with lives left can buy a hint." };
  if (player.puzzle.hint) return { ok: false, error: "DUPLICATE_PURCHASE", message: "You already bought the hint for this word." };
  if (!spend(player, HANGMAN_COSTS.hint)) return { ok: false, error: "INSUFFICIENT_CASH", message: `You need $${HANGMAN_COSTS.hint} for a hint.` };
  player.puzzle.hint = true;
  return { ok: true, message: "Hint unlocked." };
}

function buyLetter(room, player, randomInt) {
  if (room.settings?.hangmanPurchases === false) return { ok: false, error: "PURCHASES_OFF", message: "Letter buys are turned off for this match." };
  if (room.phase !== "HANGMAN") return { ok: false, error: "WRONG_PHASE", message: "Letters are only sold during the race." };
  if (!activeGuesser(player)) return { ok: false, error: "NOT_PLAYING", message: "Only racers with lives left can buy a letter." };
  const hidden = [...new Set([...room.puzzle.word].filter((letter) => isLetter(letter) && !player.puzzle.revealed.includes(letter)))];
  if (!hidden.length) return { ok: false, error: "NOTHING_LEFT", message: "Every letter is already on your board." };
  if (!spend(player, HANGMAN_COSTS.letter)) return { ok: false, error: "INSUFFICIENT_CASH", message: `You need $${HANGMAN_COSTS.letter} for a letter.` };
  const letter = hidden[randomInt(hidden.length)];
  player.puzzle.guessed.push(letter);
  revealLetter(player.puzzle, room.puzzle.word, letter);
  if (player.puzzle.solved) awardSolve(room, player);
  return { ok: true, message: player.puzzle.solved ? `You solved it for $${player.change.toLocaleString("en-US")}.` : `The table revealed ${letter}.` };
}

function attackLife(room, attacker, target) {
  if (room.settings?.hangmanAttacks === false) return { ok: false, error: "ATTACKS_OFF", message: "Attacks are turned off for this match." };
  if (room.phase !== "HANGMAN") return { ok: false, error: "WRONG_PHASE", message: "Attacks are only allowed during the race." };
  if (!activeGuesser(attacker)) return { ok: false, error: "NOT_PLAYING", message: "You need lives left to attack." };
  if (!target || target.id === attacker.id) return { ok: false, error: "INVALID_TARGET", message: "Choose another player." };
  if (!target.connected || !target.puzzle) return { ok: false, error: "INVALID_TARGET", message: "That player is not in this race." };
  if (target.puzzle.solved || target.puzzle.lives <= 0) return { ok: false, error: "INVALID_TARGET", message: "That player has no life left to take." };
  if (!spend(attacker, HANGMAN_COSTS.attack)) return { ok: false, error: "INSUFFICIENT_CASH", message: `You need $${HANGMAN_COSTS.attack} to remove a life.` };
  target.puzzle.lives -= 1;
  return { ok: true, message: `${attacker.name} removed a life from ${target.name}.` };
}

function hangmanSettled(room) {
  const racers = [...room.players.values()].filter((player) => player.connected && player.puzzle);
  return racers.length > 0 && racers.every((player) => player.puzzle.solved || player.puzzle.lives <= 0);
}

function viewerHangman(room, viewer) {
  if (!room.puzzle || !viewer?.puzzle) return null;
  const showWord = viewer.puzzle.solved || room.phase === "HANGMAN_RESULT" || room.phase === "FINAL";
  return {
    category: room.puzzle.category,
    difficulty: room.puzzle.difficulty,
    length: room.puzzle.word.length,
    pattern: patternFor(viewer.puzzle, room.puzzle.word),
    wrong: [...viewer.puzzle.wrong],
    guessed: [...viewer.puzzle.guessed],
    lives: viewer.puzzle.lives,
    maxLives: viewer.puzzle.maxLives,
    solved: viewer.puzzle.solved,
    place: viewer.puzzle.place,
    hint: viewer.puzzle.hint ? room.puzzle.hint : null,
    word: showWord ? room.puzzle.word : null,
    costs: { ...HANGMAN_COSTS },
    rewardPreview: hangmanReward(viewer.puzzle.lives, room.settings),
    purchasesEnabled: room.settings?.hangmanPurchases !== false,
    attacksEnabled: room.settings?.hangmanAttacks !== false,
  };
}

const TRIVIA_SHOP = new Set(["DOUBLE_DOWN", "CASH_DROP", "FINAL_GAMBLE", "BOUNTY", "STEAL"]);

function shopOffers(player, settings, phase) {
  if (settings?.cashEventsEnabled === false) return [];
  if (!["BETTING", "RESULTS", "HANGMAN", "QUESTION"].includes(phase)) return [];
  return PURCHASABLE.filter(([id]) => settings?.gameMode !== "HANGMAN" || !TRIVIA_SHOP.has(id)).map(([id, name, description, needsTarget]) => ({
    id, name, description, needsTarget, cost: EVENT_COSTS[id], affordable: (player?.balance || 0) >= EVENT_COSTS[id],
  }));
}

function purchaseKey(player, eventId) {
  return `${player.id}:${eventId}`;
}

function applyPurchasedEffect(room, player, eventId, target, randomInt) {
  if (room.settings?.gameMode === "HANGMAN" && TRIVIA_SHOP.has(eventId)) return { ok: false, error: "WRONG_PHASE", message: "That event belongs on a trivia round." };
  if (eventId === "DOUBLE_DOWN") {
    if (player.pendingDouble) return { ok: false, error: "DUPLICATE_PURCHASE", message: "Double Down is already waiting." };
    player.pendingDouble = true;
    return { ok: true, message: "Double Down activated." };
  }
  if (eventId === "CASH_DROP") {
    if (player.pendingDrop) return { ok: false, error: "DUPLICATE_PURCHASE", message: "A cash drop is already waiting on your next correct answer." };
    player.pendingDrop = 150;
    return { ok: true, message: "Cash Drop activated. Your next correct answer pays an extra $150." };
  }
  if (eventId === "FINAL_GAMBLE") {
    if (player.pendingGamble) return { ok: false, error: "DUPLICATE_PURCHASE", message: "Final Gamble is already armed." };
    player.pendingGamble = true;
    return { ok: true, message: "Final Gamble activated. Your next wager swings twice as hard." };
  }
  if (eventId === "LIGHTNING") {
    room.lightningLeft = (room.lightningLeft || 0) + 1;
    return { ok: true, message: "Lightning Round queued." };
  }
  if (eventId === "BANK_HEIST") {
    if (!target || target.id === player.id) return { ok: false, error: "INVALID_TARGET", message: "Choose another player to heist." };
    if (!target.connected || target.balance <= 0) return { ok: false, error: "INVALID_TARGET", message: "That player has no cash to take." };
    const amount = Math.min(150, Math.max(1, Math.floor(target.balance * 0.1)));
    const moved = Math.min(target.balance, amount);
    target.balance -= moved;
    player.balance += moved;
    return { ok: true, message: `${player.name} lifted $${moved} from ${target.name}.` };
  }
  if (eventId === "BOUNTY" || eventId === "STEAL") {
    if (room.settings?.gameMode === "HANGMAN" || !room.roundState) return { ok: false, error: "WRONG_PHASE", message: "That event belongs on a trivia round." };
    if (!target || target.id === player.id) return { ok: false, error: "INVALID_TARGET", message: "Choose another player." };
    if (eventId === "BOUNTY") room.roundState.bountyId = target.id;
    else room.roundState.steal = { thiefId: player.id, victimId: target.id };
    return { ok: true, message: eventId === "BOUNTY" ? `Bounty placed on ${target.name}.` : `Steal Chance aimed at ${target.name}.` };
  }
  if (eventId === "CHAOS") {
    const options = room.settings?.gameMode === "HANGMAN" ? ["LIGHTNING"] : ["DOUBLE_DOWN", "CASH_DROP", "LIGHTNING", "FINAL_GAMBLE"];
    return applyPurchasedEffect(room, player, options[randomInt(options.length)], null, randomInt);
  }
  return { ok: false, error: "UNKNOWN_EVENT", message: "That event cannot be bought." };
}

function purchaseEvent(room, player, eventId, target, randomInt) {
  if (room.settings?.cashEventsEnabled === false) return { ok: false, error: "EVENTS_OFF", message: "Cash-powered events are turned off." };
  if (!player?.connected) return { ok: false, error: "NOT_PLAYING", message: "Reconnect before you spend." };
  if (["LOBBY", "FINAL"].includes(room.phase)) return { ok: false, error: "WRONG_PHASE", message: "The shop is closed." };
  if (!EVENT_COSTS[eventId]) return { ok: false, error: "UNKNOWN_EVENT", message: "That event cannot be bought." };
  if (!room.purchased) room.purchased = new Set();
  const key = purchaseKey(player, eventId);
  if (room.purchased.has(key)) return { ok: false, error: "DUPLICATE_PURCHASE", message: "You already bought that this round." };
  const cost = EVENT_COSTS[eventId];
  if (!spend(player, cost)) return { ok: false, error: "INSUFFICIENT_CASH", message: `You need $${cost} for that event.` };
  const effect = applyPurchasedEffect(room, player, eventId, target, randomInt);
  if (!effect.ok) { player.balance += cost; player.change = (player.change || 0) + cost; return effect; }
  room.purchased.add(key);
  return { ok: true, message: `${effect.message} $${player.balance.toLocaleString("en-US")} remaining.` };
}

module.exports = {
  HANGMAN_LIVES,
  HANGMAN_TIMES,
  HANGMAN_MULTIPLIERS,
  HANGMAN_WORDS_OPTIONS,
  HANGMAN_CATEGORIES,
  HANGMAN_COSTS,
  HANGMAN_REWARD,
  EVENT_COSTS,
  PURCHASABLE,
  WORDS,
  hangmanReward,
  pickWord,
  blankPuzzle,
  guessLetter,
  buyHint,
  buyLetter,
  attackLife,
  hangmanSettled,
  viewerHangman,
  shopOffers,
  purchaseEvent,
};
