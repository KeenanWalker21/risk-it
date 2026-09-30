"use strict";

const powerups = require("./powerups");
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
  ["HELICOPTER", "Transportation", "A rotorcraft that can hover.", "MEDIUM"],
  ["TRAM", "Transportation", "A city car that runs on street rails.", "EASY"],
  ["KAYAK", "Transportation", "A narrow boat you paddle.", "EASY"],
  ["CANOE", "Transportation", "An open boat paddled with a single blade.", "EASY"],
  ["TROLLEY", "Transportation", "A wheeled cart or a streetcar.", "MEDIUM"],
  ["YACHT", "Transportation", "A pleasure boat built for cruising.", "MEDIUM"],
  ["GLIDER", "Transportation", "An aircraft that rides the air without an engine.", "MEDIUM"],
  ["SKATEBOARD", "Transportation", "A deck on four wheels you ride standing up.", "EASY"],
  ["UNICYCLE", "Transportation", "A cycle with only one wheel.", "MEDIUM"],
  ["ROWBOAT", "Transportation", "A small boat moved with oars.", "EASY"],
  ["FREIGHT", "Transportation", "Goods carried by truck, train, or ship.", "MEDIUM"],
  ["LIMOUSINE", "Transportation", "A long car hired for a formal ride.", "MEDIUM"],
  ["GONDOLA", "Transportation", "A narrow boat poled through city canals.", "HARD"],
  ["SLED", "Transportation", "A runnered seat that slides over snow.", "EASY"],
  ["CARAVAN", "Transportation", "A home on wheels towed behind a vehicle.", "MEDIUM"],
  ["CASABLANCA", "Movies", "A classic film set in a wartime Moroccan city.", "MEDIUM"],
  ["GODZILLA", "Movies", "A giant city-stomping monster movie.", "EASY"],
  ["ROCKY", "Movies", "A boxing underdog movie set in Philadelphia.", "EASY"],
  ["MATILDA", "Movies", "A story about a bookish girl with a sharp mind.", "EASY"],
  ["MOANA", "Movies", "An ocean voyage movie about a young wayfinder.", "EASY"],
  ["ALADDIN", "Movies", "A lamp, a genie, and a magic carpet.", "EASY"],
  ["COCO", "Movies", "A music movie about a boy visiting his ancestors.", "MEDIUM"],
  ["GLADIATOR", "Movies", "A Roman arena revenge movie.", "MEDIUM"],
  ["ARRIVAL", "Movies", "Linguists meet visitors from space.", "HARD"],
  ["KING KONG", "Movies", "A giant ape is taken from an island to a city.", "EASY"],
  ["WHIPLASH", "Movies", "A drummer faces a fierce music teacher.", "HARD"],
  ["JUMANJI", "Movies", "A board game pulls players into a jungle.", "MEDIUM"],
  ["PADDINGTON", "Movies", "A polite bear from Peru finds a London home.", "EASY"],
  ["JURASSIC PARK", "Movies", "A theme park brings dinosaurs back.", "EASY"],
  ["SPIRITED AWAY", "Movies", "A girl works in a bathhouse for spirits.", "HARD"],
  ["THE MATRIX", "Movies", "A hacker learns the world is a simulation.", "MEDIUM"],
  ["LA LA LAND", "Movies", "A musical about jazz and ambition in Los Angeles.", "MEDIUM"],
  ["CHEERS", "TV Shows", "A Boston bar where everybody knows your name.", "EASY"],
  ["FRASIER", "TV Shows", "A radio psychiatrist moves back to Seattle.", "MEDIUM"],
  ["LOST", "TV Shows", "Plane-crash survivors face a strange island.", "EASY"],
  ["BLUEY", "TV Shows", "A cartoon puppy family in Australia.", "EASY"],
  ["THE CROWN", "TV Shows", "A drama about the British royal family.", "MEDIUM"],
  ["SUCCESSION", "TV Shows", "Siblings compete to run a media empire.", "HARD"],
  ["THE BEAR", "TV Shows", "A fine-dining chef takes over a sandwich shop.", "MEDIUM"],
  ["SEVERANCE", "TV Shows", "Workers split their work memories from home.", "HARD"],
  ["NEW GIRL", "TV Shows", "A teacher moves in with three roommates.", "EASY"],
  ["THE WIRE", "TV Shows", "A Baltimore drama about police and the city.", "HARD"],
  ["PARKS AND REC", "TV Shows", "A small-town parks department sitcom.", "MEDIUM"],
  ["ONLY MURDERS", "TV Shows", "Neighbors make a podcast about a building death.", "MEDIUM"],
  ["WEDNESDAY", "TV Shows", "A deadpan student enrolls at a strange academy.", "EASY"],
  ["BROOKLYN NINE NINE", "TV Shows", "A comedy about detectives in a New York precinct.", "MEDIUM"],
  ["GRAVITY FALLS", "TV Shows", "Twins spend a summer in a weird town.", "MEDIUM"],
  ["POKEMON", "TV Shows", "A trainer travels with a small yellow partner.", "EASY"],
  ["ANDOR", "TV Shows", "A rebel's story set before a famous heist.", "HARD"],
  ["HOUSE", "TV Shows", "A brilliant, rude doctor solves medical puzzles.", "MEDIUM"],
  ["INDIGO", "Colors", "A deep blue-violet.", "MEDIUM"],
  ["BEIGE", "Colors", "A pale sandy neutral.", "EASY"],
  ["IVORY", "Colors", "An off-white like old piano keys.", "MEDIUM"],
  ["AMBER", "Colors", "A warm golden orange.", "EASY"],
  ["OLIVE", "Colors", "A muted yellow-green.", "EASY"],
  ["NAVY", "Colors", "A very dark blue.", "EASY"],
  ["CORAL", "Colors", "A pink-orange like a reef.", "MEDIUM"],
  ["CREAM", "Colors", "A soft off-white.", "EASY"],
  ["CHARCOAL", "Colors", "A gray close to black.", "MEDIUM"],
  ["SAFFRON", "Colors", "A vivid yellow-orange spice color.", "HARD"],
  ["AUBURN", "Colors", "A reddish brown.", "MEDIUM"],
  ["FUCHSIA", "Colors", "A bright pink-purple.", "HARD"],
  ["SEPIA", "Colors", "A brown tint used in old photographs.", "HARD"],
  ["OCHRE", "Colors", "An earthy yellow-brown.", "HARD"],
  ["MAUVE", "Colors", "A pale dusty purple.", "HARD"],
  ["THINK DIFFERENT", "Slogans and Jingles", "A computer-company slogan about changing the usual way.", "MEDIUM"],
  ["GOOD TO THE LAST DROP", "Slogans and Jingles", "A coffee slogan about finishing the cup.", "HARD"],
  ["A DIAMOND IS FOREVER", "Slogans and Jingles", "A jewelry slogan about lasting stones.", "MEDIUM"],
  ["MELT IN YOUR MOUTH", "Slogans and Jingles", "A candy slogan about chocolate that disappears.", "MEDIUM"],
  ["LIKE A ROCK", "Slogans and Jingles", "A truck jingle about staying solid.", "EASY"],
  ["BECAUSE YOURE WORTH IT", "Slogans and Jingles", "A cosmetics slogan about treating yourself.", "MEDIUM"],
  ["CAN YOU HEAR ME NOW", "Slogans and Jingles", "A phone-company line about the signal.", "MEDIUM"],
  ["THE QUICKER PICKER UPPER", "Slogans and Jingles", "A paper-towel slogan about absorbing spills.", "HARD"],
  ["THERE IS AN APP FOR THAT", "Slogans and Jingles", "A phone slogan about software for every job.", "MEDIUM"],
  ["TASTES GREAT", "Slogans and Jingles", "Half of a famous beer debate slogan.", "EASY"],
  ["YOU DESERVE A BREAK", "Slogans and Jingles", "A burger slogan about taking time off.", "MEDIUM"],
  ["EVERY KISS BEGINS", "Slogans and Jingles", "The start of a jewelry-store jingle.", "HARD"],
  ["WHAT IS IN YOUR WALLET", "Slogans and Jingles", "A credit-card slogan about what you carry.", "MEDIUM"],
  ["EASY BREEZY", "Slogans and Jingles", "The start of a mascara slogan.", "MEDIUM"],
  ["FIFTEEN MINUTES", "Slogans and Jingles", "The opening of an insurance savings line.", "HARD"],
  ["EAGLE", "Birds", "A large bird of prey with a hooked beak.", "EASY"],
  ["ROBIN", "Birds", "A small bird with an orange breast.", "EASY"],
  ["HERON", "Birds", "A long-legged wading bird.", "MEDIUM"],
  ["PUFFIN", "Birds", "A seabird with a colorful beak.", "MEDIUM"],
  ["TOUCAN", "Birds", "A tropical bird with a huge bill.", "EASY"],
  ["CONDOR", "Birds", "A huge soaring scavenger.", "MEDIUM"],
  ["FINCH", "Birds", "A small seed-eating songbird.", "MEDIUM"],
  ["RAVEN", "Birds", "A large black bird known for being clever.", "EASY"],
  ["GOOSE", "Birds", "A loud waterbird bigger than a duck.", "EASY"],
  ["PELICAN", "Birds", "A bird with a pouch under its beak.", "EASY"],
  ["FLAMINGO", "Birds", "A pink bird that often stands on one leg.", "EASY"],
  ["WOODPECKER", "Birds", "A bird that drums on tree trunks.", "MEDIUM"],
  ["HUMMINGBIRD", "Birds", "A tiny bird that hovers at flowers.", "MEDIUM"],
  ["ALBATROSS", "Birds", "A seabird with a very long wingspan.", "HARD"],
  ["CARDINAL", "Birds", "A bright red songbird.", "MEDIUM"],
  ["OSTRICH", "Birds", "A huge flightless bird.", "EASY"],
  ["MACAW", "Birds", "A large colorful parrot.", "MEDIUM"],
  ["STORK", "Birds", "A tall bird often drawn carrying a bundle.", "EASY"],
  ["DOVE", "Birds", "A gentle bird used as a peace symbol.", "EASY"],
  ["HAWK", "Birds", "A daytime hunter with sharp eyes.", "EASY"],
  ["TIGER", "Mammals", "A striped big cat.", "EASY"],
  ["WHALE", "Mammals", "A giant ocean mammal.", "EASY"],
  ["DOLPHIN", "Mammals", "A smart marine mammal that clicks and leaps.", "EASY"],
  ["BEAVER", "Mammals", "A rodent that builds dams.", "EASY"],
  ["MOOSE", "Mammals", "A huge deer with wide antlers.", "EASY"],
  ["BISON", "Mammals", "A heavy horned grazer of the plains.", "MEDIUM"],
  ["CAMEL", "Mammals", "A desert mammal with a hump.", "EASY"],
  ["ZEBRA", "Mammals", "A horse-like animal with stripes.", "EASY"],
  ["PANDA", "Mammals", "A black-and-white bear that eats bamboo.", "EASY"],
  ["KOALA", "Mammals", "A tree-dwelling Australian marsupial.", "EASY"],
  ["SLOTH", "Mammals", "A very slow mammal that hangs from branches.", "EASY"],
  ["COYOTE", "Mammals", "A wild canine known for its howl.", "MEDIUM"],
  ["WOLF", "Mammals", "A pack-hunting wild dog.", "EASY"],
  ["GIRAFFE", "Mammals", "The tallest land mammal.", "EASY"],
  ["CHEETAH", "Mammals", "The fastest land mammal.", "EASY"],
  ["LEOPARD", "Mammals", "A spotted cat that climbs trees.", "MEDIUM"],
  ["MANATEE", "Mammals", "A slow gentle sea mammal.", "MEDIUM"],
  ["PLATYPUS", "Mammals", "An egg-laying mammal with a duck-like bill.", "HARD"],
  ["BADGER", "Mammals", "A burrowing mammal with a striped face.", "MEDIUM"],
  ["FERRET", "Mammals", "A long slim pet in the weasel family.", "MEDIUM"],
  ["WAFFLE", "Food", "A gridded breakfast cake.", "EASY"],
  ["BAGEL", "Food", "A boiled then baked ring of bread.", "EASY"],
  ["SUSHI", "Food", "Rice dishes often served with fish.", "EASY"],
  ["TACO", "Food", "A folded tortilla filled with savory bits.", "EASY"],
  ["DONUT", "Food", "A sweet fried ring.", "EASY"],
  ["MUFFIN", "Food", "A small quick bread baked in a cup.", "EASY"],
  ["OMELET", "Food", "Beaten eggs folded around a filling.", "MEDIUM"],
  ["YOGURT", "Food", "A tangy cultured milk food.", "EASY"],
  ["AVOCADO", "Food", "A creamy green fruit with a large pit.", "MEDIUM"],
  ["PUMPKIN", "Food", "A large orange squash.", "EASY"],
  ["GARLIC", "Food", "A pungent bulb used in cooking.", "EASY"],
  ["GINGER", "Food", "A spicy root used in tea and stir-fries.", "MEDIUM"],
  ["HUMMUS", "Food", "A dip made from chickpeas.", "MEDIUM"],
  ["RAMEN", "Food", "A noodle soup with broth.", "EASY"],
  ["DUMPLING", "Food", "A small pocket of dough around a filling.", "MEDIUM"],
  ["PAELLA", "Food", "A Spanish rice dish cooked in a wide pan.", "HARD"],
  ["SORBET", "Food", "A frozen dessert made without cream.", "MEDIUM"],
  ["WASABI", "Food", "A sharp green paste served with raw fish.", "HARD"],
  ["CHILI", "Food", "A spicy stew of meat and beans.", "EASY"],
  ["GRANOLA", "Food", "Baked oats and nuts eaten for breakfast.", "MEDIUM"],
  ["NEBULA", "Space", "A cloud of gas and dust in space.", "MEDIUM"],
  ["GALAXY", "Space", "A huge system of stars, like the Milky Way.", "EASY"],
  ["METEOR", "Space", "A streak of light from a rock entering the air.", "EASY"],
  ["ASTEROID", "Space", "A rocky body orbiting the Sun, smaller than a planet.", "MEDIUM"],
  ["ECLIPSE", "Space", "One body passes in front of another and blocks the light.", "MEDIUM"],
  ["AURORA", "Space", "Colored lights in the polar sky.", "MEDIUM"],
  ["SUPERNOVA", "Space", "A star exploding at the end of its life.", "HARD"],
  ["PULSAR", "Space", "A spinning neutron star that flashes.", "HARD"],
  ["CRATER", "Space", "A bowl left by an impact.", "EASY"],
  ["TELESCOPE", "Space", "A tool for seeing distant objects.", "EASY"],
  ["SATELLITE", "Space", "An object that orbits a larger one.", "MEDIUM"],
  ["ZENITH", "Space", "The point in the sky straight overhead.", "HARD"],
  ["QUASAR", "Space", "An extremely bright distant galactic core.", "HARD"],
  ["APOGEE", "Space", "The farthest point in an orbit.", "HARD"],
  ["PERIGEE", "Space", "The nearest point in an orbit.", "HARD"],
  ["THRUSTER", "Space", "An engine that pushes a spacecraft.", "MEDIUM"],
  ["PAYLOAD", "Space", "The cargo a rocket carries.", "MEDIUM"],
  ["DRIZZLE", "Weather", "Very light rain.", "EASY"],
  ["SLEET", "Weather", "Icy rain that stings when it falls.", "MEDIUM"],
  ["HAIL", "Weather", "Ice pellets that fall from a storm.", "EASY"],
  ["DROUGHT", "Weather", "A long time with too little rain.", "MEDIUM"],
  ["TORNADO", "Weather", "A spinning column of wind.", "EASY"],
  ["TYPHOON", "Weather", "A powerful tropical storm in the Pacific.", "MEDIUM"],
  ["HUMIDITY", "Weather", "The amount of moisture in the air.", "MEDIUM"],
  ["OVERCAST", "Weather", "A sky covered by cloud.", "MEDIUM"],
  ["RAINBOW", "Weather", "Colored light after rain and sun.", "EASY"],
  ["GALE", "Weather", "A strong wind.", "MEDIUM"],
  ["SQUALL", "Weather", "A sudden violent burst of wind and rain.", "HARD"],
  ["HEATWAVE", "Weather", "Several days of unusually hot weather.", "EASY"],
  ["CIRRUS", "Weather", "Thin high wispy clouds.", "HARD"],
  ["CUMULUS", "Weather", "Puffy fair-weather clouds.", "MEDIUM"],
  ["STRATUS", "Weather", "A flat gray cloud layer.", "HARD"],
  ["WHITEOUT", "Weather", "Snow and cloud so bright you lose the horizon.", "HARD"],
  ["DEW", "Weather", "Water drops that form on cool mornings.", "EASY"],
  ["MIST", "Weather", "A thin fog.", "EASY"],
  ["VALLEY", "Landforms", "Low land between hills or mountains.", "EASY"],
  ["PLATEAU", "Landforms", "A high flat area of land.", "MEDIUM"],
  ["DELTA", "Landforms", "Land built where a river meets the sea.", "MEDIUM"],
  ["PENINSULA", "Landforms", "Land almost surrounded by water.", "MEDIUM"],
  ["VOLCANO", "Landforms", "A mountain that can erupt.", "EASY"],
  ["DUNE", "Landforms", "A hill of wind-blown sand.", "EASY"],
  ["OASIS", "Landforms", "A watered spot in a desert.", "EASY"],
  ["TUNDRA", "Landforms", "A cold treeless plain.", "MEDIUM"],
  ["FJORD", "Landforms", "A deep coastal inlet carved by ice.", "HARD"],
  ["ATOLL", "Landforms", "A ring-shaped coral island.", "HARD"],
  ["MESA", "Landforms", "A flat-topped hill with steep sides.", "MEDIUM"],
  ["GORGE", "Landforms", "A narrow steep-sided valley.", "MEDIUM"],
  ["PRAIRIE", "Landforms", "A wide grassland.", "EASY"],
  ["BASIN", "Landforms", "A low area that collects water or sediment.", "MEDIUM"],
  ["STEPPE", "Landforms", "A dry grassland.", "HARD"],
  ["SUMMIT", "Landforms", "The top of a mountain.", "EASY"],
  ["GROTTO", "Landforms", "A small cave.", "MEDIUM"],
  ["ISTHMUS", "Landforms", "A narrow strip of land between two waters.", "HARD"],
  ["TOASTER", "Household Objects", "A small oven that browns bread.", "EASY"],
  ["BLENDER", "Household Objects", "A jar with blades that purees food.", "EASY"],
  ["LADLE", "Household Objects", "A deep long-handled spoon for soup.", "MEDIUM"],
  ["WHISK", "Household Objects", "A wire tool for beating eggs.", "MEDIUM"],
  ["COLANDER", "Household Objects", "A bowl with holes for draining.", "MEDIUM"],
  ["THERMOS", "Household Objects", "A bottle that keeps drinks hot or cold.", "EASY"],
  ["CURTAIN", "Household Objects", "Cloth hung over a window.", "EASY"],
  ["CUSHION", "Household Objects", "A soft pad for a chair.", "EASY"],
  ["WARDROBE", "Household Objects", "A tall cupboard for clothes.", "MEDIUM"],
  ["HAMPER", "Household Objects", "A basket for laundry.", "MEDIUM"],
  ["BROOM", "Household Objects", "A brush on a long handle.", "EASY"],
  ["SPONGE", "Household Objects", "A soft pad that soaks up water.", "EASY"],
  ["FAUCET", "Household Objects", "The tap water comes from.", "EASY"],
  ["PILLOW", "Household Objects", "A soft support for your head in bed.", "EASY"],
  ["BLANKET", "Household Objects", "A cover that keeps you warm.", "EASY"],
  ["HANGER", "Household Objects", "A hook-shaped holder for clothes.", "EASY"],
  ["CANDLE", "Household Objects", "Wax with a wick that you light.", "EASY"],
  ["VASE", "Household Objects", "A container for cut flowers.", "EASY"],
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
    return { ok: true, solved: player.puzzle.solved, reward: player.puzzle.solved ? player.change : 0, place: player.puzzle.place, lives: player.puzzle.lives, message: player.puzzle.solved ? `You solved it for $${player.change.toLocaleString("en-US")}.` : `${letter} is in the word.` };
  }
  player.puzzle.wrong.push(letter);
  player.puzzle.lives -= 1;
  return { ok: true, solved: false, reward: 0, place: null, lives: player.puzzle.lives, message: player.puzzle.lives > 0 ? `${letter} is not in the word.` : "That miss used your last life. You can watch the rest of the race." };
}

