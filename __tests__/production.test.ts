import {
  production,
  bundleWithSwc,
  bundleWithEsbuild,
} from "../src/production";
import * as fs from "fs";
import path from "path";

describe("production.ts", () => {
  describe("bundleWithSwc", () => {
    it("should bundle and minify a JavaScript file using SWC", (done) => {
      bundleWithSwc("./fixtures/non-module.js", false, "./fixtures/non-module.min.js", 1);
      setTimeout(() => {
        expect(fs.existsSync(path.join("./fixtures", "non-module.min.js"))).toBe(
          true,
        );
        done();
      }, 1000);
    });
  });

  describe("bundleWithEsbuild", () => {
    it("should bundle and minify a JavaScript file using Esbuild", (done) => {
      bundleWithEsbuild(
        "./fixtures/module.js",
        false,
        "./fixtures/module.min.js",
        1,
      );
      setTimeout(() => {
        expect(fs.existsSync(path.join("./fixtures", "module.min.js"))).toBe(
          true,
        );
        done();
      }, 1000);
    });
  });

  describe("production", () => {
    it("should bundle and minify JavaScript and CSS files", () => {
      production(["./fixtures/module.js", "./fixtures/example.css"], false);
      expect(fs.existsSync(path.join("./fixtures", "module.min.js"))).toBe(true);
      expect(fs.existsSync(path.join("./fixtures", "example.min.css"))).toBe(
        true,
      );
    });
  });
});
