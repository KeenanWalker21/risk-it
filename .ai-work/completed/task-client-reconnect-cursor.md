task: Turn on in-session reconnect after a player is welcomed
files: public/client.js
completed: 2026-09-29
status: complete
developer: cursor
notes: public/client.js now sets autoReconnect after WELCOME and retries with the saved room token when that socket closes. Intentional leave still disables reconnect.
