import { createServer } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import type { BrowserState, Decision, DecisionModel, InteractiveElement, Operation } from "./types.js";

type LayaAnswer = { answers: Record<string, { choice: string }> };

async function freePort() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a Laya port");
  const { port } = address;
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitFor(url: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${url}/healthz`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local Laya server did not start");
}

function completionText(goal: string) {
  return goal.match(/finish when\s+"([^"]+)"\s+appears/i)?.[1];
}

export class LayaBrowserDecider implements DecisionModel {
  #server: ChildProcess;
  #url: string;

  private constructor(server: ChildProcess, url: string) {
    this.#server = server;
    this.#url = url;
  }

  static async start() {
    const port = await freePort();
    const server = spawn(process.env.LAYA_SERVER_COMMAND || "localdecide", ["serve", "--port", String(port)], { stdio: "ignore" });
    const url = `http://127.0.0.1:${port}`;
    await waitFor(url);
    return new LayaBrowserDecider(server, url);
  }

  async decide(goal: string, state: BrowserState): Promise<Decision> {
    const input = state.candidates.find((candidate) => candidate.role === "textbox" && !candidate.value);
    const button = state.candidates.find((candidate) => candidate.role === "button");
    const done = Boolean(completionText(goal) && state.visibleText.includes(completionText(goal)!));
    const operation: "TYPE_TEXT" | "CLICK" | "DONE" = done ? "DONE" : input ? "TYPE_TEXT" : "CLICK";
    const candidate = operation === "TYPE_TEXT" ? input : operation === "CLICK" ? button : undefined;
    if (!candidate && operation !== "DONE") throw new Error("No valid next action");

    const answer = await this.#decide(goal, state, operation, candidate);
    if (answer.operation !== operation || answer.element !== candidate?.id) throw new Error("Laya chose an unavailable action");
    return answer;
  }

  async #decide(goal: string, state: BrowserState, operation: "TYPE_TEXT" | "CLICK" | "DONE", candidate?: InteractiveElement): Promise<Decision> {
    const response = await fetch(`${this.#url}/v1/decide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        state: { url: state.url, text: state.visibleText, history: [] },
        questions: {
          operation: { type: "choice", criteria: {
            [operation]: operation === "TYPE_TEXT" ? "Enter text in the empty field required to advance the goal." : operation === "CLICK" ? "Click the ready button that advances the goal." : "Every requirement in the goal is visibly satisfied.",
            WAIT: "The needed control is absent, disabled, or loading.",
            BLOCKED: "No supported operation can make progress.",
          }, instructions: { goal, rules: "Advance the goal from the current page using one operation." } },
          ...(candidate ? { [`${operation.toLowerCase()}_target`]: { type: "choice", criteria: { [candidate.id]: `[${candidate.id}] ${candidate.name} (${candidate.role})${candidate.value ? ` = ${candidate.value}` : ""}` }, instructions: { goal, operation, rules: "Choose the observed element that performs this operation." } } } : {}),
        },
      }),
    });
    if (!response.ok) throw new Error(`Local Laya rejected the decision: ${await response.text()}`);
    const answer = await response.json() as LayaAnswer;
    const selected = answer.answers.operation.choice as Operation;
    return { operation: selected, element: candidate ? Number(answer.answers[`${operation.toLowerCase()}_target`]?.choice) : undefined };
  }

  close() { this.#server.kill(); }
}
