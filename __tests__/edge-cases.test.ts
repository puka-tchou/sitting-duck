/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "@jest/globals";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

describe("Edge Cases and Stress Tests", () => {
  describe("Edge cases: File name parsing", () => {
    test("should handle extremely long file names", async () => {
      const { getminpath } = await import("../src/utils");

      const longName = "a".repeat(200) + ".js";
      const result = getminpath(longName);

      expect(result).toContain(".min.js");
      expect(result.length).toBeGreaterThan(longName.length);
    });

    test("should handle files with special characters", async () => {
      const { getminpath, isCSS } = await import("../src/utils");

      const specialNames = [
        "file-name.js",
        "file_name.js",
        "file.name.js",
        "file@2.js",
        "file#1.css",
      ];

      specialNames.forEach((name) => {
        const minPath = getminpath(name);
        expect(minPath).toContain(".min");
        expect(typeof minPath).toBe("string");
      });
    });

    test("should handle files with uppercase extensions", async () => {
      const { getminpath, isCSS } = await import("../src/utils");

      // Note: isCSS uses lowercase regex, so uppercase won't match
      expect(isCSS("FILE.CSS")).toBe(false); // regex is case-sensitive
      expect(isCSS("file.css")).toBe(true);

      const upperResult = getminpath("FILE.JS");
      expect(upperResult).toContain(".min");
    });

    test("should handle paths with multiple consecutive dots", async () => {
      const { getminpath } = await import("../src/utils");

      const names = ["file..js", "...config.js", "file.....css"];

      names.forEach((name) => {
        const result = getminpath(name);
        expect(typeof result).toBe("string");
        // Should still produce a valid min path
        expect(result).toContain(".min");
      });
    });

    test("should handle files that are only extension", async () => {
      const { getminpath } = await import("../src/utils");

      const extensionOnly = [".js", ".css", ".gitignore"];

      extensionOnly.forEach((name) => {
        const result = getminpath(name);
        expect(typeof result).toBe("string");
      });
    });
  });

  describe("Edge cases: CSS detection", () => {
    test("should correctly match only exact .css endings", async () => {
      const { isCSS } = await import("../src/utils");

      const testCases = [
        { name: "style.css", expected: true },
        { name: "STYLE.CSS", expected: false }, // case-sensitive
        { name: "style.css.min", expected: false },
        { name: "style.css.map", expected: false },
        { name: "css.js", expected: false },
        { name: ".css", expected: true },
        { name: "style.min.css", expected: true },
      ];

      testCases.forEach(({ name, expected }) => {
        expect(isCSS(name)).toBe(expected);
      });
    });

    test("should reject CSS-like names that don't end with .css", async () => {
      const { isCSS } = await import("../src/utils");

      const nonCssNames = [
        "css-file.js",
        "cascade.js",
        "style-css-bundle.js",
        "my-awesome-css.js",
      ];

      nonCssNames.forEach((name) => {
        expect(isCSS(name)).toBe(false);
      });
    });
  });

  describe("Edge cases: Module detection", () => {
    test("should require valid file paths for isModule", async () => {
      const { isModule } = await import("../src/utils");

      const invalidPath = "/definitely/does/not/exist/file.js";

      // Should reject for non-existent files
      await expect(isModule(invalidPath)).rejects.toThrow();
    });

    test("should handle files with @MODULE in various formats", async () => {
      const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "module-test-"));

      try {
        const { isModule } = await import("../src/utils");

        const testCases = [
          {
            name: "standard.js",
            content: "// @MODULE\nimport x from 'y';",
            expected: true,
          },
          {
            name: "multiline.js",
            content: "/**\n// @MODULE\n */\nimport x from 'y';",
            expected: true,
          },
          {
            name: "inline.js",
            content: "const x = 1; // @MODULE\nconst y = 2;",
            expected: true,
          },
          {
            name: "not-module.js",
            content: "// This is not a module\nconst x = 1;",
            expected: false,
          },
          {
            name: "false-positive.js",
            content: "// TODO: Add // @MODULE support later",
            expected: true,
          },
        ];

        for (const testCase of testCases) {
          const filePath = path.join(testDir, testCase.name);
          fs.writeFileSync(filePath, testCase.content);

          const result = await isModule(filePath);
          expect(result).toBe(testCase.expected);
        }
      } finally {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });
  });

  describe("Edge cases: Path handling", () => {
    test("should handle absolute and relative paths consistently", async () => {
      const { getminpath } = await import("../src/utils");

      const absolutePath = "/usr/local/app/script.js";
      const relativePath = "./script.js";
      const parentPath = "../script.js";

      expect(getminpath(absolutePath)).toContain(".min.js");
      expect(getminpath(relativePath)).toContain(".min.js");
      expect(getminpath(parentPath)).toContain(".min.js");
    });

    test("should preserve path structure with getminpath", async () => {
      const { getminpath } = await import("../src/utils");

      const pathWithDirs = "src/components/button/style.css";
      const result = getminpath(pathWithDirs);

      expect(result).toContain("src/components/button");
      expect(result).toContain("style.min.css");
    });

    test("should handle Windows-style paths", async () => {
      const { getminpath } = await import("../src/utils");

      const windowsPath = "C:\\Users\\app\\script.js";
      const result = getminpath(windowsPath);

      expect(result).toContain(".min.js");
      expect(typeof result).toBe("string");
    });
  });

  describe("Stress tests: Large-scale operations", () => {
    test("should handle 1000 file path transformations efficiently", async () => {
      const { getminpath } = await import("../src/utils");

      for (let i = 0; i < 1000; i++) {
        expect(() => getminpath(`file${i}.${i % 2 === 0 ? "js" : "css"}`)).not.toThrow();
      }
    });

    test("should handle 1000 CSS detection checks efficiently", async () => {
      const { isCSS } = await import("../src/utils");

      for (let i = 0; i < 1000; i++) {
        expect(() => isCSS(`file${i}.${i % 2 === 0 ? "js" : "css"}`)).not.toThrow();
      }
    });

    test("should correctly process randomly generated file names", async () => {
      const { getminpath, isCSS } = await import("../src/utils");

      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";

      for (let i = 0; i < 100; i++) {
        let fileName = "";
        for (let j = 0; j < Math.random() * 20 + 5; j++) {
          fileName += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const ext = i % 3 === 0 ? ".css" : i % 3 === 1 ? ".js" : ".txt";
        const fullName = fileName + ext;

        const minPath = getminpath(fullName);
        const isCss = isCSS(fullName);

        expect(minPath).toContain(".min");
        expect(typeof isCss).toBe("boolean");
      }
    });
  });

  describe("Edge cases: Options validation", () => {
    test("should validate esbuild options structure", async () => {
      const { esbuildOptions } = await import("../src/options");

      // Check that options object is not empty
      expect(Object.keys(esbuildOptions).length).toBeGreaterThan(0);

      // Check specific option types
      expect(typeof esbuildOptions.bundle).toBe("boolean");
      expect(typeof esbuildOptions.platform).toBe("string");
      expect(esbuildOptions.loader).toBeDefined();
      expect(typeof esbuildOptions.loader).toBe("object");
    });

    test("should have reasonable default values for esbuild options", async () => {
      const { esbuildOptions } = await import("../src/options");

      // bundle should be true for esbuild
      expect(esbuildOptions.bundle).toBe(true);

      // format should be a valid esbuild format
      const validFormats = ["iife", "esm", "cjs", "umd"];
      expect(validFormats).toContain(esbuildOptions.format);

      // platform should be valid
      const validPlatforms = ["browser", "node", "neutral"];
      expect(validPlatforms).toContain(esbuildOptions.platform);

      // target should be an array
      expect(Array.isArray(esbuildOptions.target)).toBe(true);
    });
  });

  describe("Edge cases: Error scenarios", () => {
    test("should handle getminpath with empty string", async () => {
      const { getminpath } = await import("../src/utils");

      const result = getminpath("");

      // Should handle gracefully
      expect(typeof result).toBe("string");
    });

    test("should handle isCSS with empty string", async () => {
      const { isCSS } = await import("../src/utils");

      const result = isCSS("");

      // Should return false for empty string
      expect(result).toBe(false);
    });

    test("should handle isCSS with null/undefined-like strings", async () => {
      const { isCSS } = await import("../src/utils");

      expect(isCSS("null")).toBe(false);
      expect(isCSS("undefined")).toBe(false);
      expect(isCSS("NaN")).toBe(false);
    });
  });

  describe("Edge cases: Unicode and special characters", () => {
    test("should handle file names with unicode characters", async () => {
      const { getminpath, isCSS } = await import("../src/utils");

      const unicodeNames = [
        "файл.js",
        "文件.css",
        "αρχείο.js",
        "ファイル.css",
        "📄file.js",
      ];

      unicodeNames.forEach((name) => {
        const minPath = getminpath(name);
        expect(minPath).toContain(".min");
        expect(typeof minPath).toBe("string");
      });
    });

    test("should handle file names with emojis", async () => {
      const { getminpath } = await import("../src/utils");

      const emojiNames = ["🚀.js", "📦script.js", "🎨styles.css"];

      emojiNames.forEach((name) => {
        const result = getminpath(name);
        expect(typeof result).toBe("string");
      });
    });
  });

  describe("Boundary tests: Min/max sizes", () => {
    test("should handle single character file name", async () => {
      const { getminpath } = await import("../src/utils");

      expect(getminpath("a")).toBe("a"); // no extension
      expect(getminpath("a.js")).toBe("a.min.js");
      expect(getminpath("a.css")).toBe("a.min.css");
    });

    test("should handle very deep directory paths", async () => {
      const { getminpath } = await import("../src/utils");

      const deepPath = "a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/script.js";
      const result = getminpath(deepPath);

      expect(result).toContain("script.min.js");
      expect(result.startsWith("a/b/c")).toBe(true);
    });
  });
});
