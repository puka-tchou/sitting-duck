import * as path from "path";
import { cwd } from "process";
import minify from "./index.js";

const test = () => {
  const mode = process.argv[2]?.split("--")[1] ?? "build";

  minify(
    [
      path.join(cwd(), "_test/script.js"),
      path.join(cwd(), "_test/module.js"),
      path.join(cwd(), "_test/module.tree-shaking.js"),
    ],
    [path.join(cwd(), "_test/index.css")],
    mode
  );

  minify(
    `"_test/*.js", "!**/*.min.js"`,
    `"_test/*.css", "!**/*.min.css"`,
    mode
  );
};

test();
