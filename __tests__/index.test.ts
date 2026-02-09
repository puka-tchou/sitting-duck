import { describe, expect, jest, test, beforeEach } from "@jest/globals";

jest.mock("fast-glob");
jest.mock("../src/development", () => ({
  development: jest.fn(),
}));
jest.mock("../src/production", () => ({
  production: jest.fn(),
}));

import minify from "../index";
import * as fg from "fast-glob";
import * as developmentModule from "../src/development";
import * as productionModule from "../src/production";

describe("Main minify function (index.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    process.argv = ["node", "minify.mjs"];
  });

  describe("with glob pattern input", () => {
    test("should process glob patterns for JS files", () => {
      const jsPattern = "_test/*.js, !node_modules/";
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      // First call is for JS, second for CSS
      expect(fg.globSync).toHaveBeenCalledTimes(2);
    });

    test("should call development mode when no --prod flag", () => {
      const jsPattern = "_test/*.js";
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      expect(developmentModule.development).toHaveBeenCalled();
    });

    test("should call production mode with --prod flag", () => {
      const jsPattern = "_test/*.js";
      const cssPattern = "_test/*.css";

      process.argv.push("--prod");

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      expect(productionModule.production).toHaveBeenCalled();
    });

    test("should pass sourcemap flag to production mode", () => {
      const jsPattern = "_test/*.js";
      const cssPattern = "_test/*.css";

      process.argv.push("--prod", "--map");

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      expect(productionModule.production).toHaveBeenCalledWith(
        expect.any(Array),
        true,
      );
    });
  });

  describe("with array input", () => {
    test("should process array of files", () => {
      const jsFiles = ["_test/script.js", "_test/module.js"];
      const cssFiles = ["_test/index.css"];

      minify(jsFiles, cssFiles);

      expect(developmentModule.development).toHaveBeenCalled();
    });

    test("should call development mode with array input", () => {
      const jsFiles = ["_test/script.js"];
      const cssFiles = ["_test/index.css"];

      minify(jsFiles, cssFiles);

      expect(developmentModule.development).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining("script.js"),
          expect.stringContaining("index.css"),
        ]),
      );
    });

    test("should call production mode with array and --prod flag", () => {
      const jsFiles = ["_test/script.js"];
      const cssFiles = ["_test/index.css"];

      process.argv.push("--prod");

      minify(jsFiles, cssFiles);

      expect(productionModule.production).toHaveBeenCalled();
    });
  });

  describe("mixed glob and array inputs", () => {
    test("should handle glob JS with array CSS", () => {
      const jsPattern = "_test/*.js";
      const cssFiles = ["_test/index.css"];

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssFiles);

      expect(developmentModule.development).toHaveBeenCalled();
    });

    test("should handle array JS with glob CSS", () => {
      const jsFiles = ["_test/script.js"];
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue(["_test/index.css"]);

      minify(jsFiles, cssPattern);

      expect(developmentModule.development).toHaveBeenCalled();
    });
  });

  describe("empty file lists", () => {
    test("should handle empty glob results", () => {
      const jsPattern = "_test/*.js";
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue([]);

      minify(jsPattern, cssPattern);

      expect(developmentModule.development).toHaveBeenCalledWith([]);
    });

    test("should handle empty array input", () => {
      const jsFiles: string[] = [];
      const cssFiles: string[] = [];

      minify(jsFiles, cssFiles);

      expect(developmentModule.development).toHaveBeenCalledWith([]);
    });
  });

  describe("glob pattern parsing", () => {
    test("should split comma-separated patterns", () => {
      const jsPattern = "_test/*.js, !node_modules/, !**/*.min.js";
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      const callArgs = (fg.globSync as jest.Mock).mock.calls[0][0];
      expect(Array.isArray(callArgs)).toBe(true);
      expect(callArgs.length).toBeGreaterThan(1);
    });

    test("should remove whitespace from patterns", () => {
      const jsPattern = "_test/*.js , !node_modules/ , !**/*.min.js";
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      const callArgs = (fg.globSync as jest.Mock).mock.calls[0][0];
      // Check that patterns don't have leading/trailing spaces
      callArgs.forEach((pattern: string) => {
        expect(pattern).toBe(pattern.trim());
      });
    });
  });

  describe("console output", () => {
    test("should log appropriate messages with glob patterns", () => {
      const jsPattern = "_test/*.js";
      const cssPattern = "_test/*.css";

      (fg.globSync as jest.Mock).mockReturnValue([
        "_test/script.js",
        "_test/module.js",
      ]);

      minify(jsPattern, cssPattern);

      expect(console.log).toHaveBeenCalled();
    });

    test("should log appropriate messages with array input", () => {
      const jsFiles = ["_test/script.js"];
      const cssFiles = ["_test/index.css"];

      minify(jsFiles, cssFiles);

      expect(console.log).toHaveBeenCalled();
    });
  });
});
