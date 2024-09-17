import fg from "fast-glob";
import path from "path";
import { development } from "./src/development.js";
import { production } from "./src/production.js";

/**
 * @param js The list of Javascript files to be processed, or a glob.
 * @param css The list of CSS files to be processed, or a glob.
 * @see https://github.com/mrmlnc/fast-glob?tab=readme-ov-file#pattern-syntax
 */
const main = (js: string[] | string, css: string[] | string) => {
  // If `js` or `css` is a string, we process it with `fg.sync()` to return a list of files.
  let jsFiles: string[] = [];
  if (typeof js === "string") {
    jsFiles = fg
      .globSync(js.split(",").map((str) => str.replace(/ /g, "")))
      .map((relativePath) => path.normalize(relativePath));
  } else {
    for (const relativePath of js) {
      jsFiles.push(path.normalize(relativePath));
    }
  }

  let cssFiles: string[] = [];
  if (typeof css === "string") {
    cssFiles = fg
      .globSync(css.split(",").map((str) => str.replace(/ /g, "")))
      .map((relativePath) => path.normalize(relativePath));
  } else {
    for (const relativePath of css) {
      cssFiles.push(path.normalize(relativePath));
    }
  }

  const args = process.argv;
  const sourcemap = args.includes("--map");
  const isProduction = args.includes("--prod");

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
    notice = `${notice}\nRead more on glob patterns at: https://github.com/mrmlnc/fast-glob?tab=readme-ov-file#pattern-syntax\n`;
  }

  console.log(notice);

  if (!isProduction) {
    development([...jsFiles, ...cssFiles]);
  } else {
    production([...jsFiles, ...cssFiles], sourcemap);
  }
};

export { main as default };
