Task: Host lobby controls and match settings
AI: codex
Files:
- server.js
- public/client.js
- public/style.css
- package.json
- README.md
- test/host-settings.test.js

Completed:
2026-09-29

Status:
COMPLETED

Implemented:
- Lobby host can kick another player; server blocks kicking the host and non-host requests.
- Kicked tokens and persistent client IDs are blocked from rejoining that room.
- Host can select starting cash ($500–$10,000) and 5–25 questions, with settings broadcast to all clients.
- Server computes Standard vs Custom Match and locks settings after start.
- Match balance and question count use the server-held settings.
- npm test now runs all suites; Node minimum is 22 for native WebSocket-based tests.

Tests:
- `npm test`: 25 passing, including settings sync/locking and kick/rejoin cases.
- `node --check` passed for server, client, and the new integration test.

Dependencies and limitations:
- Classic is the only selectable game mode. Other modes, question types, power-ups, chat, accounts, and progression remain future phases; unsupported game rules are not exposed as playable options.
- No changes were made to the other developer's claimed files.
