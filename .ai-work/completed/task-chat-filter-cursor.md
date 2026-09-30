Task: chat-filter
AI: cursor
Files:
- chat-filter.js
- chat-filter.test.js
Status:
COMPLETED
Implemented:
Server-side chat guard. Masks profanity, including capitalization, leetspeak, and spacing tricks, without blanking ordinary words such as class or password. Rejects empty messages, messages over 200 characters, more than 5 messages in 10 seconds, and the same text four times in a row.
Tests:
node --test chat-filter.test.js — 4 passing.
Dependency:
server.js and package.json are claimed by Codex for host settings. Call createChatGuard from the chat handler when that claim is finished, and add chat-filter.test.js to the npm test script.
