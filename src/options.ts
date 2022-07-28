import { BuildOptions } from "esbuild";

const esbuildOptions: BuildOptions = {
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
};

export { esbuildOptions };
