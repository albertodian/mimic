import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { pathToFileURL } from "node:url";
import { tsImport } from "tsx/esm/api";
import { chromium } from "playwright";
import { runAgent } from "./agent.js";
import type { MimicSuite } from "./index.js";
import { LayaBrowserDecider } from "./model.js";

export interface RunOptions {
  cwd: string;
  headed: boolean;
}

function suiteFrom(exported: unknown): MimicSuite {
  if (Array.isArray(exported) && exported.every((goal) => typeof goal === "string")) return { url: "http://localhost:3000", tests: exported };
  if (typeof exported === "object" && exported && Array.isArray((exported as MimicSuite).tests)) return exported as MimicSuite;
  throw new Error("mimic.e2e.ts must export an array of goals or defineSuite({...})");
}

async function waitFor(url: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`App did not respond at ${url}`);
}

function start(command: string, cwd: string) {
  return spawn(command, { cwd, shell: true, stdio: "inherit" });
}

function stop(process: ChildProcess | undefined) {
  process?.kill("SIGTERM");
}

function interpolate(goal: string, variables: Record<string, string | undefined>) {
  return goal.replace(/{{(\w+)}}/g, (_, name) => {
    const value = variables[name];
    if (value === undefined) throw new Error(`Missing variable: ${name}`);
    return value;
  });
}

export async function run({ cwd, headed }: RunOptions) {
  const configPath = resolve(cwd, "mimic.e2e.ts");
  if (!existsSync(configPath)) throw new Error("Missing mimic.e2e.ts. Run `mimic init` first.");
  const suite = suiteFrom((await tsImport(pathToFileURL(configPath).href, import.meta.url)).default);
  const url = process.env.E2E_URL || suite.devServer?.url || suite.url;
  const server = process.env.E2E_URL ? undefined : suite.devServer ? start(suite.devServer.command, cwd) : undefined;
  const variables = suite.variables || {};
  const values = Object.values(variables).filter((value): value is string => Boolean(value));
  const browser = await chromium.launch({ headless: !headed });
  const model = await LayaBrowserDecider.start();
  let passed = 0;

  try {
    await waitFor(url);
    console.log("Mimic\n");
    for (const template of suite.tests) {
      const goal = interpolate(template, variables);
      const page = await browser.newPage();
      console.log(`▶ ${goal}`);
      try {
        await page.goto(url);
        const steps = await runAgent(model, { page, goal, values });
        for (const step of steps) console.log(`  → ${step.startsWith("TYPE_TEXT") ? `filled ${step.slice("TYPE_TEXT ".length)}` : `clicked ${step.slice("CLICK ".length)}`}`);
        console.log("✓ PASS\n");
        passed++;
      } finally {
        await page.close();
      }
    }
    console.log(`${passed} passed`);
  } finally {
    model.close();
    await browser.close();
    stop(server);
  }
}
