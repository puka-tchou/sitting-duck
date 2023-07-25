import * as path from "path";
import { cwd } from "process";
import minify from "./index.js";

const test = () => {
  minify(
    [
      path.join(cwd(), "_test/script.js"),
      path.join(cwd(), "_test/module.js"),
      path.join(cwd(), "_test/module-crlf.js"),
      path.join(cwd(), "_test/module.tree-shaking.js"),
    ],
    [path.join(cwd(), "_test/index.css")],
  );

  minify(
    `_test/*.js, !node_modules/, !**/*.min.js`,
    `_test/*.css, !node_modules/, !**/*.min.css`,
  );
};

test();
