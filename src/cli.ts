#!/usr/bin/env node
import { resolve } from "node:path";
import { init } from "./init.js";
import { doctor } from "./doctor.js";
import { run } from "./run.js";

const [command, ...flags] = process.argv.slice(2);
const cwd = process.cwd();

try {
  if (command === "init") await init(cwd);
  else if (command === "doctor") await doctor();
  else if (command === "run") await run({ cwd, headed: flags.includes("--headed") || flags.includes("--debug") });
  else throw new Error("Usage: mimic <init|run|doctor> [--headed|--debug]");
} catch (error) {
  console.error(`Mimic failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
