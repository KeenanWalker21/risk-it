task: Authoritative game rules engine and automated tests
files: game-logic.js, game-logic.test.js
completed: 2026-09-29
status: complete
developer: cursor
notes: |
  Added game-logic.js and game-logic.test.js. 18 tests passing via `node --test game-logic.test.js`.
  Covers room codes, join limits, host-only start, bet locking, insufficient funds, all-in, scoring, duplicate answers, 10-round winner, hidden correct answers, disconnect, and host transfer.
  Accepts questions.js entries whose correctAnswer is an index.
  server.js, public/*, package.json, and README.md were left untouched because codex still has them claimed.
  Integration point if the server later chooses to use it: createRoomRegistry(), then broadcast publicState only.
