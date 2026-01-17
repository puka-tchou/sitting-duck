/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

describe("End-to-End Tests", () => {
  let testDir: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "sitting-duck-e2e-"));
  });

  afterEach(() => {
    // Clean up temporary test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Full workflow: file detection and path generation", () => {
    test("should detect modules and generate correct minified paths", async () => {
      const { isModule, getminpath, isCSS } = await import("../src/utils");

      const testCases = [
        {
          file: "simple.js",
          shouldBeModule: false,
          isCSS: false,
          expectedMin: "simple.min.js",
        },
        {
          file: "styles.css",
          shouldBeModule: false,
          isCSS: true,
          expectedMin: "styles.min.css",
        },
      ];

      for (const testCase of testCases) {
        const isCss = isCSS(testCase.file);
        const minPath = getminpath(testCase.file);

        expect(isCss).toBe(testCase.isCSS);
        expect(minPath).toBe(testCase.expectedMin);
      }
    });

    test("should process multiple files with mixed types", async () => {
      const { isCSS, getminpath } = await import("../src/utils");

      const files = [
        "app.js",
        "styles.css",
        "vendor.js",
        "theme.css",
        "script.js",
      ];

      const results = files.map((file) => ({
        file,
        isCSS: isCSS(file),
        minPath: getminpath(file),
      }));

      expect(results).toHaveLength(5);
      expect(results.filter((r) => r.isCSS)).toHaveLength(2);
      expect(results.filter((r) => !r.isCSS)).toHaveLength(3);

      results.forEach((result) => {
        expect(result.minPath).toContain(".min");
      });
    });
  });

  describe("Module detection workflow", () => {
    test("should correctly process module and non-module fixtures", async () => {
      const { isModule } = await import("../src/utils");

      const modulePath = path.join(process.cwd(), "fixtures", "module.js");
      const nonModulePath = path.join(process.cwd(), "fixtures", "non-module.js");

      const isModuleResult = await isModule(modulePath);
      expect(isModuleResult).toBe(true);

      const isNonModuleResult = await isModule(nonModulePath);
      expect(isNonModuleResult).toBe(false);
    });
  });

  describe("Workflow: create test files and verify detection", () => {
    test("should correctly detect @MODULE annotation in created files", async () => {
      const { isModule } = await import("../src/utils");

      // Create a test file with @MODULE
      const moduleFile = path.join(testDir, "test-module.js");
      fs.writeFileSync(
        moduleFile,
        `// @MODULE
import { something } from 'module';
console.log(something);
`,
      );

      const isModuleResult = await isModule(moduleFile);
      expect(isModuleResult).toBe(true);
    });

    test("should correctly detect files without @MODULE", async () => {
      const { isModule } = await import("../src/utils");

      // Create a test file without @MODULE
      const regularFile = path.join(testDir, "regular.js");
      fs.writeFileSync(
        regularFile,
        `const x = 1;
console.log(x);
`,
      );

      const isModuleResult = await isModule(regularFile);
      expect(isModuleResult).toBe(false);
    });

    test("should handle @MODULE at different positions", async () => {
      const { isModule } = await import("../src/utils");

      // @MODULE at start (valid)
      const validModule = path.join(testDir, "valid-module.js");
      fs.writeFileSync(validModule, `// @MODULE\nimport x from 'y';`);
      expect(await isModule(validModule)).toBe(true);

      // @MODULE in middle (still detected because it checks content)
      const middleModule = path.join(testDir, "middle-module.js");
      fs.writeFileSync(middleModule, `const x = 1; // @MODULE\nconst y = 2;`);
      expect(await isModule(middleModule)).toBe(true);
    });

    test("should handle files with similar patterns but not exact @MODULE", async () => {
      const { isModule } = await import("../src/utils");

      const falseModule = path.join(testDir, "false-module.js");
      fs.writeFileSync(falseModule, `// This is not a module comment\nconst x = 1;`);

      const result = await isModule(falseModule);
      // Should be false because it doesn't contain "// @MODULE"
      expect(result).toBe(false);
    });
  });

  describe("Workflow: CSS file handling", () => {
    test("should correctly identify and process CSS files", async () => {
      const { isCSS, getminpath } = await import("../src/utils");

      const cssFile = "main.css";
      expect(isCSS(cssFile)).toBe(true);
      expect(getminpath(cssFile)).toBe("main.min.css");
    });

    test("should create and verify CSS file operations", async () => {
      const { isCSS, getminpath } = await import("../src/utils");

      const cssPath = path.join(testDir, "styles.css");
      fs.writeFileSync(cssPath, "body { color: red; }");

      expect(isCSS(cssPath)).toBe(true);
      const minPath = getminpath(cssPath);
      expect(minPath).toContain(".min.css");
      expect(minPath).toContain("styles");
    });
  });

  describe("Workflow: File extension edge cases", () => {
    test("should handle files with multiple dots correctly", async () => {
      const { getminpath } = await import("../src/utils");

      const testCases = [
        {
          input: "package.bundle.js",
          expected: "package.bundle.min.js",
        },
        {
          input: "style.theme.dark.css",
          expected: "style.theme.dark.min.css",
        },
        {
          input: "app.config.prod.js",
          expected: "app.config.prod.min.js",
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getminpath(input)).toBe(expected);
      });
    });

    test("should handle files without extensions", async () => {
      const { getminpath } = await import("../src/utils");

      const noExtFile = "README";
      const result = getminpath(noExtFile);

      // Should return unchanged
      expect(result).toBe(noExtFile);
    });

    test("should handle hidden files correctly", async () => {
      const { getminpath } = await import("../src/utils");

      const hiddenFile = ".config.js";
      const result = getminpath(hiddenFile);

      expect(result).toBe(".config.min.js");
    });
  });

  describe("Workflow: Type consistency", () => {
    test("should maintain consistent types throughout workflow", async () => {
      const { isModule, isCSS, getminpath } = await import("../src/utils");
      const { esbuildOptions } = await import("../src/options");

      // Verify function signatures
      expect(typeof isModule).toBe("function");
      expect(typeof isCSS).toBe("function");
      expect(typeof getminpath).toBe("function");
      expect(typeof esbuildOptions).toBe("object");

      // Verify return types
      expect(typeof isCSS("test.css")).toBe("boolean");
      expect(typeof getminpath("test.js")).toBe("string");
    });
  });

  describe("Workflow: Large batch processing", () => {
    test("should handle processing large number of files", async () => {
      const { isCSS, getminpath } = await import("../src/utils");

      const largeFileList = Array.from({ length: 100 }, (_, i) =>
        i % 2 === 0 ? `file${i}.js` : `style${i}.css`,
      );

      const results = largeFileList.map((file) => ({
        file,
        isCss: isCSS(file),
        minPath: getminpath(file),
      }));

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.minPath.includes(".min"))).toBe(true);

      const cssFiles = results.filter((r) => r.isCss);
      const jsFiles = results.filter((r) => !r.isCss);

      expect(cssFiles.length).toBe(50);
      expect(jsFiles.length).toBe(50);
    });
  });

  describe("Workflow: Options validation", () => {
    test("should provide valid esbuild options for bundling", async () => {
      const { esbuildOptions } = await import("../src/options");

      // Verify critical properties exist and have correct types
      expect(typeof esbuildOptions.bundle).toBe("boolean");
      expect(typeof esbuildOptions.format).toBe("string");
      expect(typeof esbuildOptions.platform).toBe("string");
      expect(Array.isArray(esbuildOptions.target)).toBe(true);

      // Verify specific values
      expect(esbuildOptions.bundle).toBe(true);
      expect(esbuildOptions.format).toBe("iife");
      expect(esbuildOptions.platform).toBe("browser");
    });

    test("should have comprehensive loader configuration", async () => {
      const { esbuildOptions } = await import("../src/options");

      const loader = esbuildOptions.loader as any;
      const imageFormats = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
      const fontFormats = [".otf", ".ttf", ".woff", ".woff2", ".eot"];

      imageFormats.forEach((format) => {
        expect(loader[format]).toBe("file");
      });

      fontFormats.forEach((format) => {
        expect(loader[format]).toBe("file");
      });
    });
  });

  describe("Workflow: Real fixture integration", () => {
    test("should successfully process real test fixtures", async () => {
      const { isModule, isCSS, getminpath } = await import("../src/utils");
      const fixturePath = path.join(process.cwd(), "fixtures");

      const files = fs.readdirSync(fixturePath);

      for (const file of files) {
        const fullPath = path.join(fixturePath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isFile()) {
          const isCss = isCSS(file);
          const minPath = getminpath(file);

          expect(typeof isCss).toBe("boolean");
          expect(typeof minPath).toBe("string");

          // If it's a JS file, check if it's a module
          if (file.endsWith(".js")) {
            const isModuleResult = await isModule(fullPath);
            expect(typeof isModuleResult).toBe("boolean");
          }
        }
      }
    });
  });
});
