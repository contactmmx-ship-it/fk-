import { test, after } from "node:test";
import { strictEqual } from "node:assert";
import { getJwtSecret } from "./jwt-secret.js";

const originalSecret = process.env.JWT_SECRET;

after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

test("rejects a missing JWT secret", () => {
  delete process.env.JWT_SECRET;
  strictEqual(getJwtSecret(), null);
});

test("rejects a weak JWT secret", () => {
  process.env.JWT_SECRET = "short-secret";
  strictEqual(getJwtSecret(), null);
});

test("accepts a sufficiently long configured JWT secret", () => {
  const configuredSecret = "s".repeat(32);
  process.env.JWT_SECRET = configuredSecret;
  strictEqual(getJwtSecret(), configuredSecret);
});

test("trims whitespace from the configured JWT secret", () => {
  const configuredSecret = "s".repeat(32);
  process.env.JWT_SECRET = `  ${configuredSecret}  `;
  strictEqual(getJwtSecret(), configuredSecret);
});
