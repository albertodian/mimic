import type { Page } from "playwright";
import type { BrowserState, InteractiveElement } from "./types.js";

export async function observe(page: Page): Promise<BrowserState> {
  const candidates: InteractiveElement[] = await page.locator("input, button").evaluateAll((elements) =>
    elements.map((element, id) => {
      const input = element as HTMLInputElement;
      return {
        id,
        role: element.tagName === "BUTTON" ? "button" as const : "textbox" as const,
        name: input.labels?.[0]?.textContent?.trim() || element.getAttribute("aria-label") || element.textContent?.trim() || "unnamed",
        value: input.value || undefined,
        visible: Boolean((element as HTMLElement).offsetParent),
      };
    }),
  );
  return { url: page.url(), visibleText: await page.locator("body").innerText(), candidates };
}
