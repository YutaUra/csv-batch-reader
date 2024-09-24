import { createReadStream } from "node:fs";
import Papa from "papaparse";
import { promiseWithResolvers } from "./promise-with-resolvers.js";

export const csvBatchRead = async <
  T extends Record<string, string> = Record<string, string>,
>(
  filePath: string,
  batchSize: number,
  handleHeader: (header: (keyof T)[]) => unknown,
  handleBatch: (rows: T[], batchCount: number, isLastChunk: boolean, header: (keyof T)[]) => unknown,
) => {
  return await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath).pipe(
      Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }),
    );

    let buf: T[] = [];
    let batchCount = 0;
    let isFirstChunk = true;
    const { promise: headerPromise, resolve: resolveHeaders } =
      promiseWithResolvers<(keyof T)[]>();
    const headerResolved = headerPromise.then(async (headers) =>
      {
        await handleHeader(headers)
        return headers
      },
    );
    const shouldResolve: unknown[] = [headerResolved];

    stream.on("data", (chunk: T) => {
      if (isFirstChunk) {
        resolveHeaders(Object.keys(chunk));
        isFirstChunk = false;
      }
      if (buf.length === batchSize) {
        const currentBatchCount = batchCount;
        const currentBuf = buf.slice();
        shouldResolve.push(
          headerResolved.then((headers) =>
            handleBatch(currentBuf, currentBatchCount, false, headers),
          ),
        );
        buf = [];
        batchCount++;
      }
      buf.push(chunk);
    });

    stream.on("end", () => {
      const currentBatchCount = batchCount;
      const currentBuf = buf.slice();
      shouldResolve.push(
        headerResolved.then((headers) =>
          handleBatch(currentBuf, currentBatchCount, true, headers),
        ),
      );

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
