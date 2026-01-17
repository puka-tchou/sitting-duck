/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, jest, test, beforeEach } from "@jest/globals";
import * as fs from "node:fs";
import * as swc from "@swc/core";
import * as esbuild from "esbuild";

// Mock dependencies before importing
jest.mock("fs");
jest.mock("@swc/core");
jest.mock("esbuild");

jest.mock("../src/utils", () => ({
  isCSS: jest.fn(),
  getminpath: jest.fn((p: string) => p.replace(/\.(js|css)$/, ".min.$1")),
  isModule: jest.fn(),
}));

jest.mock("../src/options", () => ({
  esbuildOptions: {
    bundle: true,
    format: "iife",
    platform: "browser",
    target: [],
    legalComments: "linked",
    loader: {},
    assetNames: "assets/[ext]/[name]",
  },
}));

import { production, bundleWithSwc, bundleWithEsbuild } from "../src/production";
import * as utils from "../src/utils";

describe("Production Mode Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  describe("bundleWithSwc", () => {
    test("should minify file with swc", () => {
      const source = "_test/script.js";
      const out = "_test/script.min.js";

      (fs.readFile as jest.Mock).mockImplementation((src: any, opts: any, cb: any) => {
        cb(null, "const x = 1;");
      });

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 15 })
        .mockReturnValueOnce({ size: 10 });

      (swc.minify as jest.Mock).mockResolvedValue({
        code: "const x=1",
        map: null,
      } as any);

      (fs.writeFile as jest.Mock).mockImplementation((path: any, data: any, opts: any, cb: any) => {
        cb(null);
      });

      bundleWithSwc(source, false, out, 1);

      expect(fs.readFile).toHaveBeenCalledWith(
        source,
        { encoding: "utf-8" },
        expect.any(Function),
      );
      expect(swc.minify).toHaveBeenCalled();
    });

    test("should handle read errors gracefully", () => {
      const source = "_test/error.js";
      const out = "_test/error.min.js";

      const readError = new Error("Read failed");
      (fs.readFile as jest.Mock).mockImplementation((src: any, opts: any, cb: any) => {
        cb(readError);
      });

      // Suppress console.error for this error handling test
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      bundleWithSwc(source, false, out, 1);

      expect(fs.readFile).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    test("should write sourcemap if output is provided", (done) => {
      const source = "_test/script.js";
      const out = "_test/script.min.js";

      (fs.readFile as jest.Mock).mockImplementation((src: any, opts: any, cb: any) => {
        cb(null, "const x = 1;");
      });

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 15 })
        .mockReturnValueOnce({ size: 10 });

      (swc.minify as jest.Mock).mockResolvedValue({
        code: "const x=1",
        map: '{"version":3}',
      } as any);

      let writeFileCallCount = 0;
      (fs.writeFile as jest.Mock).mockImplementation((path: any, data: any, opts: any, cb: any) => {
        writeFileCallCount++;
        cb(null);

        // Check after both files are written
        if (writeFileCallCount === 2) {
          expect(fs.writeFile).toHaveBeenCalledWith(
            `${out}.map`,
            '{"version":3}',
            { encoding: "utf-8" },
            expect.any(Function),
          );
          done();
        }
      });

      bundleWithSwc(source, true, out, 1);
    });

    test("should handle swc minify errors", () => {
      const source = "_test/script.js";
      const out = "_test/script.min.js";

      (fs.readFile as jest.Mock).mockImplementation((src: any, opts: any, cb: any) => {
        cb(null, "const x = 1;");
      });

      (swc.minify as jest.Mock).mockRejectedValue(new Error("SWC minify failed") as any);

      bundleWithSwc(source, false, out, 1);

      expect(swc.minify).toHaveBeenCalled();
    });
  });

  describe("bundleWithEsbuild", () => {
    test("should bundle file with esbuild", () => {
      const source = "_test/module.js";
      const out = "_test/module.min.js";

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 100 })
        .mockReturnValueOnce({ size: 50 });

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [],
        warnings: [],
      } as any);

      bundleWithEsbuild(source, false, out, 1);

      expect(esbuild.build).toHaveBeenCalledWith(
        expect.objectContaining({
          entryPoints: [source],
          drop: ["console", "debugger"],
          minify: true,
          sourcemap: false,
          treeShaking: true,
          outfile: out,
        }),
      );
    });

    test("should handle sourcemap option", () => {
      const source = "_test/module.js";
      const out = "_test/module.min.js";

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 100 })
        .mockReturnValueOnce({ size: 50 });

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [],
        warnings: [],
      } as any);

      bundleWithEsbuild(source, true, out, 1);

      const buildCall = (esbuild.build as jest.Mock).mock.calls[0][0];
      expect(buildCall.sourcemap).toBe(true);
    });

    test("should handle esbuild errors and warnings", () => {
      const source = "_test/module.js";
      const out = "_test/module.min.js";

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 100 })
        .mockReturnValueOnce({ size: 50 });

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [{ text: "Some error" }],
        warnings: [{ text: "Some warning" }],
      } as any);

      bundleWithEsbuild(source, false, out, 1);

      expect(esbuild.build).toHaveBeenCalled();
    });

    test("should handle esbuild build failures", () => {
      const source = "_test/module.js";
      const out = "_test/module.min.js";

      (esbuild.build as jest.Mock).mockRejectedValue(new Error("Build failed") as any);

      bundleWithEsbuild(source, false, out, 1);

      expect(esbuild.build).toHaveBeenCalled();
    });
  });

  describe("production function", () => {
    test("should process module files with esbuild", () => {
      const files = ["_test/module.js"];
      (utils.isModule as jest.Mock).mockResolvedValue(true as any);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 100 })
        .mockReturnValueOnce({ size: 50 });

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [],
        warnings: [],
      } as any);

      production(files, false);

      expect(utils.isModule).toHaveBeenCalledWith(files[0]);
    });

    test("should process CSS files with esbuild", async () => {
      const files = ["_test/styles.css"];
      (utils.isModule as jest.Mock).mockResolvedValue(false as any);
      (utils.isCSS as jest.Mock).mockReturnValue(true);

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 100 })
        .mockReturnValueOnce({ size: 50 });

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [],
        warnings: [],
      } as any);

      production(files, false);

      // Flush pending promises created by isModule().then(...)
      await Promise.resolve();

      expect(esbuild.build).toHaveBeenCalled();
    });

    test("should process non-module files with swc", () => {
      const files = ["_test/script.js"];
      (utils.isModule as jest.Mock).mockResolvedValue(false as any);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.readFile as jest.Mock).mockImplementation((src: any, opts: any, cb: any) => {
        cb(null, "const x = 1;");
      });

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 15 })
        .mockReturnValueOnce({ size: 10 });

      (swc.minify as jest.Mock).mockResolvedValue({
        code: "const x=1",
        map: null,
      } as any);

      (fs.writeFile as jest.Mock).mockImplementation((path: any, data: any, opts: any, cb: any) => {
        cb(null);
      });

      production(files, false);

      expect(utils.isModule).toHaveBeenCalledWith(files[0]);
    });

    test("should handle isModule errors", () => {
      const files = ["_test/error.js"];
      (utils.isModule as jest.Mock).mockRejectedValue(new Error("Read error") as any);

      production(files, false);

      expect(utils.isModule).toHaveBeenCalled();
    });

    test("should process multiple files", () => {
      const files = ["_test/script1.js", "_test/script2.js", "_test/style.css"];

      (utils.isModule as jest.Mock).mockResolvedValue(false as any);
      (utils.isCSS as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      (fs.readFile as jest.Mock).mockImplementation((src: any, opts: any, cb: any) => {
        cb(null, "const x = 1;");
      });

      (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });

      (swc.minify as jest.Mock).mockResolvedValue({
        code: "const x=1",
        map: null,
      } as any);

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [],
        warnings: [],
      } as any);

      (fs.writeFile as jest.Mock).mockImplementation((path: any, data: any, opts: any, cb: any) => {
        cb(null);
      });

      production(files, false);

      expect(utils.isModule).toHaveBeenCalledTimes(3);
    });

    test("should pass sourcemap option correctly", async () => {
      const files = ["_test/module.js"];
      (utils.isModule as jest.Mock).mockResolvedValue(true as any);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.statSync as jest.Mock)
        .mockReturnValueOnce({ size: 100 })
        .mockReturnValueOnce({ size: 50 });

      (esbuild.build as jest.Mock).mockResolvedValue({
        errors: [],
        warnings: [],
      } as any);

      production(files, true);

      // Flush pending promises created by isModule().then(...)
      await Promise.resolve();

      const buildCall = (esbuild.build as jest.Mock).mock.calls[0][0];
      expect(buildCall.sourcemap).toBe(true);
    });
  });
});
