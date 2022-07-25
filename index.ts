import { globbySync } from "globby";
import { development } from "./src/development.js";
import { production } from "./src/production.js";

/**
 * @param js The list of Javascript files to be processed, or a glob.
 * @param css The list of CSS files to be processed, or a glob.
 * @param mode The mode to use `'dev'` or `'build'`.
 * @see https://github.com/sindresorhus/globby#globbing-patterns
 */
const main = (js: string[] | string, css: string[] | string, mode: string) => {
  const jsFiles = typeof js === "string" ? globbySync(js) : js;
  const cssFiles = typeof css === "string" ? globbySync(css) : css;
  const isProduction = mode === "build";

  if (typeof js === "string" || typeof css === "string") {
    console.log(
      `minifying using a glob pattern.\nread more on glob patterns at: https://github.com/sindresorhus/globby#globbing-patterns\n`
    );
  } else {
    console.log(`minifying using an array of files\n`);
  }

  if (!isProduction) {
    development([...jsFiles, ...cssFiles]);
  } else {
    production({ jsFiles, cssFiles });
  }
};

export { main as default };
