/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, jest, test, beforeEach } from "@jest/globals";
import * as fs from "node:fs";
import * as esbuild from "esbuild";
import Watchpack from "watchpack";

// Mock dependencies before importing development
jest.mock("esbuild");
jest.mock("watchpack");
jest.mock("fs");

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

// Now import the module under test
import { development, build } from "../src/development";
import * as utils from "../src/utils";

describe("Development Mode Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  describe("build function", () => {
    test("should handle module files with esbuild", async () => {
      const testFile = "_test/module.js";
      (utils.isModule as jest.Mock).mockResolvedValue(true as any);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      const mockContext = {
        rebuild: jest.fn().mockResolvedValue({}),
      };
      (esbuild.context as jest.Mock).mockResolvedValue(mockContext);

      const result = await build(testFile);

      expect(result).toBe(`Using esbuild to rebuild ${testFile}`);
      expect(esbuild.context).toHaveBeenCalled();
      expect(mockContext.rebuild).toHaveBeenCalled();
    });

    test("should handle CSS files with esbuild", async () => {
      const testFile = "_test/styles.css";
      (utils.isModule as jest.Mock).mockResolvedValue(false);
      (utils.isCSS as jest.Mock).mockReturnValue(true);

      const mockContext = {
        rebuild: jest.fn().mockResolvedValue({}),
      };
      (esbuild.context as jest.Mock).mockResolvedValue(mockContext);

      const result = await build(testFile);

      expect(result).toBe(`Using esbuild to rebuild ${testFile}`);
    });

    test("should copy non-module files with fs.copyFile", async () => {
      const testFile = "_test/script.js";
      (utils.isModule as jest.Mock).mockResolvedValue(false);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.copyFile as jest.Mock).mockImplementation((src, dest, cb) => {
        cb(null);
      });

      const result = await build(testFile);

      expect(result).toBe(`successfully copied ${testFile}`);
      expect(fs.copyFile).toHaveBeenCalled();
    });

    test("should handle esbuild rebuild errors", async () => {
      const testFile = "_test/module.js";
      (utils.isModule as jest.Mock).mockResolvedValue(true);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      const mockContext = {
        rebuild: jest.fn().mockRejectedValue(new Error("Build failed")),
      };
      (esbuild.context as jest.Mock).mockResolvedValue(mockContext);

      const result = await build(testFile);

      expect(result).toBe(`esbuild couldn't rebuild ${testFile}`);
    });

    test("should handle isModule errors", async () => {
      const testFile = "_test/error.js";
      (utils.isModule as jest.Mock).mockRejectedValue(new Error("Read error"));

      const result = await build(testFile);

      expect(result).toBe("");
    });

    test("should pass correct esbuild options", async () => {
      const testFile = "_test/module.js";
      (utils.isModule as jest.Mock).mockResolvedValue(true);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      const mockContext = {
        rebuild: jest.fn().mockResolvedValue({}),
      };
      (esbuild.context as jest.Mock).mockResolvedValue(mockContext);

      await build(testFile);

      const contextCall = (esbuild.context as jest.Mock).mock.calls[0][0];
      expect(contextCall).toEqual(
        expect.objectContaining({
          entryPoints: [testFile],
          minify: false,
          sourcemap: true,
          treeShaking: false,
        }),
      );
    });
  });

  describe("development function", () => {
    test("should initialize watcher with correct configuration", () => {
      const files = ["_test/script.js", "_test/module.js"];
      (utils.isModule as jest.Mock).mockResolvedValue(false);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      const mockWatcherInstance = {
        watch: jest.fn(),
        on: jest.fn().mockReturnThis(),
      };

      (Watchpack as jest.Mock).mockImplementation(() => mockWatcherInstance);

      (fs.copyFile as jest.Mock).mockImplementation((src, dest, cb) => {
        cb(null);
      });

      development(files);

      expect(Watchpack).toHaveBeenCalledWith({
        aggregateTimeout: 1000,
        poll: false,
        followSymlinks: false,
      });
    });

    test("should watch the provided files", () => {
      const files = ["_test/script.js"];
      const mockWatcherInstance = {
        watch: jest.fn(),
        on: jest.fn().mockReturnThis(),
      };

      (Watchpack as jest.Mock).mockImplementation(() => mockWatcherInstance);
      (utils.isModule as jest.Mock).mockResolvedValue(false);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.copyFile as jest.Mock).mockImplementation((src, dest, cb) => {
        cb(null);
      });

      development(files);

      expect(mockWatcherInstance.watch).toHaveBeenCalledWith({
        files: files,
      });
    });

    test("should handle remove event and delete output files", (done) => {
      const files = ["_test/script.js"];
      const mockWatcherInstance = {
        watch: jest.fn(),
        on: jest.fn().mockReturnThis(),
      };

      let removeHandler: ((path: string) => void) | null = null;

      mockWatcherInstance.on.mockImplementation((event, handler) => {
        if (event === "remove") {
          removeHandler = handler;
        }
        return mockWatcherInstance;
      });

      (Watchpack as jest.Mock).mockImplementation(() => mockWatcherInstance);
      (utils.isModule as jest.Mock).mockResolvedValue(false);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.copyFile as jest.Mock).mockImplementation((src, dest, cb) => {
        cb(null);
      });

      (fs.rm as jest.Mock).mockImplementation((path, cb) => {
        cb(null);
      });

      development(files);

      if (removeHandler) {
        removeHandler("_test/script.js");
        expect(fs.rm).toHaveBeenCalled();
      }

      done();
    });

    test("should handle remove event errors gracefully", (done) => {
      const files = ["_test/script.js"];
      const mockWatcherInstance = {
        watch: jest.fn(),
        on: jest.fn().mockReturnThis(),
      };

      let removeHandler: ((path: string) => void) | null = null;

      mockWatcherInstance.on.mockImplementation((event, handler) => {
        if (event === "remove") {
          removeHandler = handler;
        }
        return mockWatcherInstance;
      });

      (Watchpack as jest.Mock).mockImplementation(() => mockWatcherInstance);
      (utils.isModule as jest.Mock).mockResolvedValue(false);
      (utils.isCSS as jest.Mock).mockReturnValue(false);

      (fs.copyFile as jest.Mock).mockImplementation((src, dest, cb) => {
        cb(null);
      });

      const removeError = new Error("Permission denied");
      (fs.rm as jest.Mock).mockImplementation((path, cb) => {
        cb(removeError);
      });

      development(files);

      if (removeHandler) {
        removeHandler("_test/script.js");
        expect(fs.rm).toHaveBeenCalled();
      }

      done();
    });
  });
});
