task: Review integrated app, include all test suites, and fix room switching, connected-player start validation, and live score reporting
files: package.json, server.js, public/client.js, test/review.test.js
completed: 2026-09-29
status: complete
notes: npm test now includes all five test files. Switching a live socket to a different room releases its previous session; starts require two connected players and lobby UI reflects offline seats. Live score now counts correct answers. Invalid percent-encoded HTTP paths return 400 instead of throwing. All 24 tests and JavaScript syntax checks pass.
