Task: game-mode-rules
AI: cursor
Files:
- game-modes.js
- game-modes.test.js
Status:
COMPLETED
Implemented:
Server-side helpers for Classic, High Stakes minimum wagers, Sudden Death elimination, Target win checks, Streak multipliers, and Sprint timers.
Tests:
node --test game-modes.test.js — 5 passing.
Not implemented:
Bankrupt, Bounty, Chaos, Teams, Hidden Hand, Tournament.
Dependency:
Do not select these modes in the lobby until server.js calls this module. That file is currently claimed for host settings.
