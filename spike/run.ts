import { chromium } from "playwright";
import { runAgent } from "../src/agent.js";
import { LayaBrowserDecider } from "../src/model.js";
import { startDemoServer } from "./server.js";

const goal = 'Search for Verona and finish when "Results for Verona" appears.';
const value = "Verona";

const server = await startDemoServer();
const browser = await chromium.launch({ headless: process.env.HEADED !== "1" });
const page = await browser.newPage();
const model = await LayaBrowserDecider.start();

try {
  await page.goto(server.url);
  const steps = await runAgent(model, { page, goal, values: [value], maxSteps: 5 });
  for (const [index, step] of steps.entries()) console.log(`${index + 1} → ${step}`);
  console.log(`${steps.length + 1} → DONE\n\nPASS`);
} finally {
  await model.close();
  await browser.close();
  await server.close();
}
