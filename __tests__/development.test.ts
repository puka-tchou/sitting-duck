import { build, development } from "../src/development";
import * as fs from "fs";
import path from "path";

describe("development.ts", () => {
  describe("build", () => {
    it("should build a JavaScript file", async () => {
      const message = await build("./fixtures/module.js");
      expect(message).toBe("Using esbuild to rebuild ./fixtures/module.js");
      expect(fs.existsSync(path.join("./fixtures", "example.min.js"))).toBe(true);
    });

    it("should build a CSS file", async () => {
      const message = await build("./fixtures/example.js");
      expect(message).toBe("Using esbuild to rebuild ./fixtures/example.js");
      expect(fs.existsSync(path.join("./fixtures", "example.min.css"))).toBe(
        true,
      );
    });

    it("should copy a non-module, non-CSS file", async () => {
      const message = await build("fixtures/example.txt");
      expect(message).toBe("successfully copied fixtures/example.txt");
      expect(fs.existsSync(path.join("./fixtures", "example.min.txt"))).toBe(
        true,
      );
    });
  });

  describe("development", () => {
    // Skipping this test as it involves watching file changes
    it.skip("should watch files and rebuild them", () => {
      development(["./fixtures/module.js", "./fixtures/example.js"]);
    });
  });
});
