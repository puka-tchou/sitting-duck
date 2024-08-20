import { esbuildOptions } from "../src/options";

describe("options.ts", () => {
  it("should export the correct esbuild options", () => {
    expect(esbuildOptions).toEqual({
      bundle: true,
      format: "iife",
      platform: "browser",
      target: [],
      legalComments: "linked",
      loader: {
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
      },
      assetNames: "assets/[ext]/[name]",
    });
  });
});
