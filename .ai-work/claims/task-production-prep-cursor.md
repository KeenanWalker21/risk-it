Task: production-prep
AI: cursor
Files:
- server.js
- README.md
- .env.example
Purpose:
Keep the fast test mode out of production and document how to deploy the existing server.
Started:
2026-09-29
Status:
COMPLETED
Tests:
npm test — 25 passing. node --check server.js and public/client.js.
