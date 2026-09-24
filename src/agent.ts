import { execute } from "./executor.js";
import { observe } from "./observer.js";
import type { AgentOptions, DecisionModel } from "./types.js";

export async function runAgent(model: DecisionModel, { page, goal, value, maxSteps = 30 }: AgentOptions) {
  const steps: string[] = [];
  for (let step = 0; step < maxSteps; step++) {
    const state = await observe(page);
    const decision = await model.decide(goal, state);
    if (decision.operation === "DONE") return steps;
    if (decision.operation === "FAIL") throw new Error("Laya reported failure");
    const element = state.candidates.find((candidate) => candidate.id === decision.element);
    if (!element || !["CLICK", "TYPE_TEXT"].includes(decision.operation)) throw new Error("Laya chose an invalid action");
    await execute(page, element, decision.operation, value);
    steps.push(`${decision.operation} ${JSON.stringify(element.name)}`);
    await page.waitForTimeout(100);
  }
  throw new Error("Maximum steps exceeded");
}
