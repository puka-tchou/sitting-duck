import { describe, expect, test } from "@jest/globals";
import { esbuildOptions } from "../src/options";

describe("esbuildOptions Configuration", () => {
  test("should set bundle to true", () => {
    expect(esbuildOptions.bundle).toBe(true);
  });

  test('should set format to "iife"', () => {
    expect(esbuildOptions.format).toBe("iife");
  });

  test('should set platform to "browser"', () => {
    expect(esbuildOptions.platform).toBe("browser");
  });

  test("should initialize target as an empty array", () => {
    expect(esbuildOptions.target).toEqual([]);
  });

  test('should set legalComments to "linked"', () => {
    expect(esbuildOptions.legalComments).toBe("linked");
  });

  test("should configure the correct loaders for file types", () => {
    const expectedLoaders = {
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".webp": "file",
      ".svg": "file",
      ".gif": "file",
      ".otf": "file",
      ".ttf": "file",
      ".woff": "file",
      ".woff2": "file",
      ".eot": "file",
    };
    expect(esbuildOptions.loader).toEqual(expectedLoaders);
  });

  test('should set assetNames to "assets/[ext]/[name]"', () => {
    expect(esbuildOptions.assetNames).toBe("assets/[ext]/[name]");
  });
});
