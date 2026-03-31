import { describe, expect, it } from "bun:test";
import {
  memoizeRequestPromise,
  runWithRequestContext,
} from "@/lib/server/request-context";

describe("request context caching", () => {
  it("deduplicates async work within a single request context", async () => {
    let calls = 0;

    const result = await runWithRequestContext("test:request-context", async () => {
      const [first, second] = await Promise.all([
        memoizeRequestPromise("expensive-read", async () => {
          calls += 1;
          return "cached-value";
        }),
        memoizeRequestPromise("expensive-read", async () => {
          calls += 1;
          return "cached-value";
        }),
      ]);

      return [first, second];
    });

    expect(result).toEqual(["cached-value", "cached-value"]);
    expect(calls).toBe(1);
  });

  it("does not reuse cached work across different request contexts", async () => {
    let calls = 0;

    await runWithRequestContext("test:request-one", async () =>
      memoizeRequestPromise("expensive-read", async () => {
        calls += 1;
        return "first";
      })
    );

    await runWithRequestContext("test:request-two", async () =>
      memoizeRequestPromise("expensive-read", async () => {
        calls += 1;
        return "second";
      })
    );

    expect(calls).toBe(2);
  });
});
