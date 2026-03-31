import { describe, expect, it } from "bun:test";
import {
  cacheServerRead,
  invalidateServerReadCache,
} from "@/lib/server/read-cache";

describe("server read cache", () => {
  it("returns cached values until the prefix is invalidated", async () => {
    let calls = 0;

    const first = await cacheServerRead("company-overview:abc:owner", 60_000, async () => {
      calls += 1;
      return { version: 1 };
    });
    const second = await cacheServerRead("company-overview:abc:owner", 60_000, async () => {
      calls += 1;
      return { version: 2 };
    });

    invalidateServerReadCache("company-overview:abc");

    const third = await cacheServerRead("company-overview:abc:owner", 60_000, async () => {
      calls += 1;
      return { version: 3 };
    });

    expect(first).toEqual({ version: 1 });
    expect(second).toEqual({ version: 1 });
    expect(third).toEqual({ version: 3 });
    expect(calls).toBe(2);
  });
});
