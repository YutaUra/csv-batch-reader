export const promiseWithResolvers = <T = void>() => {
  // new Promise のコンストラクタ自体は非同期処理を行わないため、
  // resolve, reject への代入は promise の生成が終わったタイミングで完了している
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
};
