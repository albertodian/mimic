import type { Page } from "playwright";
import type { InteractiveElement, Operation } from "./types.js";

export async function execute(page: Page, element: InteractiveElement, operation: Operation, value?: string) {
  const locator = page.locator("input, button").nth(element.id);
  if (operation === "CLICK") return locator.click();
  if (operation === "TYPE_TEXT" && value) return locator.fill(value);
  throw new Error(`${operation} cannot run without a valid element and value`);
}
