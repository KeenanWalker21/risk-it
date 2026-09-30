task: Turn on in-session reconnect after a player is welcomed
files: public/client.js
started: 2026-09-29
status: complete
developer: cursor
notes: After WELCOME, the browser now retries the socket with the saved token. Leave still clears the token and does not reconnect. Codex's completed UI was otherwise left as-is.
