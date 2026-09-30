Task: chat-filter
AI: cursor
Files:
- chat-filter.js
- chat-filter.test.js
Purpose:
Server-side chat validation: profanity masking, length limit, empty rejection, and rate limiting. No edits to files Codex currently owns.
Started:
2026-09-29
Status:
COMPLETED
Tests:
node --test chat-filter.test.js (4 passing)
Notes:
Wire with createChatGuard().accept({ playerId, text, now }) before broadcasting. package.json is owned by the host-settings claim, so npm test does not list this file yet.
