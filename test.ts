import minify from "./index.js";

const testWithObject = () => {
  console.log("\nTesting with an object to define files.");
  minify(
    [
      "_test/script.js",
      "_test/module.js",
      "_test/module-crlf.js",
      "_test/module.tree-shaking.js",
    ],
    ["_test/index.css"],
  );
};

const testWithGlob = () => {
  console.log("\nTesting with an object to define files.");
  minify(
    `_test/*.js, !node_modules/, !**/*.min.js`,
    `_test/*.css, !node_modules/, !**/*.min.css`,
  );
};

const testWithSourceMaps = () => {
  console.log("\nTesting with sourcemap generation.");
  process.argv.push("--map");

  minify(
    `_test/*.js, !node_modules/, !**/*.min.js`,
    `_test/*.css, !node_modules/, !**/*.min.css`,
  );
};

testWithObject();
testWithGlob();
testWithSourceMaps();
