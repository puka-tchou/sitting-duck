import { isCSS, getminpath, isModule } from "../src/utils";

describe("utils.ts", () => {
  describe("isCSS", () => {
    it("should return true for a CSS file", () => {
      expect(isCSS("example.css")).toBe(true);
    });

    it("should return false for a non-CSS file", () => {
      expect(isCSS("example.js")).toBe(false);
    });
  });

  describe("getminpath", () => {
    it("should add .min to the file path", () => {
      expect(getminpath("example.js")).toBe("example.min.js");
    });

    it("should not add .min to a file without an extension", () => {
      expect(getminpath("example")).toBe("example");
    });
  });

  describe("isModule", () => {
    it("should return true for a module file", async () => {
      expect(await isModule("./fixtures/module.js")).toBe(true);
    });

    it("should return false for a non-module file", async () => {
      expect(await isModule("./fixtures/non-module.js")).toBe(false);
    });
  });
});
