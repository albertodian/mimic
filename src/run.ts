import { chromium } from "playwright";
import { runAgent } from "./agent.js";
import type { MimicSuite } from "./index.js";
import { LayaBrowserDecider } from "./model.js";
import { startDemoServer } from "../spike/server.js";

const exported = (await import(new URL("../mimic.e2e.ts", import.meta.url).href)).default as string[] | MimicSuite;
const suite: MimicSuite = Array.isArray(exported) ? { url: "http://localhost:3000", tests: exported } : exported;
if (!Array.isArray(suite.tests) || !suite.tests.every((goal) => typeof goal === "string")) throw new Error("mimic.e2e.ts must export goals");
const interpolate = (goal: string) => goal.replace(/{{(\w+)}}/g, (_, name) => {
  const value = suite.variables?.[name];
  if (value === undefined) throw new Error(`Missing variable: ${name}`);
  return value;
});
const searchValue = (goal: string) => goal.match(/^search for\s+(.+?)\s+and\s+finish/i)?.[1];

const server = await startDemoServer();
const browser = await chromium.launch();
const model = await LayaBrowserDecider.start();
let passed = 0;

try {
  console.log("Mimic\n");
  for (const template of suite.tests) {
    const goal = interpolate(template);
    const page = await browser.newPage();
    console.log(`▶ ${goal}`);
    try {
      await page.goto(server.url);
      await runAgent(model, { page, goal, value: searchValue(goal) });
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
  await server.close();
}
