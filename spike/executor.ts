import type { Page } from "playwright";
import type { Candidate } from "./observer.js";

export async function execute(page: Page, candidate: Candidate, operation: "CLICK" | "TYPE_TEXT", value?: string) {
  const locator = page.locator("input, button").nth(candidate.id);
  if (operation === "CLICK") return locator.click();
  if (!value) throw new Error("TYPE_TEXT requires a value");
  return locator.fill(value);
}
