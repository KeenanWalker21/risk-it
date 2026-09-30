"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { questions } = require("./questions");

const CATEGORIES = [
  "General Knowledge",
  "Science",
  "History",
  "Sports",
  "Technology",
  "Entertainment",
  "Geography",
];

test("question bank has at least 50 playable questions", () => {
  assert.ok(Array.isArray(questions));
  assert.ok(questions.length >= 50);
});

test("every question has a unique id, four answers, and a valid key", () => {
  const ids = new Set();
  const prompts = new Set();
  for (const question of questions) {
    assert.equal(typeof question.id, "string");
    assert.ok(question.id.trim(), "question id is required");
    assert.equal(ids.has(question.id), false, `duplicate id ${question.id}`);
    ids.add(question.id);

    assert.equal(typeof question.question, "string");
    const prompt = question.question.trim();
    assert.ok(prompt.length > 8, `${question.id} prompt is too short`);
    assert.equal(prompts.has(prompt), false, `duplicate prompt ${question.id}`);
    prompts.add(prompt);

    assert.ok(Array.isArray(question.answers));
    assert.equal(question.answers.length, 4, question.id);
    for (const answer of question.answers) {
      assert.equal(typeof answer, "string");
      assert.ok(answer.trim(), `${question.id} has an empty answer`);
    }
    assert.equal(new Set(question.answers).size, 4, `${question.id} repeats an answer`);

    assert.equal(Number.isInteger(question.correctAnswer), true, question.id);
    assert.ok(question.correctAnswer >= 0 && question.correctAnswer <= 3, question.id);
    assert.ok(CATEGORIES.includes(question.category), `${question.id} category ${question.category}`);
    assert.equal(typeof question.difficulty, "string");
    assert.ok(question.difficulty.trim(), question.id);
  }
});

test("question bank covers every MVP category", () => {
  const present = new Set(questions.map((question) => question.category));
  for (const category of CATEGORIES) {
    assert.equal(present.has(category), true, category);
  }
});
