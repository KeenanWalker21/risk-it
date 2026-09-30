# RISK IT

RISK IT is a fast, real-time trivia wager game for 2–12 players. The host creates a room, shares its six-character code, and starts a synchronized match. Lobby hosts can remove players, set starting cash ($500–$10,000), and choose 5–25 questions. The server marks non-default settings as a custom match. Classic is the currently playable mode. Everyone begins with the configured bankroll. Choose a wager before each question: a correct answer earns that amount and a wrong or missing answer loses it. The server calculates every balance and the final winner.

## Run locally

Requires Node.js 22 or newer. The app uses Node’s built-in HTTP support and a small native WebSocket handler, with no runtime package dependencies.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in two browser windows or devices. Set `PORT` to change the listening port. To play across devices on the same network, open the host machine’s LAN address on the other device. There is no database or account setup for this MVP; active rooms live in server memory and disappear when the server stops.

## How to play

1. Create a game and share its room code, or join using a code from the host.
2. The host can adjust match settings or remove lobby players, then starts when at least two players are online.
3. Pick a wager ($50, $100, $250, $500, or all in) during the 10-second betting phase.
4. Answer the four-choice question before the 15-second timer ends.
5. See the correct answer, wager result, and live standings. After the configured number of questions, the server announces the winner.

Player reconnect tokens are stored in the browser’s local storage. Refreshing or briefly disconnecting restores the player’s room state while that server process is running. A room code can be copied from the lobby.

## Development

```sh
npm test
```

The test suite covers the standalone game rules, question-bank validation, room creation/joining, reconnects, host settings and kicks, room switching, bet validation and locking, answer scoring, and the final winner. Some integration tests use a fast one-round local server. To run the normal game, use `npm run dev` without `RISKIT_TEST_FAST=1`.

No external trivia API, database, account system, or secrets are required.
