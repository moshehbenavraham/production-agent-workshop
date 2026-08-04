import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_RUN_RATE_LIMIT_MAX,
  DEFAULT_RUN_RATE_LIMIT_WINDOW_MS,
  FixedWindowRateLimiter,
  resolveRunRateLimitOptions,
} from "../src/rate-limit.js";

test("rate-limit environment resolves frozen bounded defaults", () => {
  const options = resolveRunRateLimitOptions({});

  assert.deepEqual(options, {
    limit: DEFAULT_RUN_RATE_LIMIT_MAX,
    windowMs: DEFAULT_RUN_RATE_LIMIT_WINDOW_MS,
  });
  assert.equal(Object.isFrozen(options), true);
});

test("rate-limit environment accepts explicit bounded integers", () => {
  assert.deepEqual(
    resolveRunRateLimitOptions({
      RUN_RATE_LIMIT_MAX: "25",
      RUN_RATE_LIMIT_WINDOW_MS: "30000",
    }),
    { limit: 25, windowMs: 30_000 },
  );
});

test("malformed and out-of-range environment values fail before startup", () => {
  for (const value of ["", "0", "-1", "1.5", " 2", "10001"]) {
    assert.throws(
      () => resolveRunRateLimitOptions({ RUN_RATE_LIMIT_MAX: value }),
      /RUN_RATE_LIMIT_MAX must be an integer from 1 through 10000/,
    );
  }
  assert.throws(
    () => resolveRunRateLimitOptions({ RUN_RATE_LIMIT_WINDOW_MS: "3600001" }),
    /RUN_RATE_LIMIT_WINDOW_MS must be an integer from 1 through 3600000/,
  );
});

test("fixed window permits the configured count then returns a frozen denial", () => {
  const limiter = new FixedWindowRateLimiter({ limit: 2, windowMs: 60_000 }, () => 1_000);

  assert.deepEqual(limiter.consume(), {
    allowed: true,
    limit: 2,
    remaining: 1,
    resetAfterSeconds: 60,
  });
  assert.deepEqual(limiter.consume(), {
    allowed: true,
    limit: 2,
    remaining: 0,
    resetAfterSeconds: 60,
  });
  const denied = limiter.consume();
  assert.deepEqual(denied, {
    allowed: false,
    limit: 2,
    remaining: 0,
    resetAfterSeconds: 60,
  });
  assert.equal(Object.isFrozen(denied), true);
});

test("fixed window resets at its exact boundary", () => {
  let now = 5_000;
  const limiter = new FixedWindowRateLimiter({ limit: 1, windowMs: 2_000 }, () => now);

  assert.equal(limiter.consume().allowed, true);
  now = 6_999;
  assert.deepEqual(limiter.consume(), {
    allowed: false,
    limit: 1,
    remaining: 0,
    resetAfterSeconds: 1,
  });
  now = 7_000;
  assert.deepEqual(limiter.consume(), {
    allowed: true,
    limit: 1,
    remaining: 0,
    resetAfterSeconds: 2,
  });
});

test("backward clock movement starts a fresh bounded window", () => {
  let now = 5_000;
  const limiter = new FixedWindowRateLimiter({ limit: 1, windowMs: 2_000 }, () => now);
  assert.equal(limiter.consume().allowed, true);

  now = 4_999;
  assert.equal(limiter.consume().allowed, true);
  assert.equal(limiter.consume().allowed, false);
});

test("invalid constructor options and clock output fail closed", () => {
  assert.throws(
    () => new FixedWindowRateLimiter({ limit: 0, windowMs: 1_000 }),
    /rate limit must be an integer/,
  );
  assert.throws(
    () => new FixedWindowRateLimiter({ limit: 1, windowMs: 0 }),
    /rate limit window must be an integer/,
  );
  assert.throws(
    () => new FixedWindowRateLimiter({ limit: 1, windowMs: 1_000 }, () => Number.NaN),
    /Rate-limit clock must return a non-negative integer timestamp/,
  );
});
