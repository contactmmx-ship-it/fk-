import test from "node:test";
import assert from "node:assert/strict";
import { getJwtSecret } from "./jwt-secret.js";

const originalSecret = process.env.JWT_SECRET;

test.after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

test("rejects a missing JWT secret", () => {
  delete process.env.JWT_SECRET;
  assert.equal(getJwtSecret(), null);
});

test("rejects a weak JWT secret", () => {
  process.env.JWT_SECRET = "short-secret";
  assert.equal(getJwtSecret(), null);
});

test("accepts a sufficiently long configured JWT secret", () => {
  const configuredSecret = "s".repeat(32);
  process.env.JWT_SECRET = configuredSecret;
  assert.equal(getJwtSecret(), configuredSecret);
});

test("trims whitespace from the configured JWT secret", () => {
  const configuredSecret = "s".repeat(32);
  process.env.JWT_SECRET = `  ${configuredSecret}  `;
  assert.equal(getJwtSecret(), configuredSecret);
});
