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
  // If `js` or `css` is a string, we process it with globbySync to return a list of files.
  const jsFiles =
    typeof js === "string"
      ? globbySync(js.split(",").map((str) => str.replace(/ /g, "")))
      : js;
  const cssFiles =
    typeof css === "string"
      ? globbySync(css.split(",").map((str) => str.replace(/ /g, "")))
      : css;
  const isProduction = mode === "build";

  let notice = "";
  notice =
    typeof js === "string"
      ? `Javascript files defined via a glob pattern.`
      : `Javascript files passed as an array.`;
  notice =
    typeof css === "string"
      ? `${notice}\nCSS files defined via a glob pattern.`
      : `${notice}\nCSS files passed as an array.`;

  if (typeof js === "string" || typeof css === "string") {
    notice = `${notice}\nRead more on glob patterns at: https://github.com/sindresorhus/globby#globbing-patterns\n`;
  }

  console.log(notice);

  if (!isProduction) {
    development([...jsFiles, ...cssFiles]);
  } else {
    production({ jsFiles, cssFiles });
  }
};

export { main as default };
