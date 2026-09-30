Task: game-mode-rules
AI: cursor
Files:
- game-modes.js
- game-modes.test.js
Purpose:
Authoritative rules for Classic, High Stakes, Sudden Death, Target, Streak, and Sprint.
Started:
2026-09-29
Status:
COMPLETED
Tests:
node --test game-modes.test.js (5 passing)
Notes:
Not wired into server.js while Codex owns that file. BANKRUPT, BOUNTY, CHAOS, TEAMS, HIDDEN_HAND, and TOURNAMENT are intentionally not implemented yet.
