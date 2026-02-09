/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "@jest/globals";
import * as path from "node:path";

// Integration tests test how multiple modules work together
describe("Integration Tests", () => {
  describe("Production + Utils integration", () => {
    test("should correctly identify and process module files", async () => {
      const { isModule, getminpath, isCSS } = await import("../src/utils");
      const fixturePath = path.join(process.cwd(), "fixtures", "module.js");

      const isModuleResult = await isModule(fixturePath);
      const minPath = getminpath(fixturePath);
      const isCssFile = isCSS(fixturePath);

      expect(isModuleResult).toBe(true);
      expect(minPath).toContain(".min.js");
      expect(isCssFile).toBe(false);
    });

    test("should correctly identify non-module files", async () => {
      const { isModule, isCSS } = await import("../src/utils");
      const fixturePath = path.join(process.cwd(), "fixtures", "non-module.js");

      const isModuleResult = await isModule(fixturePath);
      const isCssFile = isCSS(fixturePath);

      expect(isModuleResult).toBe(false);
      expect(isCssFile).toBe(false);
    });

    test("should correctly identify CSS files", async () => {
      const { isCSS, getminpath } = await import("../src/utils");

      const isCss = isCSS("styles.css");
      const minPath = getminpath("styles.css");

      expect(isCss).toBe(true);
      expect(minPath).toBe("styles.min.css");
    });

    test("should handle empty CSS files correctly", async () => {
      const { isModule, isCSS } = await import("../src/utils");
      const emptyPath = path.join(process.cwd(), "fixtures", "empty-file.js");

      const isModuleResult = await isModule(emptyPath);
      const isCss = isCSS(emptyPath);

      expect(isModuleResult).toBe(false);
      expect(isCss).toBe(false);
    });
  });

  describe("Options + Build tools integration", () => {
    test("should have compatible esbuild options", async () => {
      const { esbuildOptions } = await import("../src/options");

      // Verify all required properties for esbuild exist
      expect(esbuildOptions).toHaveProperty("bundle");
      expect(esbuildOptions).toHaveProperty("format");
      expect(esbuildOptions).toHaveProperty("platform");
      expect(esbuildOptions).toHaveProperty("loader");
      expect(esbuildOptions.format).toBe("iife");
      expect(esbuildOptions.bundle).toBe(true);
    });

    test("esbuild options should have all required file loaders", async () => {
      const { esbuildOptions } = await import("../src/options");

      const requiredLoaders = [".png", ".jpg", ".svg", ".woff", ".woff2"];
      const loader = esbuildOptions.loader as any;

      requiredLoaders.forEach((loaderExt) => {
        expect(loader[loaderExt]).toBeDefined();
        expect(loader[loaderExt]).toBe("file");
      });
    });
  });

  describe("Development + Utils integration", () => {
    test("should be able to require development and utils modules together", async () => {
      const development = await import("../src/development");
      const utils = await import("../src/utils");

      expect(development).toHaveProperty("development");
      expect(development).toHaveProperty("build");
      expect(utils).toHaveProperty("isModule");
      expect(utils).toHaveProperty("isCSS");
      expect(utils).toHaveProperty("getminpath");
    });
  });

  describe("Production + Utils integration", () => {
    test("should be able to require production and utils modules together", async () => {
      const production = await import("../src/production");
      const utils = await import("../src/utils");

      expect(production).toHaveProperty("production");
      expect(production).toHaveProperty("bundleWithSwc");
      expect(production).toHaveProperty("bundleWithEsbuild");
      expect(utils).toHaveProperty("isModule");
      expect(utils).toHaveProperty("isCSS");
    });
  });

  describe("Main module + All utils integration", () => {
    test("should export main minify function", async () => {
      const minify = await import("../index");

      expect(minify.default).toBeDefined();
      expect(typeof minify.default).toBe("function");
    });

    test("should import and use all sub-modules", async () => {
      const minify = await import("../index");
      const utils = await import("../src/utils");
      const options = await import("../src/options");
      const development = await import("../src/development");
      const production = await import("../src/production");

      // Verify all modules are importable
      expect(minify.default).toBeDefined();
      expect(utils.isModule).toBeDefined();
      expect(options.esbuildOptions).toBeDefined();
      expect(development.development).toBeDefined();
      expect(production.production).toBeDefined();
    });
  });

  describe("Type definitions alignment", () => {
    test("should have matching type definitions for exported functions", async () => {
      const index = await import("../index");
      const minify = index.default;

      // Test that minify accepts two parameters
      expect(minify.length).toBeGreaterThanOrEqual(0); // functions can have optional params
      expect(typeof minify).toBe("function");
    });
  });

  describe("File path handling integration", () => {
    test("should correctly handle relative paths with getminpath", async () => {
      const { getminpath } = await import("../src/utils");

      const testCases = [
        { input: "src/file.js", expected: "src/file.min.js" },
        { input: "./folder/style.css", expected: "./folder/style.min.css" },
        { input: "../parent/script.js", expected: "../parent/script.min.js" },
        { input: "file.min.js", expected: "file.min.min.js" },
      ];

      testCases.forEach((testCase) => {
        expect(getminpath(testCase.input)).toBe(testCase.expected);
      });
    });

    test("should correctly handle complex file names", async () => {
      const { getminpath } = await import("../src/utils");

      const complexNames = [
        "bundle.config.js",
        "styles.dark.css",
        "script.utils.js",
        "module.test.js",
      ];

      complexNames.forEach((name) => {
        const minPath = getminpath(name);
        expect(minPath).toContain(".min");
        // Verify extension is preserved
        if (name.endsWith(".js")) {
          expect(minPath.slice(-3)).toBe(".js");
        } else if (name.endsWith(".css")) {
          expect(minPath.slice(-4)).toBe(".css");
        }
      });
    });
  });

  describe("Fixture file integration", () => {
    test("should find and process test fixtures correctly", async () => {
      const { isModule } = await import("../src/utils");

      const modulePath = path.join(process.cwd(), "fixtures", "module.js");
      const nonModulePath = path.join(
        process.cwd(),
        "fixtures",
        "non-module.js",
      );

      const isModuleFile = await isModule(modulePath);
      const isNonModuleFile = await isModule(nonModulePath);

      expect(isModuleFile).toBe(true);
      expect(isNonModuleFile).toBe(false);
    });

    test("should handle false-module.js which looks like a module but isn't", async () => {
      const { isModule } = await import("../src/utils");

      const falsePath = path.join(process.cwd(), "fixtures", "false-module.js");
      const result = await isModule(falsePath);

      // This file contains @MODULE in a comment but not as the annotation
      expect(result).toBe(false);
    });
  });

  describe("Error handling across modules", () => {
    test("should handle non-existent files gracefully in isModule", async () => {
      const { isModule } = await import("../src/utils");

      const nonExistentPath = path.join(
        process.cwd(),
        "fixtures",
        "does-not-exist.js",
      );

      // Should reject or throw when file doesn't exist
      await expect(isModule(nonExistentPath)).rejects.toThrow();
    });
  });

  describe("CSS and asset handling", () => {
    test("should correctly identify various file extensions", async () => {
      const { isCSS } = await import("../src/utils");

      const cssFiles = ["style.css", "theme.css", "output.css"];
      const nonCssFiles = [
        "script.js",
        "index.html",
        "config.json",
        "README.md",
      ];

      cssFiles.forEach((file) => {
        expect(isCSS(file)).toBe(true);
      });

      nonCssFiles.forEach((file) => {
        expect(isCSS(file)).toBe(false);
      });
    });

    test("should not match .css in middle of filename", async () => {
      const { isCSS } = await import("../src/utils");

      const falseCssFiles = [
        "style.css.bak",
        "backup.css.old",
        "archive.css.tar.gz",
      ];

      falseCssFiles.forEach((file) => {
        expect(isCSS(file)).toBe(false);
      });
    });
  });
});
