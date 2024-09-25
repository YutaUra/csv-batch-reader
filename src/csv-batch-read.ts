import { createReadStream } from "node:fs";
import { PassThrough } from "node:stream";
import { finished } from "node:stream/promises";
import Papa from "papaparse";
import { promiseWithResolvers } from "./promise-with-resolvers.js";

export const csvBatchRead = async <
  T extends Record<string, string> = Record<string, string>,
>(
  filePath: string,
  batchSize: number,
  handleHeader: (header: (keyof T)[]) => unknown,
  handleBatch: (
    rows: PassThrough,
    batchCount: number,
    isLastChunk: boolean,
    header: (keyof T)[],
  ) => unknown,
) => {
  return await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath).pipe(
      Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }),
    );

    let currentStream = new PassThrough({ objectMode: true });
    let currentStreamCount = 0;
    let batchCount = 0;
    let isFirstChunk = true;
    const { promise: headerPromise, resolve: resolveHeaders } =
      promiseWithResolvers<(keyof T)[]>();
    const headerResolved = headerPromise.then(async (headers) => {
      await handleHeader(headers);
      return headers;
    });
    const shouldResolve: unknown[] = [headerResolved];

    stream.on("data", (chunk: T) => {
      if (isFirstChunk) {
        resolveHeaders(Object.keys(chunk));
        isFirstChunk = false;
      }
      if (currentStreamCount === batchSize) {
        shouldResolve.push(finished(currentStream.end()));
        currentStream = new PassThrough({ objectMode: true });
        currentStreamCount = 0;
        batchCount++;
      }
      if (currentStreamCount === 0) {
        const stream = currentStream;
        const currentBatchCount = batchCount;
        shouldResolve.push(
          headerResolved.then((headers) =>
            handleBatch(stream, currentBatchCount, false, headers),
          ),
        );
      }
      currentStream.push(chunk);
      currentStreamCount++;
    });

    stream.on("end", () => {
      console.log("stream end");
      currentStream.end();

      Promise.all(shouldResolve)
        .then(() => {
          stream.destroy();
          resolve();
        })
        .catch((error) => {
          stream.destroy();
          reject(error);
        });
    });

    stream.on("error", (error) => {
      console.error("error", error);
      stream.destroy();
      reject(error);
    });
  });
};
