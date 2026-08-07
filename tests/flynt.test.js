// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

const flyntCode = fs.readFileSync(
  path.resolve(__dirname, "../src/flynt.js"),
  "utf-8",
);

describe("Flynt.js Core", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create reactive state and update DOM on render", async () => {
    window.eval(flyntCode);
    document.body.innerHTML = `
      <div>
        <span data-fx="counterPresenter.output">0</span>
      </div>
    `;

    window.counterPresenter = window.fx.presenter(({ createState, render }) => {
      const state = createState({ count: 1 });
      return {
        output(el) {
          el.onclick = (e) => {
            state.count++;
          };
          render(() => {
            el.textContent = state.count;
          });
        },
      };
    });
    window.fx.scan();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const span = document.querySelector('[data-fx="counterPresenter.output"]');
    expect(span.textContent).toBe("1");

    span.dispatchEvent(new Event("click"));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(span.textContent).toBe("2");
  });
});
