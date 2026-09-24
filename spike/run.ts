import { chromium } from "playwright";
import { execute } from "./executor.js";
import { LayaBrowserDecider } from "./laya.js";
import { observe } from "./observer.js";
import { startDemoServer } from "./server.js";

const goal = 'Search for Verona and finish when "Results for Verona" appears.';
const value = "Verona";

const server = await startDemoServer();
const browser = await chromium.launch({ headless: process.env.HEADED !== "1" });
const page = await browser.newPage();
const model = await LayaBrowserDecider.start();

try {
  await page.goto(server.url);
  for (let step = 1; step <= 5; step++) {
    const state = await observe(page);
    const decision = await model.decide(goal, state);
    if (decision.operation === "DONE") {
      if (!state.visibleText.includes("Results for Verona")) throw new Error("Laya finished before the requested result appeared");
      console.log(`${step} → DONE\n\nPASS`);
      process.exitCode = 0;
      break;
    }
    if (!decision.candidate) throw new Error("Laya did not choose an element");
    console.log(`${step} → ${decision.operation} ${JSON.stringify(decision.candidate.name)}`);
    await execute(page, decision.candidate, decision.operation, decision.operation === "TYPE_TEXT" ? value : undefined);
    await page.waitForTimeout(100);
  }
  if (process.exitCode !== 0) throw new Error("Maximum steps exceeded");
} finally {
  await model.close();
  await browser.close();
  await server.close();
}
