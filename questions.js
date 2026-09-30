'use strict';

const questions = [
  {
    "id": "q001",
    "question": "Which planet is known as the Red Planet?",
    "answers": [
      "Venus",
      "Mars",
      "Jupiter",
      "Mercury"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q002",
    "question": "What is the chemical symbol for gold?",
    "answers": [
      "Ag",
      "Au",
      "Fe",
      "Go"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q003",
    "question": "What gas do plants absorb from the atmosphere?",
    "answers": [
      "Oxygen",
      "Nitrogen",
      "Carbon dioxide",
      "Hydrogen"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Hard"
  },
  {
    "id": "q004",
    "question": "What is the largest organ of the human body?",
    "answers": [
      "Liver",
      "Skin",
      "Lung",
      "Heart"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q005",
    "question": "How many bones are typically in an adult human body?",
    "answers": [
      "186",
      "206",
      "226",
      "246"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q006",
    "question": "What is the center of an atom called?",
    "answers": [
      "Nucleus",
      "Electron",
      "Isotope",
      "Molecule"
    ],
    "correctAnswer": 0,
    "category": "Science",
    "difficulty": "Hard"
  },
  {
    "id": "q007",
    "question": "Which force keeps planets in orbit around the Sun?",
    "answers": [
      "Magnetism",
      "Friction",
      "Gravity",
      "Electricity"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q008",
    "question": "At what temperature does water freeze on the Celsius scale?",
    "answers": [
      "0°C",
      "10°C",
      "32°C",
      "-10°C"
    ],
    "correctAnswer": 0,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q009",
    "question": "Which part of a cell contains most of its genetic material?",
    "answers": [
      "Cell wall",
      "Nucleus",
      "Ribosome",
      "Membrane"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Hard"
  },
  {
    "id": "q010",
    "question": "What is the closest star to Earth?",
    "answers": [
      "Sirius",
      "Proxima Centauri",
      "The Sun",
      "Polaris"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q011",
    "question": "What is the capital of Japan?",
    "answers": [
      "Kyoto",
      "Osaka",
      "Tokyo",
      "Nagoya"
    ],
    "correctAnswer": 2,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q012",
    "question": "Which is the longest river in South America?",
    "answers": [
      "Paraná",
      "Amazon",
      "Orinoco",
      "São Francisco"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Hard"
  },
  {
    "id": "q013",
    "question": "On which continent is the Sahara Desert?",
    "answers": [
      "Asia",
      "Africa",
      "Australia",
      "South America"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q014",
    "question": "Which country has a maple leaf on its national flag?",
    "answers": [
      "Canada",
      "Austria",
      "Denmark",
      "Finland"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q015",
    "question": "What is the largest ocean on Earth?",
    "answers": [
      "Atlantic Ocean",
      "Indian Ocean",
      "Arctic Ocean",
      "Pacific Ocean"
    ],
    "correctAnswer": 3,
    "category": "Geography",
    "difficulty": "Hard"
  },
  {
    "id": "q016",
    "question": "Which European capital is divided by the River Seine?",
    "answers": [
      "Rome",
      "Paris",
      "Vienna",
      "Prague"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q017",
    "question": "Mount Kilimanjaro is located in which country?",
    "answers": [
      "Kenya",
      "Tanzania",
      "Uganda",
      "Ethiopia"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q018",
    "question": "What is the smallest country in the world by area?",
    "answers": [
      "Monaco",
      "San Marino",
      "Vatican City",
      "Liechtenstein"
    ],
    "correctAnswer": 2,
    "category": "Geography",
    "difficulty": "Hard"
  },
  {
    "id": "q019",
    "question": "Which U.S. state is known as the Aloha State?",
    "answers": [
      "Florida",
      "Hawaii",
      "California",
      "Alaska"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q020",
    "question": "The Great Barrier Reef lies off the coast of which country?",
    "answers": [
      "Mexico",
      "Australia",
      "Indonesia",
      "South Africa"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q021",
    "question": "In which year did the first Moon landing take place?",
    "answers": [
      "1959",
      "1969",
      "1972",
      "1981"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q022",
    "question": "Who was the first president of the United States?",
    "answers": [
      "Thomas Jefferson",
      "John Adams",
      "George Washington",
      "James Madison"
    ],
    "correctAnswer": 2,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q023",
    "question": "Which ancient civilization built the city of Machu Picchu?",
    "answers": [
      "Maya",
      "Inca",
      "Aztec",
      "Olmec"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q024",
    "question": "The Magna Carta was first issued in which country?",
    "answers": [
      "France",
      "England",
      "Spain",
      "Italy"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q025",
    "question": "Who was the first person to circumnavigate the globe?",
    "answers": [
      "Ferdinand Magellan",
      "Juan Sebastián Elcano",
      "Christopher Columbus",
      "Vasco da Gama"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q026",
    "question": "Which wall fell in 1989, symbolizing the end of a divided city?",
    "answers": [
      "Hadrian’s Wall",
      "Great Wall of China",
      "Berlin Wall",
      "Wailing Wall"
    ],
    "correctAnswer": 2,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q027",
    "question": "In which country did the Renaissance begin?",
    "answers": [
      "Italy",
      "Germany",
      "Greece",
      "France"
    ],
    "correctAnswer": 0,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q028",
    "question": "Who was the Egyptian queen associated with Julius Caesar and Mark Antony?",
    "answers": [
      "Nefertiti",
      "Hatshepsut",
      "Cleopatra VII",
      "Sobekneferu"
    ],
    "correctAnswer": 2,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q029",
    "question": "Which ship carried the Pilgrims to North America in 1620?",
    "answers": [
      "Endeavour",
      "Mayflower",
      "Santa Maria",
      "Beagle"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q030",
    "question": "What was the name of the trade route linking China with the Mediterranean?",
    "answers": [
      "Spice Road",
      "Amber Road",
      "Silk Road",
      "Royal Road"
    ],
    "correctAnswer": 2,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q031",
    "question": "What is the name of the school attended by Harry Potter?",
    "answers": [
      "Beauxbatons",
      "Hogwarts",
      "Durmstrang",
      "Ilvermorny"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q032",
    "question": "Which instrument does a pianist play?",
    "answers": [
      "Harp",
      "Piano",
      "Cello",
      "Oboe"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q033",
    "question": "Who created the fictional detective Sherlock Holmes?",
    "answers": [
      "Agatha Christie",
      "Arthur Conan Doyle",
      "Charles Dickens",
      "Wilkie Collins"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Hard"
  },
  {
    "id": "q034",
    "question": "In the original Star Wars trilogy, what is the name of Han Solo’s ship?",
    "answers": [
      "X-wing",
      "Millennium Falcon",
      "Tantive IV",
      "Star Destroyer"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q035",
    "question": "Which animated film features a snowman named Olaf?",
    "answers": [
      "Moana",
      "Frozen",
      "Tangled",
      "Brave"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q036",
    "question": "Which band recorded the album Abbey Road?",
    "answers": [
      "The Rolling Stones",
      "The Beatles",
      "The Who",
      "The Kinks"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Hard"
  },
  {
    "id": "q037",
    "question": "What is the name of the cowboy in Toy Story?",
    "answers": [
      "Buzz",
      "Woody",
      "Rex",
      "Andy"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q038",
    "question": "Which fictional city is Batman most closely associated with?",
    "answers": [
      "Metropolis",
      "Gotham City",
      "Star City",
      "Central City"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q039",
    "question": "Who painted the Mona Lisa?",
    "answers": [
      "Michelangelo",
      "Leonardo da Vinci",
      "Raphael",
      "Sandro Botticelli"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Hard"
  },
  {
    "id": "q040",
    "question": "Which literary character lives at 221B Baker Street?",
    "answers": [
      "Hercule Poirot",
      "Sherlock Holmes",
      "Dracula",
      "Peter Pan"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q041",
    "question": "How many players from one team are on the court in a basketball game?",
    "answers": [
      "4",
      "5",
      "6",
      "7"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q042",
    "question": "In tennis, what word means a score of zero?",
    "answers": [
      "Nil",
      "Love",
      "Blank",
      "Duck"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Hard"
  },
  {
    "id": "q043",
    "question": "How often are the Summer Olympic Games normally held?",
    "answers": [
      "Every two years",
      "Every three years",
      "Every four years",
      "Every five years"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q044",
    "question": "Which sport uses a shuttlecock?",
    "answers": [
      "Squash",
      "Badminton",
      "Table tennis",
      "Lacrosse"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q045",
    "question": "How many points is a touchdown worth before any extra attempt?",
    "answers": [
      "3",
      "6",
      "7",
      "8"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Hard"
  },
  {
    "id": "q046",
    "question": "The Tour de France is primarily a competition in which sport?",
    "answers": [
      "Motor racing",
      "Cycling",
      "Running",
      "Rowing"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q047",
    "question": "In soccer, what is it called when a player scores three goals in one match?",
    "answers": [
      "Triple play",
      "Hat-trick",
      "Clean sweep",
      "Three-pointer"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q048",
    "question": "Which country hosted the first modern Olympic Games in 1896?",
    "answers": [
      "France",
      "Greece",
      "United Kingdom",
      "Italy"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Hard"
  },
  {
    "id": "q049",
    "question": "How many strikes make an out in baseball?",
    "answers": [
      "Two",
      "Three",
      "Four",
      "Five"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q050",
    "question": "What color jersey is worn by the overall leader of the Tour de France?",
    "answers": [
      "Green",
      "Polka-dot",
      "Yellow",
      "White"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q051",
    "question": "How many days are in a leap year?",
    "answers": [
      "364",
      "365",
      "366",
      "367"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q052",
    "question": "What is the currency of the United Kingdom?",
    "answers": [
      "Euro",
      "Pound sterling",
      "Swiss franc",
      "Dollar"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q053",
    "question": "What does CPU stand for?",
    "answers": [
      "Central Processing Unit",
      "Computer Personal Utility",
      "Core Program Upload",
      "Central Power User"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q054",
    "question": "Which company developed the Windows operating system?",
    "answers": [
      "Apple",
      "IBM",
      "Microsoft",
      "Google"
    ],
    "correctAnswer": 2,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q055",
    "question": "What does URL identify?",
    "answers": [
      "A web address",
      "A computer processor",
      "A type of battery",
      "A file compression format"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q056",
    "question": "Which two digits are used in the binary number system?",
    "answers": [
      "0 and 1",
      "1 and 2",
      "0 and 9",
      "2 and 10"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q057",
    "question": "What is the common name for malicious software?",
    "answers": [
      "Firmware",
      "Malware",
      "Freeware",
      "Shareware"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q058",
    "question": "Which device routes data between computer networks?",
    "answers": [
      "Router",
      "Monitor",
      "Keyboard",
      "Scanner"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q059",
    "question": "How many sides does a hexagon have?",
    "answers": [
      "Five",
      "Six",
      "Seven",
      "Eight"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q060",
    "question": "What is the primary language spoken in Brazil?",
    "answers": [
      "Spanish",
      "Portuguese",
      "French",
      "Italian"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q061",
    "question": "Which instrument measures temperature?",
    "answers": [
      "Barometer",
      "Thermometer",
      "Altimeter",
      "Compass"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q062",
    "question": "What does the abbreviation Wi-Fi commonly refer to?",
    "answers": [
      "Wireless networking",
      "Wired file indexing",
      "Wide format interface",
      "Web finder"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q063",
    "question": "What is the boiling point of water at sea level on the Celsius scale?",
    "answers": [
          "90 degrees",
          "100 degrees",
          "112 degrees",
          "212 degrees"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q064",
    "question": "Which gas makes up most of Earth's atmosphere?",
    "answers": [
          "Oxygen",
          "Carbon dioxide",
          "Nitrogen",
          "Hydrogen"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q065",
    "question": "Which particle carries a negative electric charge?",
    "answers": [
          "Proton",
          "Neutron",
          "Electron",
          "Photon"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q066",
    "question": "Which vitamin does skin help make in sunlight?",
    "answers": [
          "Vitamin A",
          "Vitamin C",
          "Vitamin D",
          "Vitamin K"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q067",
    "question": "What is the hardest known natural mineral?",
    "answers": [
          "Quartz",
          "Diamond",
          "Topaz",
          "Steel"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q068",
    "question": "How many chambers does a human heart have?",
    "answers": [
          "Two",
          "Three",
          "Four",
          "Six"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q069",
    "question": "Which planet is closest to the Sun?",
    "answers": [
          "Venus",
          "Mercury",
          "Earth",
          "Mars"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q070",
    "question": "What is the chemical formula for table salt?",
    "answers": [
          "NaCl",
          "KCl",
          "CaCO3",
          "H2SO4"
    ],
    "correctAnswer": 0,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q071",
    "question": "Which organ produces insulin?",
    "answers": [
          "Liver",
          "Pancreas",
          "Kidney",
          "Spleen"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q072",
    "question": "What is a mitochondrion often called?",
    "answers": [
          "The cell wall",
          "The powerhouse of the cell",
          "The nucleus gate",
          "The ribosome"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q073",
    "question": "Which acid is the main acid in stomach juice?",
    "answers": [
          "Citric acid",
          "Acetic acid",
          "Hydrochloric acid",
          "Lactic acid"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q074",
    "question": "Which scale is the classic measure of earthquake magnitude?",
    "answers": [
          "Beaufort",
          "Richter",
          "Mohs",
          "Kelvin"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q075",
    "question": "Which planet is best known for a broad ring system?",
    "answers": [
          "Mars",
          "Venus",
          "Saturn",
          "Mercury"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q076",
    "question": "Which part of the ear contains the cochlea?",
    "answers": [
          "The inner ear",
          "The earlobe",
          "The eyebrow",
          "The jaw"
    ],
    "correctAnswer": 0,
    "category": "Science",
    "difficulty": "Hard"
  },
  {
    "id": "q077",
    "question": "What do animals mainly breathe out?",
    "answers": [
          "Oxygen",
          "Nitrogen",
          "Carbon dioxide",
          "Helium"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q078",
    "question": "How many chromosomes are in a typical human body cell?",
    "answers": [
          "23",
          "46",
          "48",
          "64"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q079",
    "question": "Who stated the three laws of motion?",
    "answers": [
          "Darwin",
          "Newton",
          "Edison",
          "Curie"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q080",
    "question": "Which planet is the largest in the solar system?",
    "answers": [
          "Earth",
          "Saturn",
          "Jupiter",
          "Neptune"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q081",
    "question": "Which blood cells help blood clot?",
    "answers": [
          "Red cells",
          "Platelets",
          "Neurons",
          "Alveoli"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q082",
    "question": "What is the SI unit of electrical resistance?",
    "answers": [
          "Volt",
          "Ampere",
          "Ohm",
          "Watt"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q083",
    "question": "Which metal is liquid at ordinary room temperature?",
    "answers": [
          "Iron",
          "Mercury",
          "Copper",
          "Aluminum"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q084",
    "question": "What is the study of earthquakes called?",
    "answers": [
          "Geology",
          "Seismology",
          "Ecology",
          "Astronomy"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q085",
    "question": "Which layer of Earth is a liquid metal around the core?",
    "answers": [
          "Crust",
          "Mantle only",
          "Outer core",
          "Atmosphere"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Hard"
  },
  {
    "id": "q086",
    "question": "What process do plants use to make food from light?",
    "answers": [
          "Respiration",
          "Photosynthesis",
          "Fermentation",
          "Distillation"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q087",
    "question": "Which planet is the hottest in the solar system?",
    "answers": [
          "Mercury",
          "Venus",
          "Mars",
          "Jupiter"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q088",
    "question": "What is a group of lions called?",
    "answers": [
          "A pack",
          "A pride",
          "A herd",
          "A school"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q089",
    "question": "Which bird is the fastest animal in a hunting dive?",
    "answers": [
          "Ostrich",
          "Peregrine falcon",
          "Penguin",
          "Sparrow"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q090",
    "question": "What is the center of our solar system?",
    "answers": [
          "Earth",
          "The Moon",
          "The Sun",
          "Jupiter"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q091",
    "question": "Which simple machine is a sloping ramp?",
    "answers": [
          "Lever",
          "Pulley",
          "Inclined plane",
          "Wedge only"
    ],
    "correctAnswer": 2,
    "category": "Science",
    "difficulty": "Medium"
  },
  {
    "id": "q092",
    "question": "What do honeybees collect from flowers before making honey?",
    "answers": [
          "Pollen only",
          "Nectar",
          "Bark",
          "Dew"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q093",
    "question": "Which scientist is most closely associated with natural selection?",
    "answers": [
          "Newton",
          "Darwin",
          "Faraday",
          "Bohr"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q094",
    "question": "What is the main gas in the bubbles of a soda?",
    "answers": [
          "Oxygen",
          "Carbon dioxide",
          "Hydrogen",
          "Neon"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q095",
    "question": "How many planets are in our solar system?",
    "answers": [
          "Seven",
          "Eight",
          "Nine",
          "Ten"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q096",
    "question": "Which bone protects the brain?",
    "answers": [
          "Femur",
          "Skull",
          "Tibia",
          "Rib"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q097",
    "question": "Who was the first person to walk on the Moon?",
    "answers": [
          "Buzz Aldrin",
          "Neil Armstrong",
          "Yuri Gagarin",
          "John Glenn"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q098",
    "question": "In which year did World War II end?",
    "answers": [
          "1918",
          "1945",
          "1950",
          "1963"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q099",
    "question": "Which empire built the Colosseum?",
    "answers": [
          "Greek",
          "Roman",
          "Ottoman",
          "Mongol"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q100",
    "question": "Who was the British prime minister for most of World War II?",
    "answers": [
          "Chamberlain",
          "Churchill",
          "Thatcher",
          "Blair"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q101",
    "question": "The Great Wall is in which country?",
    "answers": [
          "Japan",
          "China",
          "India",
          "Mongolia"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q102",
    "question": "Who painted the ceiling of the Sistine Chapel?",
    "answers": [
          "Da Vinci",
          "Michelangelo",
          "Raphael",
          "Donatello"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q103",
    "question": "Which war was fought between the North and the South in the United States?",
    "answers": [
          "War of 1812",
          "Civil War",
          "Spanish-American War",
          "Korean War"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q104",
    "question": "In which city was the Declaration of Independence adopted?",
    "answers": [
          "Boston",
          "Philadelphia",
          "New York",
          "Richmond"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q105",
    "question": "Who was the first emperor of a unified China?",
    "answers": [
          "Kublai Khan",
          "Qin Shi Huang",
          "Sun Yat-sen",
          "Confucius"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q106",
    "question": "Which ship sank in 1912 after hitting an iceberg?",
    "answers": [
          "Lusitania",
          "Titanic",
          "Britannic",
          "Mary Rose"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q107",
    "question": "The French Revolution began in which year?",
    "answers": [
          "1776",
          "1789",
          "1815",
          "1848"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q108",
    "question": "Who led the Salt March in India?",
    "answers": [
          "Nehru",
          "Gandhi",
          "Jinnah",
          "Tagore"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q109",
    "question": "Which ancient library city is associated with Egypt's Mediterranean coast?",
    "answers": [
          "Athens",
          "Alexandria",
          "Carthage",
          "Troy"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q110",
    "question": "The Battle of Hastings was in which year?",
    "answers": [
          "1066",
          "1215",
          "1415",
          "1588"
    ],
    "correctAnswer": 0,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q111",
    "question": "Who wrote the Ninety-five Theses that sparked the Reformation?",
    "answers": [
          "Calvin",
          "Luther",
          "Erasmus",
          "Henry VIII"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q112",
    "question": "Which civilization built Machu Picchu's mountain city?",
    "answers": [
          "Aztec",
          "Inca",
          "Maya",
          "Olmec"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q113",
    "question": "The Berlin Wall opened in which year?",
    "answers": [
          "1961",
          "1975",
          "1989",
          "1991"
    ],
    "correctAnswer": 2,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q114",
    "question": "Who was queen of Egypt and ally of Julius Caesar?",
    "answers": [
          "Nefertiti",
          "Cleopatra",
          "Hatshepsut",
          "Isis"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q115",
    "question": "Which document limited the English king's power in 1215?",
    "answers": [
          "Bill of Rights",
          "Magna Carta",
          "Domesday Book",
          "Petition of Right"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q116",
    "question": "The Industrial Revolution began in which country?",
    "answers": [
          "France",
          "Britain",
          "Germany",
          "United States"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q117",
    "question": "Who was the first woman to fly solo across the Atlantic?",
    "answers": [
          "Amelia Earhart",
          "Bessie Coleman",
          "Harriet Quimby",
          "Valentina Tereshkova"
    ],
    "correctAnswer": 0,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q118",
    "question": "Which empire was ruled from Constantinople for centuries?",
    "answers": [
          "Roman Republic",
          "Byzantine Empire",
          "Persian Empire",
          "Mali Empire"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q119",
    "question": "The American Revolutionary War began in which decade?",
    "answers": [
          "1750s",
          "1770s",
          "1810s",
          "1860s"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q120",
    "question": "Who invented the movable-type printing press in Europe?",
    "answers": [
          "Gutenberg",
          "Franklin",
          "Bell",
          "Watt"
    ],
    "correctAnswer": 0,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q121",
    "question": "Which city was divided into East and West during the Cold War?",
    "answers": [
          "Vienna",
          "Berlin",
          "Prague",
          "Warsaw"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q122",
    "question": "The Rosetta Stone helped scholars read which script?",
    "answers": [
          "Cuneiform",
          "Hieroglyphs",
          "Runes",
          "Linear B only"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q123",
    "question": "Who was the 16th president of the United States?",
    "answers": [
          "Jefferson",
          "Lincoln",
          "Grant",
          "Washington"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q124",
    "question": "Which explorer's crew completed the first circumnavigation?",
    "answers": [
          "Columbus",
          "Magellan",
          "Cook",
          "Vasco da Gama"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q125",
    "question": "The pyramids of Giza were built as what?",
    "answers": [
          "Temples to the Nile",
          "Tombs",
          "Granaries",
          "Observatories"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q126",
    "question": "Which alliance included Germany, Austria-Hungary, and the Ottoman Empire in World War I?",
    "answers": [
          "Allied Powers",
          "Central Powers",
          "Triple Entente",
          "NATO"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q127",
    "question": "Apartheid was a system of racial separation in which country?",
    "answers": [
          "Kenya",
          "South Africa",
          "Nigeria",
          "Egypt"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q128",
    "question": "Who was the first emperor of Rome?",
    "answers": [
          "Julius Caesar",
          "Augustus",
          "Nero",
          "Constantine"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q129",
    "question": "The Hundred Years' War was fought mainly between which two kingdoms?",
    "answers": [
          "Spain and Portugal",
          "England and France",
          "Sweden and Denmark",
          "Poland and Russia"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Hard"
  },
  {
    "id": "q130",
    "question": "What is the capital of Canada?",
    "answers": [
          "Toronto",
          "Ottawa",
          "Montreal",
          "Vancouver"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q131",
    "question": "Which river flows through Egypt?",
    "answers": [
          "Amazon",
          "Nile",
          "Congo",
          "Niger"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q132",
    "question": "What is the capital of Australia?",
    "answers": [
          "Sydney",
          "Melbourne",
          "Canberra",
          "Perth"
    ],
    "correctAnswer": 2,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q133",
    "question": "Which mountain is the highest above sea level?",
    "answers": [
          "K2",
          "Everest",
          "Kilimanjaro",
          "Denali"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q134",
    "question": "The Amazon rainforest is mostly in which country?",
    "answers": [
          "Brazil",
          "Argentina",
          "Mexico",
          "Chile"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q135",
    "question": "Which continent is the Sahara Desert on?",
    "answers": [
          "Asia",
          "Africa",
          "Australia",
          "Europe"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q136",
    "question": "What is the capital of France?",
    "answers": [
          "Lyon",
          "Paris",
          "Marseille",
          "Nice"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q137",
    "question": "Which ocean lies between Africa and Australia?",
    "answers": [
          "Atlantic",
          "Indian",
          "Arctic",
          "Southern only"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q138",
    "question": "What is the capital of Egypt?",
    "answers": [
          "Cairo",
          "Alexandria",
          "Luxor",
          "Giza"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q139",
    "question": "Which U.S. state is an archipelago in the Pacific?",
    "answers": [
          "Alaska",
          "Hawaii",
          "Florida",
          "California"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q140",
    "question": "The Thames flows through which city?",
    "answers": [
          "London",
          "Dublin",
          "Edinburgh",
          "Cardiff"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q141",
    "question": "Which country is both a continent and a country?",
    "answers": [
          "Greenland",
          "Australia",
          "Madagascar",
          "Iceland"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q142",
    "question": "What is the capital of Italy?",
    "answers": [
          "Milan",
          "Rome",
          "Venice",
          "Naples"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q143",
    "question": "Which desert covers much of Mongolia and northern China?",
    "answers": [
          "Gobi",
          "Kalahari",
          "Atacama",
          "Mojave"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q144",
    "question": "The Strait of Gibraltar separates Europe from which continent?",
    "answers": [
          "Asia",
          "Africa",
          "North America",
          "Australia"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q145",
    "question": "What is the capital of Kenya?",
    "answers": [
          "Nairobi",
          "Mombasa",
          "Kampala",
          "Addis Ababa"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q146",
    "question": "Which is the largest country by land area?",
    "answers": [
          "Canada",
          "China",
          "Russia",
          "United States"
    ],
    "correctAnswer": 2,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q147",
    "question": "Machu Picchu is in which country?",
    "answers": [
          "Mexico",
          "Peru",
          "Bolivia",
          "Chile"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q148",
    "question": "What is the capital of South Korea?",
    "answers": [
          "Busan",
          "Seoul",
          "Pyongyang",
          "Incheon"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q149",
    "question": "Which river runs through London, but this one runs through Baghdad?",
    "answers": [
          "Tigris",
          "Danube",
          "Rhine",
          "Volga"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Hard"
  },
  {
    "id": "q150",
    "question": "The Andes run along which continent?",
    "answers": [
          "Africa",
          "South America",
          "Europe",
          "Australia"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q151",
    "question": "What is the capital of Spain?",
    "answers": [
          "Barcelona",
          "Madrid",
          "Seville",
          "Valencia"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q152",
    "question": "Which African river is the world's longest by the common modern measure?",
    "answers": [
          "Congo",
          "Nile",
          "Niger",
          "Zambezi"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q153",
    "question": "What is the capital of Norway?",
    "answers": [
          "Bergen",
          "Oslo",
          "Stockholm",
          "Helsinki"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q154",
    "question": "Which sea lies between Europe and Africa at the Strait of Gibraltar?",
    "answers": [
          "Black Sea",
          "Mediterranean Sea",
          "Caspian Sea",
          "Red Sea"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q155",
    "question": "New Delhi is the capital of which country?",
    "answers": [
          "Pakistan",
          "India",
          "Bangladesh",
          "Nepal"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q156",
    "question": "Which U.S. river is the longest?",
    "answers": [
          "Colorado",
          "Missouri",
          "Hudson",
          "Columbia"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Hard"
  },
  {
    "id": "q157",
    "question": "What is the capital of Argentina?",
    "answers": [
          "Buenos Aires",
          "Santiago",
          "Lima",
          "Montevideo"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q158",
    "question": "Iceland sits on which ocean's north edge as an island country?",
    "answers": [
          "Indian",
          "Atlantic",
          "Pacific",
          "Southern"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q159",
    "question": "Which canal connects the Mediterranean and the Red Sea?",
    "answers": [
          "Panama",
          "Suez",
          "Erie",
          "Kiel"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q160",
    "question": "What is the capital of Portugal?",
    "answers": [
          "Porto",
          "Lisbon",
          "Madrid",
          "Faro"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q161",
    "question": "Lake Victoria is shared by countries in which region?",
    "answers": [
          "West Africa",
          "East Africa",
          "North Africa",
          "Southern Europe"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Hard"
  },
  {
    "id": "q162",
    "question": "How many players are on the field for one soccer team?",
    "answers": [
          "9",
          "10",
          "11",
          "12"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q163",
    "question": "Which sport is played at Wimbledon?",
    "answers": [
          "Golf",
          "Tennis",
          "Cricket",
          "Polo"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q164",
    "question": "How many holes are on a standard golf course?",
    "answers": [
          "9",
          "12",
          "18",
          "21"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q165",
    "question": "In basketball, how many points is a shot from beyond the arc?",
    "answers": [
          "1",
          "2",
          "3",
          "4"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q166",
    "question": "Which country won the 2022 FIFA World Cup?",
    "answers": [
          "France",
          "Argentina",
          "Brazil",
          "Germany"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q167",
    "question": "A marathon is about how many miles?",
    "answers": [
          "13.1",
          "20",
          "26.2",
          "31"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q168",
    "question": "Which piece of equipment is used in curling?",
    "answers": [
          "A stone",
          "A puck",
          "A shuttlecock",
          "A mallet"
    ],
    "correctAnswer": 0,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q169",
    "question": "How many periods are in a standard ice hockey game?",
    "answers": [
          "2",
          "3",
          "4",
          "5"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q170",
    "question": "Which sport uses the terms spare and strike?",
    "answers": [
          "Bowling",
          "Darts",
          "Archery",
          "Fencing"
    ],
    "correctAnswer": 0,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q171",
    "question": "The Super Bowl decides the champion of which league?",
    "answers": [
          "NBA",
          "NFL",
          "MLB",
          "NHL"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q172",
    "question": "In baseball, how many outs are in a full inning for both teams combined?",
    "answers": [
          "3",
          "6",
          "9",
          "4"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q173",
    "question": "Which country invented the modern game of basketball?",
    "answers": [
          "Canada",
          "United States",
          "England",
          "France"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q174",
    "question": "A perfect score in ten-pin bowling is what?",
    "answers": [
          "200",
          "250",
          "300",
          "360"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q175",
    "question": "Which swimming stroke is fastest in competition?",
    "answers": [
          "Breaststroke",
          "Butterfly",
          "Backstroke",
          "Freestyle"
    ],
    "correctAnswer": 3,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q176",
    "question": "How many players are on the ice for one hockey team, including the goalie?",
    "answers": [
          "5",
          "6",
          "7",
          "11"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q177",
    "question": "The Masters is a major tournament in which sport?",
    "answers": [
          "Tennis",
          "Golf",
          "Boxing",
          "Cycling"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q178",
    "question": "Which country has won the most Olympic gold medals historically?",
    "answers": [
          "China",
          "United States",
          "Russia",
          "Germany"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q179",
    "question": "In volleyball, how many hits may a team use to return the ball?",
    "answers": [
          "2",
          "3",
          "4",
          "5"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q180",
    "question": "A hat trick in hockey or soccer means how many goals by one player?",
    "answers": [
          "2",
          "3",
          "4",
          "5"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q181",
    "question": "Which surface is used at the French Open?",
    "answers": [
          "Grass",
          "Clay",
          "Hard court only",
          "Ice"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q182",
    "question": "How long is an Olympic swimming pool in meters?",
    "answers": [
          "25",
          "50",
          "100",
          "75"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q183",
    "question": "Which sport features a scrum?",
    "answers": [
          "Rugby",
          "Lacrosse",
          "Handball",
          "Softball"
    ],
    "correctAnswer": 0,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q184",
    "question": "The Kentucky Derby is a race for which animals?",
    "answers": [
          "Dogs",
          "Horses",
          "Cars",
          "Boats"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q185",
    "question": "In American football, how many points is a safety worth?",
    "answers": [
          "1",
          "2",
          "3",
          "6"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Hard"
  },
  {
    "id": "q186",
    "question": "Which city hosted the 2016 Summer Olympics?",
    "answers": [
          "London",
          "Rio de Janeiro",
          "Tokyo",
          "Beijing"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q187",
    "question": "A slam dunk is a play in which sport?",
    "answers": [
          "Volleyball",
          "Basketball",
          "Tennis",
          "Squash"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q188",
    "question": "How many rings are on the Olympic flag?",
    "answers": [
          "4",
          "5",
          "6",
          "7"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q189",
    "question": "Which sport uses a foil, epee, or saber?",
    "answers": [
          "Fencing",
          "Archery",
          "Rowing",
          "Diving"
    ],
    "correctAnswer": 0,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q190",
    "question": "The Ashes is a series in which sport?",
    "answers": [
          "Cricket",
          "Rugby",
          "Hockey",
          "Baseball"
    ],
    "correctAnswer": 0,
    "category": "Sports",
    "difficulty": "Hard"
  },
  {
    "id": "q191",
    "question": "How many minutes are in a standard soccer half?",
    "answers": [
          "30",
          "40",
          "45",
          "60"
    ],
    "correctAnswer": 2,
    "category": "Sports",
    "difficulty": "Easy"
  },
  {
    "id": "q192",
    "question": "What does HTML stand for?",
    "answers": [
          "HyperText Markup Language",
          "High Transfer Machine Language",
          "Home Tool Markup List",
          "Hyperlink Text Management Layer"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q193",
    "question": "Which company makes the iPhone?",
    "answers": [
          "Google",
          "Apple",
          "Samsung",
          "Microsoft"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q194",
    "question": "What does RAM stand for?",
    "answers": [
          "Random Access Memory",
          "Rapid Application Mode",
          "Read And Modify",
          "Remote Access Module"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q195",
    "question": "Which protocol begins a secure web address?",
    "answers": [
          "HTTP",
          "HTTPS",
          "FTP",
          "SMTP"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q196",
    "question": "What is the brain of a computer often called?",
    "answers": [
          "Monitor",
          "CPU",
          "Keyboard",
          "Printer"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q197",
    "question": "Which company created the Android operating system lineage now led by Google?",
    "answers": [
          "Nokia",
          "Google",
          "IBM",
          "Intel"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q198",
    "question": "What does PDF stand for?",
    "answers": [
          "Portable Document Format",
          "Printed Data File",
          "Public Download Folder",
          "Program Data Form"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q199",
    "question": "A bit can have how many values?",
    "answers": [
          "1",
          "2",
          "8",
          "10"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q200",
    "question": "Which device points on a screen and clicks?",
    "answers": [
          "Modem",
          "Mouse",
          "Router",
          "Server"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q201",
    "question": "What does GPS stand for?",
    "answers": [
          "Global Positioning System",
          "General Packet Service",
          "Ground Pilot Signal",
          "Graphic Print Standard"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q202",
    "question": "Which language is primarily used to style web pages?",
    "answers": [
          "HTML",
          "CSS",
          "SQL",
          "SMTP"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q203",
    "question": "What is open-source browser engine software behind Chrome called?",
    "answers": [
          "Blink",
          "Cocoa",
          "DirectX",
          "Metal"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Hard"
  },
  {
    "id": "q204",
    "question": "Which storage is typically faster, an SSD or an HDD?",
    "answers": [
          "HDD",
          "SSD",
          "They are always equal",
          "Floppy disk"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q205",
    "question": "What does AI stand for?",
    "answers": [
          "Automated Internet",
          "Artificial Intelligence",
          "Advanced Interface",
          "Analog Input"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q206",
    "question": "Which number system uses only 0 and 1?",
    "answers": [
          "Decimal",
          "Binary",
          "Hexadecimal only",
          "Octal only"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q207",
    "question": "What is phishing?",
    "answers": [
          "A fishing sport app",
          "A trick to steal personal information",
          "A type of printer",
          "A backup method"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q208",
    "question": "Which company developed the Java programming language?",
    "answers": [
          "Sun Microsystems",
          "Adobe",
          "Nintendo",
          "Xerox only"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Hard"
  },
  {
    "id": "q209",
    "question": "What does USB stand for?",
    "answers": [
          "Universal Serial Bus",
          "Unified System Board",
          "User Storage Base",
          "Ultra Speed Buffer"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q210",
    "question": "A pixel is a unit of what?",
    "answers": [
          "Sound",
          "A digital image",
          "Voltage",
          "Time"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q211",
    "question": "Which key combination often copies on Windows?",
    "answers": [
          "Ctrl+C",
          "Ctrl+V",
          "Ctrl+Z",
          "Ctrl+P"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q212",
    "question": "What is the cloud in computing?",
    "answers": [
          "A weather radar",
          "Remote servers reached over the internet",
          "A type of monitor",
          "A printer tray"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q213",
    "question": "Which database language uses SELECT statements?",
    "answers": [
          "SQL",
          "CSS",
          "SVG",
          "MIDI"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q214",
    "question": "What does LED stand for?",
    "answers": [
          "Light Emitting Diode",
          "Low Energy Display",
          "Linked Electric Drive",
          "Laser Emission Device"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q215",
    "question": "Which inventor is credited with the practical electric light bulb company era?",
    "answers": [
          "Tesla",
          "Edison",
          "Marconi",
          "Babbage"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q216",
    "question": "A firewall in computing is used to do what?",
    "answers": [
          "Cool the CPU",
          "Filter network traffic",
          "Print documents",
          "Store photos"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q217",
    "question": "What is a QR code mainly used for?",
    "answers": [
          "Playing audio",
          "Storing a scannable link or data",
          "Charging a battery",
          "Measuring temperature"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q218",
    "question": "Which company makes the PlayStation?",
    "answers": [
          "Nintendo",
          "Sony",
          "Sega",
          "Microsoft"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q219",
    "question": "What does VPN stand for?",
    "answers": [
          "Virtual Private Network",
          "Verified Public Node",
          "Visual Page Navigator",
          "Variable Port Number"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q220",
    "question": "How many bits are in a byte?",
    "answers": [
          "4",
          "8",
          "16",
          "32"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q221",
    "question": "Which app store belongs to Apple?",
    "answers": [
          "Play Store",
          "App Store",
          "Galaxy Store",
          "Steam"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q222",
    "question": "What is two-factor authentication?",
    "answers": [
          "Two passwords written down",
          "A second check besides the password",
          "Two monitors",
          "A double printer"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q223",
    "question": "Who wrote Romeo and Juliet?",
    "answers": [
          "Shakespeare",
          "Dickens",
          "Austen",
          "Twain"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q224",
    "question": "Which movie features the line about a galaxy far, far away at the start?",
    "answers": [
          "Star Trek",
          "Star Wars",
          "Dune",
          "Alien"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q225",
    "question": "What color is the cartoon sponge who lives in a pineapple?",
    "answers": [
          "Yellow",
          "Green",
          "Blue",
          "Pink"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q226",
    "question": "Which instrument has 88 keys on a full model?",
    "answers": [
          "Guitar",
          "Piano",
          "Violin",
          "Flute"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q227",
    "question": "Who is the wizard headmaster of Hogwarts?",
    "answers": [
          "Snape",
          "Dumbledore",
          "Hagrid",
          "McGonagall"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q228",
    "question": "Which band sang Bohemian Rhapsody?",
    "answers": [
          "The Beatles",
          "Queen",
          "Pink Floyd",
          "ABBA"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q229",
    "question": "In chess, which piece moves only diagonally?",
    "answers": [
          "Rook",
          "Bishop",
          "Knight",
          "King any distance"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q230",
    "question": "What is the name of Mickey Mouse's dog?",
    "answers": [
          "Pluto",
          "Goofy",
          "Donald",
          "Max"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q231",
    "question": "Which novel begins with a whale ship and Captain Ahab?",
    "answers": [
          "Moby-Dick",
          "Treasure Island",
          "The Odyssey",
          "Jaws"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q232",
    "question": "Who directed the film Jaws?",
    "answers": [
          "Spielberg",
          "Lucas",
          "Scorsese",
          "Nolan"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q233",
    "question": "Which musical is about a miserly Parisian and a loaf of bread?",
    "answers": [
          "Cats",
          "Les Miserables",
          "Hamilton",
          "Wicked"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q234",
    "question": "What is Batman's real first name?",
    "answers": [
          "Bruce",
          "Clark",
          "Peter",
          "Tony"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q235",
    "question": "Which streaming company produced Stranger Things?",
    "answers": [
          "Hulu",
          "Netflix",
          "Disney",
          "Apple"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q236",
    "question": "A haiku traditionally has how many lines?",
    "answers": [
          "2",
          "3",
          "4",
          "5"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q237",
    "question": "Which artist sang Thriller?",
    "answers": [
          "Prince",
          "Michael Jackson",
          "Madonna",
          "Elvis"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q238",
    "question": "In The Wizard of Oz, what is Dorothy's dog named?",
    "answers": [
          "Toto",
          "Terry",
          "Tiny",
          "Teddy"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q239",
    "question": "Which game piece is captured to win chess?",
    "answers": [
          "Queen",
          "King",
          "Rook",
          "Pawn"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q240",
    "question": "Who painted The Starry Night?",
    "answers": [
          "Van Gogh",
          "Monet",
          "Picasso",
          "Dalí"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q241",
    "question": "Which TV show is set in the fictional town of Springfield with a yellow family?",
    "answers": [
          "Family Guy",
          "The Simpsons",
          "Bob's Burgers",
          "South Park"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q242",
    "question": "What is the name of the lion in The Lion King who is the hero's father?",
    "answers": [
          "Scar",
          "Mufasa",
          "Simba",
          "Rafiki"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q243",
    "question": "Which instrument does a drummer play?",
    "answers": [
          "Drums",
          "Harp",
          "Oboe",
          "Cello"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q244",
    "question": "The Phantom of the Opera is what kind of show?",
    "answers": [
          "A ballet only",
          "A musical",
          "A silent film only",
          "A podcast"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q245",
    "question": "Which author wrote The Hobbit?",
    "answers": [
          "Tolkien",
          "Lewis",
          "Rowling",
          "Martin"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q246",
    "question": "What is Superman's home planet?",
    "answers": [
          "Krypton",
          "Mars",
          "Asgard",
          "Vulcan"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q247",
    "question": "Which film studio's logo is a roaring lion?",
    "answers": [
          "Paramount",
          "MGM",
          "Universal",
          "Warner"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q248",
    "question": "In poker, which hand beats a flush?",
    "answers": [
          "A pair",
          "A full house",
          "Two pair",
          "High card"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Hard"
  },
  {
    "id": "q249",
    "question": "Which character says 'To infinity and beyond'?",
    "answers": [
          "Woody",
          "Buzz Lightyear",
          "Rex",
          "Slinky"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q250",
    "question": "What is the musical term for gradually getting louder?",
    "answers": [
          "Crescendo",
          "Staccato",
          "Forte only",
          "Rest"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Hard"
  },
  {
    "id": "q251",
    "question": "Which book series features Katniss Everdeen?",
    "answers": [
          "Divergent",
          "The Hunger Games",
          "Twilight",
          "Percy Jackson"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q252",
    "question": "A sonnet traditionally has how many lines?",
    "answers": [
          "12",
          "14",
          "16",
          "10"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q253",
    "question": "Which composer wrote the Fifth Symphony with the famous four-note opening?",
    "answers": [
          "Mozart",
          "Beethoven",
          "Bach",
          "Chopin"
    ],
    "correctAnswer": 1,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q254",
    "question": "How many degrees are in a right angle?",
    "answers": [
          "45",
          "90",
          "180",
          "360"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q255",
    "question": "How many months have 31 days?",
    "answers": [
          "5",
          "6",
          "7",
          "8"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Medium"
  },
  {
    "id": "q256",
    "question": "What is the first letter of the Greek alphabet?",
    "answers": [
          "Beta",
          "Alpha",
          "Gamma",
          "Delta"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q257",
    "question": "How many cents are in a United States dollar?",
    "answers": [
          "10",
          "50",
          "100",
          "1000"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q258",
    "question": "Which way does the sun appear to rise?",
    "answers": [
          "West",
          "East",
          "North",
          "South"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q259",
    "question": "How many weeks are in a year, rounded to the nearest whole week?",
    "answers": [
          "48",
          "50",
          "52",
          "54"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q260",
    "question": "What is the opposite of nocturnal?",
    "answers": [
          "Diurnal",
          "Annual",
          "Lunar",
          "Polar"
    ],
    "correctAnswer": 0,
    "category": "General Knowledge",
    "difficulty": "Medium"
  },
  {
    "id": "q261",
    "question": "Which shape has three sides?",
    "answers": [
          "Square",
          "Triangle",
          "Pentagon",
          "Oval"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q262",
    "question": "How many zeros are in one million?",
    "answers": [
          "5",
          "6",
          "7",
          "9"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q263",
    "question": "What is the boiling point of water in Fahrenheit at sea level?",
    "answers": [
          "100",
          "180",
          "212",
          "32"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Medium"
  },
  {
    "id": "q264",
    "question": "Which month has 28 days in a common year?",
    "answers": [
          "February",
          "April",
          "June",
          "November"
    ],
    "correctAnswer": 0,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q265",
    "question": "What do you call a word that reads the same forward and backward?",
    "answers": [
          "Anagram",
          "Palindrome",
          "Homonym",
          "Acronym"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Medium"
  },
  {
    "id": "q266",
    "question": "How many continents are there in the common seven-continent model?",
    "answers": [
          "5",
          "6",
          "7",
          "8"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q267",
    "question": "Which metal is attracted by a magnet?",
    "answers": [
          "Gold",
          "Iron",
          "Copper",
          "Aluminum"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q268",
    "question": "What is 12 times 12?",
    "answers": [
          "124",
          "132",
          "144",
          "156"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q269",
    "question": "Which direction does a compass needle point?",
    "answers": [
          "South",
          "East",
          "Magnetic north",
          "West"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q270",
    "question": "How many hours are in two days?",
    "answers": [
          "24",
          "36",
          "48",
          "72"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q271",
    "question": "What is the Roman numeral for 10?",
    "answers": [
          "V",
          "X",
          "L",
          "C"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q272",
    "question": "Which season comes after winter in the Northern Hemisphere?",
    "answers": [
          "Autumn",
          "Spring",
          "Summer",
          "Fall"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q273",
    "question": "A dozen is how many?",
    "answers": [
          "10",
          "12",
          "20",
          "24"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q274",
    "question": "What is the main ingredient in glass?",
    "answers": [
          "Sand",
          "Clay",
          "Wood",
          "Salt"
    ],
    "correctAnswer": 0,
    "category": "General Knowledge",
    "difficulty": "Medium"
  },
  {
    "id": "q275",
    "question": "How many sides does a stop sign have?",
    "answers": [
          "6",
          "8",
          "10",
          "4"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q276",
    "question": "Which planet do we live on?",
    "answers": [
          "Mars",
          "Earth",
          "Venus",
          "Mercury"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q277",
    "question": "What is the past tense of go?",
    "answers": [
          "Goed",
          "Went",
          "Gone",
          "Going"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q278",
    "question": "How many legs does an insect have?",
    "answers": [
          "4",
          "6",
          "8",
          "10"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q279",
    "question": "Which ocean is the largest?",
    "answers": [
          "Atlantic",
          "Indian",
          "Pacific",
          "Arctic"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q280",
    "question": "What color do you get by mixing red and yellow?",
    "answers": [
          "Orange",
          "Purple",
          "Green",
          "Brown"
    ],
    "correctAnswer": 0,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q281",
    "question": "How many minutes are in three hours?",
    "answers": [
          "120",
          "150",
          "180",
          "200"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q282",
    "question": "Which tool measures right angles in a classroom?",
    "answers": [
          "Protractor",
          "Ruler",
          "Compass",
          "Scale"
    ],
    "correctAnswer": 0,
    "category": "General Knowledge",
    "difficulty": "Medium"
  },
  {
    "id": "q283",
    "question": "A leap year happens about every how many years?",
    "answers": [
          "2",
          "3",
          "4",
          "10"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q284",
    "question": "What is the largest land animal?",
    "answers": [
          "Giraffe",
          "African elephant",
          "Hippo",
          "Rhino"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q285",
    "question": "Which finger is usually used for a wedding ring?",
    "answers": [
          "Thumb",
          "Index",
          "Ring finger",
          "Pinky"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q286",
    "question": "How many wheels does a standard bicycle have?",
    "answers": [
          "1",
          "2",
          "3",
          "4"
    ],
    "correctAnswer": 1,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q287",
    "question": "Which blood cells carry oxygen?",
    "answers": [
          "White cells",
          "Red cells",
          "Platelets",
          "Plasma"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q288",
    "question": "What is the chemical symbol for iron?",
    "answers": [
          "Ir",
          "Fe",
          "In",
          "Io"
    ],
    "correctAnswer": 1,
    "category": "Science",
    "difficulty": "Easy"
  },
  {
    "id": "q289",
    "question": "Who was the first person in space?",
    "answers": [
          "Armstrong",
          "Gagarin",
          "Glenn",
          "Shepard"
    ],
    "correctAnswer": 1,
    "category": "History",
    "difficulty": "Medium"
  },
  {
    "id": "q290",
    "question": "The Declaration of Independence was adopted in which year?",
    "answers": [
          "1776",
          "1789",
          "1812",
          "1865"
    ],
    "correctAnswer": 0,
    "category": "History",
    "difficulty": "Easy"
  },
  {
    "id": "q291",
    "question": "What is the capital of Mexico?",
    "answers": [
          "Guadalajara",
          "Mexico City",
          "Monterrey",
          "Cancun"
    ],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "Easy"
  },
  {
    "id": "q292",
    "question": "Which country is home to the city of Marrakesh?",
    "answers": [
          "Morocco",
          "Tunisia",
          "Algeria",
          "Libya"
    ],
    "correctAnswer": 0,
    "category": "Geography",
    "difficulty": "Medium"
  },
  {
    "id": "q293",
    "question": "In baseball, how many balls make a walk?",
    "answers": [
          "3",
          "4",
          "5",
          "6"
    ],
    "correctAnswer": 1,
    "category": "Sports",
    "difficulty": "Medium"
  },
  {
    "id": "q294",
    "question": "Which sport is played with a cesta and a pelota?",
    "answers": [
          "Jai alai",
          "Polo",
          "Curling",
          "Lacrosse"
    ],
    "correctAnswer": 0,
    "category": "Sports",
    "difficulty": "Hard"
  },
  {
    "id": "q295",
    "question": "What does HTTP stand for?",
    "answers": [
          "HyperText Transfer Protocol",
          "High Transfer Text Process",
          "Home Terminal Transport Path",
          "Hyperlink Tracking Tool"
    ],
    "correctAnswer": 0,
    "category": "Technology",
    "difficulty": "Medium"
  },
  {
    "id": "q296",
    "question": "Which company makes the Xbox?",
    "answers": [
          "Sony",
          "Microsoft",
          "Nintendo",
          "Sega"
    ],
    "correctAnswer": 1,
    "category": "Technology",
    "difficulty": "Easy"
  },
  {
    "id": "q297",
    "question": "Who wrote Pride and Prejudice?",
    "answers": [
          "Austen",
          "Bronte",
          "Woolf",
          "Shelley"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Medium"
  },
  {
    "id": "q298",
    "question": "Which film features a DeLorean time machine?",
    "answers": [
          "Back to the Future",
          "Looper",
          "Tenet",
          "Interstellar"
    ],
    "correctAnswer": 0,
    "category": "Entertainment",
    "difficulty": "Easy"
  },
  {
    "id": "q299",
    "question": "How many letters are in the English alphabet?",
    "answers": [
          "24",
          "25",
          "26",
          "27"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  },
  {
    "id": "q300",
    "question": "What is the square root of 81?",
    "answers": [
          "7",
          "8",
          "9",
          "11"
    ],
    "correctAnswer": 2,
    "category": "General Knowledge",
    "difficulty": "Easy"
  }
];

module.exports = { questions };
