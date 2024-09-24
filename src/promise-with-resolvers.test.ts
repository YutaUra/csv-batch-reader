import { setTimeout } from "node:timers/promises";
import { promiseWithResolvers } from "./promise-with-resolvers.js";

describe("promiseWithResolvers", () => {
  it("promiseWithResolvers returns promise, resolve, reject", () => {
    // given
    // when
    const returns = promiseWithResolvers();
    // then
    expect(returns).toHaveProperty("promise");
    expect(returns).toHaveProperty("resolve");
    expect(returns).toHaveProperty("reject");
  });

  it("resolve should resolve promise", async () => {
    // given
    const { promise, resolve } = promiseWithResolvers<string>();
    // when
    resolve("resolved");
    // then
    await expect(promise).resolves.toBe("resolved");
  });

  it("when not resolved, promise should be pending", async () => {
    // given
    const { promise } = promiseWithResolvers();
    // when
    const res = await Promise.race([
      promise.then(() => "resolved"),
      setTimeout(3000).then(() => "pending"),
    ]);
    // then
    // ３秒までしか待っていないけど、ずっと待ち続けることはできないので妥協
    expect(res).toBe("pending");
  });

  it("reject should reject promise", async () => {
    // given
    const { promise, reject } = promiseWithResolvers();
    // when
    reject("rejected");
    // then
    await expect(promise).rejects.toBe("rejected");
  });
});
