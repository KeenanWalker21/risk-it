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
  }
];

module.exports = { questions };
