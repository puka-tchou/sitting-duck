import { minify } from "./index.js";

minify(["_test/script.js", "_test/module.js"], ["_test/index.css"], "build");
