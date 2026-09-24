import type { Page } from "playwright";

export type Operation = "CLICK" | "TYPE_TEXT" | "SELECT" | "WAIT" | "BACK" | "DONE" | "FAIL";

export interface InteractiveElement {
  id: number;
  role: "textbox" | "button";
  name: string;
  value?: string;
  visible: boolean;
}

export interface BrowserState {
  url: string;
  visibleText: string;
  candidates: InteractiveElement[];
}

export interface Decision {
  operation: Operation;
  element?: number;
}

export interface DecisionModel {
  decide(goal: string, state: BrowserState): Promise<Decision>;
  close(): void;
}

export interface AgentOptions {
  page: Page;
  goal: string;
  values?: string[];
  maxSteps?: number;
}
