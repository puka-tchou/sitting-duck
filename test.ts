import * as path from "path";
import { cwd } from "process";
import minify from "./index.js";

minify(
  [
    path.join(cwd(), "_test/script.js"),
    path.join(cwd(), "_test/module.js"),
    path.join(cwd(), "_test/module.tree-shaking.js"),
  ],
  [path.join(cwd(), "_test/index.css")],
  process.argv[2]?.split("--")[1] ?? "build"
);
