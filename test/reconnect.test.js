"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

function client(url) {
  const ws = new WebSocket(url);
  const messages = [];
  const waiters = [];
  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    messages.push(data);
    const index = waiters.findIndex((waiter) => waiter.predicate(data));
    if (index >= 0) waiters.splice(index, 1)[0].resolve(data);
  });
  const next = (predicate, timeout = 5000) => {
    const found = messages.find(predicate);
    if (found) return Promise.resolve(found);
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
      };
      const timer = setTimeout(() => {
        const index = waiters.indexOf(waiter);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error("Timed out waiting for server message"));
      }, timeout);
      waiters.push(waiter);
    });
  };
  const send = (type, data = {}) => ws.send(JSON.stringify({ type, ...data }));
  const open = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  return { ws, next, send, open };
}

test("a disconnected player keeps their seat and can rejoin with their token", async (t) => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT: String(port), RISKIT_TEST_FAST: "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  let host;
  let guest;
  let returned;
  let stranger;
  t.after(() => {
    for (const socket of [host?.ws, guest?.ws, returned?.ws, stranger?.ws]) {
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
    }
    child.kill();
  });

  await new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (output.includes(`:${port}`)) return resolve();
      if (child.exitCode !== null) return reject(new Error(output || "server exited"));
      if (Date.now() - started > 5000) return reject(new Error(`Server did not start: ${output}`));
      setTimeout(poll, 30);
    };
    poll();
  });

  const url = `ws://127.0.0.1:${port}`;
  host = client(url);
  guest = client(url);
  await Promise.all([host.open, guest.open]);
  host.send("CREATE", { name: "Keenan" });
  const created = await host.next((message) => message.type === "WELCOME");
  guest.send("JOIN", { name: "Marcus", code: created.room.code });
  const joined = await guest.next((message) => message.type === "WELCOME");
  host.send("START");
  await host.next((message) => message.type === "STATE" && message.room.phase === "BETTING");
  guest.send("BET", { amount: 250 });
  await host.next((message) => message.type === "STATE" && message.room.players.some((player) => player.id === joined.playerId && player.hasBet));

  guest.ws.close();
  await host.next((message) => (
    message.type === "STATE"
    && message.room.players.some((player) => player.id === joined.playerId && player.connected === false)
  ));

  returned = client(url);
  await returned.open;
  returned.send("JOIN", { name: "Marcus", code: created.room.code, token: joined.token });
  const restored = await returned.next((message) => message.type === "WELCOME");
  assert.equal(restored.playerId, joined.playerId);
  const me = restored.room.players.find((player) => player.id === joined.playerId);
  assert.equal(me.connected, true);
  assert.equal(me.balance, 1000);
  assert.equal(me.hasBet, true);
  assert.equal(restored.room.phase, "BETTING");

  stranger = client(url);
  await stranger.open;
  stranger.send("JOIN", { name: "Tyler", code: created.room.code });
  assert.equal((await stranger.next((message) => message.type === "ERROR")).code, "GAME_IN_PROGRESS");
});
