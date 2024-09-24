import { exec } from "node:child_process";
import { defineConfig } from "tsup";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ["cjs", "esm"],
  target: "node18",
  async onSuccess() {
    await execAsync("tsc");
  },
});
