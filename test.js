import { minify } from "./index.js";

minify(
  ["_test/script.js", "_test/module.js", "_test/module.tree-shaking.js"],
  ["_test/index.css"],
  process.argv[2]?.split("--")[1] ?? "build"
);
