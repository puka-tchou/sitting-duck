import { describe, expect, jest, test } from "@jest/globals";
import { isCSS, getminpath, isModule } from "../src/utils";

describe("Utils Tests", () => {
  test("isCSS should return true for .css files", () => {
    expect(isCSS("styles.css")).toBe(true);
    expect(isCSS("index.html")).toBe(false);
  });

  test("getminpath should return correct minified path", () => {
    expect(getminpath("index.js")).toBe("index.min.js");
    expect(getminpath("styles.css")).toBe("styles.min.css");
    expect(getminpath("README")).toBe("README");
  });

  test("isModule should resolve true if file contains @MODULE comment", async () => {
    const result = await isModule("./fixtures/module.js");
    expect(result).toBe(true);
  });

  test("isModule should resolve false if file does not contain @MODULE comment", async () => {
    const result = await isModule("./fixtures/non-module.js");
    expect(result).toBe(false);
  });

  test("isModule should reject the promise if it fails to read the file", async () => {
    await expect(isModule("not-a-real-file.js")).rejects;
  });
});