function awardSolve(room, player) {
  room.puzzle.solvedCount = (room.puzzle.solvedCount || 0) + 1;
  player.puzzle.place = room.puzzle.solvedCount;
  player.puzzle.solved = true;
  const reward = powerups.scaleReward(player, hangmanReward(player.puzzle.lives, room.settings));
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
  return { ok: true, solved: player.puzzle.solved, reward: player.puzzle.solved ? player.change : 0, place: player.puzzle.place, lives: player.puzzle.lives, message: player.puzzle.solved ? `You solved it for $${player.change.toLocaleString("en-US")}.` : `${letter} locked onto your board.` };
}

function attackLife(room, attacker, target) {
  if (room.settings?.hangmanAttacks === false) return { ok: false, error: "ATTACKS_OFF", message: "Attacks are turned off for this match." };
  if (room.phase !== "HANGMAN") return { ok: false, error: "WRONG_PHASE", message: "Attacks are only allowed during the race." };
  if (!activeGuesser(attacker)) return { ok: false, error: "NOT_PLAYING", message: "You need lives left to attack." };
  if (!target || target.id === attacker.id) return { ok: false, error: "INVALID_TARGET", message: "Choose another player." };
  if (!target.connected || !target.puzzle) return { ok: false, error: "INVALID_TARGET", message: "That player is not in this race." };
  if (target.puzzle.solved || target.puzzle.lives <= 0) return { ok: false, error: "INVALID_TARGET", message: "That player has no life left to take." };
  if (!spend(attacker, HANGMAN_COSTS.attack)) return { ok: false, error: "INSUFFICIENT_CASH", message: `You need $${HANGMAN_COSTS.attack} to remove a life.` };
  if (powerups.absorb(room, target, "REMOVE_LIFE")) return { ok: true, blocked: true, message: `${target.name} blocked the attack.` };
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
    return { ok: true, message: "Double Down activated.", metadata: { multiplier: 2 } };
  }
  if (eventId === "CASH_DROP") {
    if (player.pendingDrop) return { ok: false, error: "DUPLICATE_PURCHASE", message: "A cash drop is already waiting on your next correct answer." };
    player.pendingDrop = 150;
    return { ok: true, message: "Cash Drop activated. Your next correct answer pays an extra $150.", amount: 150, metadata: { pending: true } };
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
    if (powerups.absorb(room, target, "BANK_HEIST")) return { ok: true, blocked: true, message: `${target.name} blocked the heist.`, amount: 0, targetId: target.id, targetName: target.name };
    const amount = Math.min(150, Math.max(1, Math.floor(target.balance * 0.1)));
    const moved = Math.min(target.balance, amount);
    target.balance -= moved;
    player.balance += moved;
    return { ok: true, message: `${player.name} lifted $${moved} from ${target.name}.`, amount: moved, targetId: target.id, targetName: target.name };
  }
  if (eventId === "BOUNTY" || eventId === "STEAL") {
    if (room.settings?.gameMode === "HANGMAN" || !room.roundState) return { ok: false, error: "WRONG_PHASE", message: "That event belongs on a trivia round." };
    if (!target || target.id === player.id) return { ok: false, error: "INVALID_TARGET", message: "Choose another player." };
    if (eventId === "BOUNTY") room.roundState.bountyId = target.id;
    else room.roundState.steal = { thiefId: player.id, victimId: target.id };
    return { ok: true, message: eventId === "BOUNTY" ? `Bounty placed on ${target.name}.` : `Steal Chance aimed at ${target.name}.`, targetId: target.id, targetName: target.name };
  }
  if (eventId === "CHAOS") {
    const options = room.settings?.gameMode === "HANGMAN" ? ["LIGHTNING"] : ["DOUBLE_DOWN", "CASH_DROP", "LIGHTNING", "FINAL_GAMBLE"];
    const picked = options[randomInt(options.length)];
    const inner = applyPurchasedEffect(room, player, picked, null, randomInt);
    if (!inner.ok) return inner;
    return { ok: true, message: `Chaos Round: ${inner.message}`, amount: inner.amount, targetId: inner.targetId, targetName: inner.targetName, metadata: { ...(inner.metadata || {}), effect: picked } };
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
  return {
    ok: true,
    message: `${effect.message} $${player.balance.toLocaleString("en-US")} remaining.`,
    cue: effect.blocked ? null : {
      type: eventId,
      playerId: player.id,
      playerName: player.name,
      targetPlayerId: effect.targetId || null,
      targetName: effect.targetName || null,
      amount: Number.isFinite(effect.amount) ? effect.amount : null,
      metadata: { ...(effect.metadata || {}), ...(eventId === "BANK_HEIST" && effect.amount ? { travel: "to-player" } : {}) },
      description: effect.message,
    },
  };
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
