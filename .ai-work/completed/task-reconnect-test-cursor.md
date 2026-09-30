task: Test server reconnect preserves a player during an active game
files: test/reconnect.test.js
completed: 2026-09-29
status: complete
developer: cursor
notes: Added test/reconnect.test.js. The server keeps the seat, wager, and $1,000 balance, then restores the same player id from the token. A tokenless join after start is rejected.
