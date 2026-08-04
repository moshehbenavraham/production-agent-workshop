export const DEFAULT_RUN_RATE_LIMIT_MAX = 10;
export const DEFAULT_RUN_RATE_LIMIT_WINDOW_MS = 60_000;

const MAX_RUN_RATE_LIMIT = 10_000;
const MAX_RUN_RATE_LIMIT_WINDOW_MS = 3_600_000;

export type RunRateLimitOptions = Readonly<{
  limit: number;
  windowMs: number;
}>;

export type RateLimitDecision = Readonly<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
}>;

type RateLimitEnvironment = Readonly<Record<string, string | undefined>>;

function requireBoundedInteger(value: number, name: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(`${name} must be an integer from 1 through ${maximum}.`);
  }
  return value;
}

function readBoundedInteger(
  environment: RateLimitEnvironment,
  name: string,
  fallback: number,
  maximum: number,
): number {
  const value = environment[name];
  if (value === undefined) return fallback;
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`${name} must be an integer from 1 through ${maximum}.`);
  }
  return requireBoundedInteger(Number(value), name, maximum);
}

export function resolveRunRateLimitOptions(environment: RateLimitEnvironment): RunRateLimitOptions {
  return Object.freeze({
    limit: readBoundedInteger(
      environment,
      "RUN_RATE_LIMIT_MAX",
      DEFAULT_RUN_RATE_LIMIT_MAX,
      MAX_RUN_RATE_LIMIT,
    ),
    windowMs: readBoundedInteger(
      environment,
      "RUN_RATE_LIMIT_WINDOW_MS",
      DEFAULT_RUN_RATE_LIMIT_WINDOW_MS,
      MAX_RUN_RATE_LIMIT_WINDOW_MS,
    ),
  });
}

export class FixedWindowRateLimiter {
  readonly #limit: number;
  readonly #windowMs: number;
  readonly #now: () => number;
  #windowStartedAt: number;
  #used = 0;

  constructor(options: RunRateLimitOptions, now: () => number = Date.now) {
    this.#limit = requireBoundedInteger(options.limit, "rate limit", MAX_RUN_RATE_LIMIT);
    this.#windowMs = requireBoundedInteger(
      options.windowMs,
      "rate limit window",
      MAX_RUN_RATE_LIMIT_WINDOW_MS,
    );
    this.#now = now;
    this.#windowStartedAt = this.readNow();
  }

  consume(): RateLimitDecision {
    const now = this.readNow();
    if (now < this.#windowStartedAt || now - this.#windowStartedAt >= this.#windowMs) {
      this.#windowStartedAt = now;
      this.#used = 0;
    }

    const resetAfterSeconds = Math.max(
      1,
      Math.ceil((this.#windowStartedAt + this.#windowMs - now) / 1_000),
    );
    if (this.#used >= this.#limit) {
      return Object.freeze({
        allowed: false,
        limit: this.#limit,
        remaining: 0,
        resetAfterSeconds,
      });
    }

    this.#used += 1;
    return Object.freeze({
      allowed: true,
      limit: this.#limit,
      remaining: this.#limit - this.#used,
      resetAfterSeconds,
    });
  }

  private readNow(): number {
    const value = this.#now();
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Rate-limit clock must return a non-negative integer timestamp.");
    }
    return value;
  }
}
