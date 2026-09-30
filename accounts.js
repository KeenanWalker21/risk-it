"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const DUMMY_SALT = crypto.randomBytes(16);
const DUMMY_HASH = crypto.scryptSync("dummy-password", DUMMY_SALT, 32);

function defaultPath() {
  return process.env.RISKIT_DATA || path.join(__dirname, "data", "accounts.sqlite");
}

function validateUsername(username) {
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,16}$/.test(username)) return "INVALID_USERNAME";
  return null;
}

function validateEmail(email) {
  if (typeof email !== "string") return "INVALID_EMAIL";
  const value = email.trim();
  if (value.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "INVALID_EMAIL";
  return null;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 72) return "WEAK_PASSWORD";
  return null;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function passwordMatches(password, saltHex, hashHex) {
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 32);
  const expected = Buffer.from(hashHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function createAccountStore(filePath = defaultPath()) {
  if (filePath !== ":memory:") fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      username_key TEXT NOT NULL UNIQUE,
      email_key TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, username_key, email_key, password_hash, password_salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const findUsername = db.prepare("SELECT id, username FROM users WHERE username_key = ?");
  const findEmail = db.prepare("SELECT id, username FROM users WHERE email_key = ?");
  const findLogin = db.prepare("SELECT id, username, password_hash, password_salt FROM users WHERE username_key = ? OR email_key = ?");
  const insertSession = db.prepare("INSERT INTO sessions (token_hash, user_id, created_at) VALUES (?, ?, ?)");
  const findSession = db.prepare(`
    SELECT users.id, users.username, sessions.created_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
  `);
  const deleteSession = db.prepare("DELETE FROM sessions WHERE token_hash = ?");

  function createSession(userId) {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    insertSession.run(hashToken(sessionToken), userId, Date.now());
    return sessionToken;
  }

  function signup({ username, email, password } = {}) {
    const usernameError = validateUsername(username);
    if (usernameError) return { ok: false, error: usernameError };
    const emailError = validateEmail(email);
    if (emailError) return { ok: false, error: emailError };
    const passwordError = validatePassword(password);
    if (passwordError) return { ok: false, error: passwordError };
    const usernameKey = username.toLowerCase();
    const emailKey = email.trim().toLowerCase();
    if (findUsername.get(usernameKey)) return { ok: false, error: "USERNAME_TAKEN" };
    if (findEmail.get(emailKey)) return { ok: false, error: "EMAIL_TAKEN" };
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 32);
    const id = crypto.randomBytes(16).toString("hex");
    insertUser.run(id, username, usernameKey, emailKey, hash.toString("hex"), salt.toString("hex"), Date.now());
    return { ok: true, user: { id, username }, sessionToken: createSession(id) };
  }

  function login({ username, password } = {}) {
    if (typeof username !== "string" || !username.trim() || validatePassword(password)) {
      passwordMatches("wrong-password", DUMMY_SALT.toString("hex"), DUMMY_HASH.toString("hex"));
      return { ok: false, error: "BAD_LOGIN" };
    }
    const key = username.trim().toLowerCase();
    const row = findLogin.get(key, key);
    if (!row || !passwordMatches(password, row.password_salt, row.password_hash)) {
      return { ok: false, error: "BAD_LOGIN" };
    }
    return { ok: true, user: { id: row.id, username: row.username }, sessionToken: createSession(row.id) };
  }

  function session(token) {
    if (typeof token !== "string" || !token) return null;
    const row = findSession.get(hashToken(token));
    if (!row) return null;
    if (Date.now() - row.created_at > SESSION_MS) {
      deleteSession.run(hashToken(token));
      return null;
    }
    return { id: row.id, username: row.username };
  }

  function logout(token) {
    if (typeof token === "string" && token) deleteSession.run(hashToken(token));
    return { ok: true };
  }

  function close() {
    db.close();
  }

  return { signup, login, logout, session, close };
}

module.exports = { createAccountStore, SESSION_MS };
