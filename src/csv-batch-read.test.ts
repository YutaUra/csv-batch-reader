import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { csvBatchRead } from "./csv-batch-read.js";

const TEST_CSV_FILE = join(await mkdtemp("test-csv-file"), "test.csv");

beforeAll(async () => {
  await mkdir(dirname(TEST_CSV_FILE), { recursive: true });
});

afterAll(async () => {
  await rm(dirname(TEST_CSV_FILE), { recursive: true });
});

beforeEach(async () => {
  await writeFile(
    TEST_CSV_FILE,
    `\
a,b,c
100,101,102
200,201,202
300,301,302
400,401,402
500,501,502
600,601,602
700,701,702
800,801,802
900,901,902
`,
    { encoding: "utf-8", flag: "w" },
  );
});

describe("csvBatchRead", () => {
  it("should read headers", async () => {
    // given
    let headers: string[] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      100,
      (h) => {
        headers = h;
      },
      () => {},
    );
    // then
    expect(headers).toStrictEqual(["a", "b", "c"]);
  });

  it("should read rows", async () => {
    // given
    const rows: Record<string, string>[][] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      3,
      () => {},
      (r) => {
        rows.push(r);
      },
    );
    // then
    expect(rows).toStrictEqual([
      [
        { a: "100", b: "101", c: "102" },
        { a: "200", b: "201", c: "202" },
        { a: "300", b: "301", c: "302" },
      ],
      [
        { a: "400", b: "401", c: "402" },
        { a: "500", b: "501", c: "502" },
        { a: "600", b: "601", c: "602" },
      ],
      [
        { a: "700", b: "701", c: "702" },
        { a: "800", b: "801", c: "802" },
        { a: "900", b: "901", c: "902" },
      ],
    ]);
  });

  it("when batchSize is 1, should read rows one by one", async () => {
    // given
    const rows: Record<string, string>[][] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      1,
      () => {},
      (r) => {
        rows.push(r);
      },
    );
    // then
    expect(rows).toStrictEqual([
      [{ a: "100", b: "101", c: "102" }],
      [{ a: "200", b: "201", c: "202" }],
      [{ a: "300", b: "301", c: "302" }],
      [{ a: "400", b: "401", c: "402" }],
      [{ a: "500", b: "501", c: "502" }],
      [{ a: "600", b: "601", c: "602" }],
      [{ a: "700", b: "701", c: "702" }],
      [{ a: "800", b: "801", c: "802" }],
      [{ a: "900", b: "901", c: "902" }],
    ]);
  });

  it("when batchSize is csv row count, should read rows in one batch", async () => {
    // given
    const rows: Record<string, string>[][] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      9,
      () => {},
      (r) => {
        rows.push(r);
      },
    );
    // then
    expect(rows).toStrictEqual([
      [
        { a: "100", b: "101", c: "102" },
        { a: "200", b: "201", c: "202" },
        { a: "300", b: "301", c: "302" },
        { a: "400", b: "401", c: "402" },
        { a: "500", b: "501", c: "502" },
        { a: "600", b: "601", c: "602" },
        { a: "700", b: "701", c: "702" },
        { a: "800", b: "801", c: "802" },
        { a: "900", b: "901", c: "902" },
      ],
    ]);
  });

  it("when batchSize is larger than csv row count, should read rows in one batch", async () => {
    // given
    const rows: Record<string, string>[][] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      1000,
      () => {},
      (r) => {
        rows.push(r);
      },
    );
    // then
    expect(rows).toStrictEqual([
      [
        { a: "100", b: "101", c: "102" },
        { a: "200", b: "201", c: "202" },
        { a: "300", b: "301", c: "302" },
        { a: "400", b: "401", c: "402" },
        { a: "500", b: "501", c: "502" },
        { a: "600", b: "601", c: "602" },
        { a: "700", b: "701", c: "702" },
        { a: "800", b: "801", c: "802" },
        { a: "900", b: "901", c: "902" },
      ],
    ]);
  });

  it("rows handler should be called after header handler", async () => {
    // given
    let headerResolvedAt = 0;
    const rowsResolvedAt: number[] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      3,
      async () => {
        await setTimeout(500);
        headerResolvedAt = performance.now();
      },
      () => {
        rowsResolvedAt.push(performance.now());
      },
    );
    // then
    for (const rowResolvedAt of rowsResolvedAt) {
      expect(rowResolvedAt).toBeGreaterThan(headerResolvedAt);
    }
  });

  it("csvBatchRead should done after all rows handler resolved", async () => {
    // given
    const rowsResolvedAt: number[] = [];
    // when
    await csvBatchRead(
      TEST_CSV_FILE,
      3,
      () => {},
      async () => {
        await setTimeout(500);
        rowsResolvedAt.push(performance.now());
      },
    );
    const csvBatchReadResolvedAt = performance.now();
    // then
    for (const rowResolvedAt of rowsResolvedAt) {
      expect(rowResolvedAt).toBeLessThan(csvBatchReadResolvedAt);
    }
  });
});
