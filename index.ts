import * as swc from "@swc/core";
import * as chokidar from "chokidar";
import { minify as minifyCss } from "csso";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { globbySync } from "globby";
import { extname } from "path";

const target: esbuild.CommonOptions["target"] = [];

let totSourceSize = 0;
let totOutSize = 0;
let iteration = 0;

/**
 * @param source The path to the source file.
 * @param output The path to the minified and transformed file.
 * @param numFiles The total number of files.
 */
const logResult = (source: string, output: string, numFiles: number) => {
  const sourceSize = fs.statSync(source).size;
  const outSize = fs.statSync(output).size;
  const filename =
    source.length >= 60 ? source.slice(source.length - 60) : source.padEnd(60);

  // The total size of the source and minified files is accumulated.
  totSourceSize += sourceSize;
  totOutSize += outSize;
  iteration++;

  // We display in the console the name of the source file, its original size, its final size and the difference
  // between the two in percentage.
  console.log(
    `${filename}: ${Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(sourceSize)} > ${Intl.NumberFormat("en-US", {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(outSize)} (${Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      style: "percent",
      signDisplay: "exceptZero",
    }).format((outSize - sourceSize) / sourceSize)})`
  );

  // If all files have been processed, the current iteration is the length of the input array.
  // The totals are displayed: weight percentage and difference in MB.
  if (iteration === numFiles) {
    console.log(
      `Total: ${Intl.NumberFormat("en-US", {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
      }).format(totSourceSize / 1_000_000)} > ${Intl.NumberFormat("en-US", {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
      }).format(totOutSize / 1_000_000)} (${Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
        style: "percent",
        signDisplay: "exceptZero",
      }).format(
        (totOutSize - totSourceSize) / totSourceSize
      )} / ${Intl.NumberFormat("en-US", {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
        signDisplay: "exceptZero",
      }).format(((totSourceSize - totOutSize) / 1_000_000) * -1)})`
    );
  }
};

/**
 * Monitors a list of files and writes minified versions whenever the source changes.
 *
 * @param entry The paths to the files to be monitored.
 */
const development = (entry: string[]) => {
  // Initialize watcher.
  const watcher = chokidar.watch(entry, {
    persistent: true,
  });

  /**
   * @param {string} path The path to the source file.
   * @returns The path provided with `.min` added before the extension.
   */
  const getminpath = (path: string) =>
    extname(path).length > 0
      ? `${path.slice(0, path.length - extname(path).length)}.min${path.slice(
          -extname(path).length
        )}`
      : path;

  /**
   * Reads the first line of a file.
   *
   * @param path Path to the file to be read.
   * @returns A promise that is resolved at the first line of the file.
   */
  const readfirstline = (path: string) => {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(path, { encoding: "utf8" });
      let accumulator = "";
      let position = 0;
      let index: number;

      stream
        .on("data", (chunk) => {
          index = chunk.indexOf("\n");
          accumulator += chunk;
          if (index !== -1) {
            stream.close();
          } else {
            position += chunk.length;
          }
        })
        .on("close", () => {
          resolve(accumulator.slice(0, position + index));
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  };

  /**
   * Displays the result of the esbuild transpilation.
   *
   * @param error The esbuild error.
   * @param path The path to the minified file.
   */
  const logRebuild = (error: esbuild.BuildFailure | null, path: string) => {
    if (error) {
      console.error(
        `${new Date().toLocaleTimeString()} Build failed: ${error.message}`
      );
    } else {
      console.log(
        `${new Date().toLocaleTimeString()} File ${path} has been changed`
      );
    }
  };

  // Add event listeners.
  watcher
    .on("add", (path) => {
      const outfile = getminpath(path);

      readfirstline(path)
        .then((firstLine) => {
          if (firstLine === "// @MODULE") {
            console.log(`File ${path} is a module, switching to esbuild.`);
            watcher.unwatch(path);
            void esbuild.build({
              entryPoints: [path],
              bundle: true,
              minify: false,
              sourcemap: true,
              target,
              treeShaking: false,
              outfile,
              watch: {
                onRebuild(error) {
                  logRebuild(error, path);
                },
              },
            });
          } else {
            fs.copyFile(path, outfile, () => {
              console.log(
                `${new Date().toLocaleTimeString()} File ${path} has been added`
              );
            });
          }
        })
        .catch((reason) => {
          console.log(reason);
        });
    })
    .on("change", (path) => {
      const outfile = getminpath(path);

      readfirstline(path)
        .then((firstLine) => {
          if (firstLine === "// @MODULE") {
            console.log(`File ${path} is a module, switching to esbuild.`);
            watcher.unwatch(path);
            void esbuild.build({
              entryPoints: [path],
              bundle: true,
              minify: false,
              sourcemap: true,
              target,
              treeShaking: false,
              outfile,
              watch: {
                onRebuild(error) {
                  logRebuild(error, path);
                },
              },
            });
          } else {
            fs.copyFile(path, outfile, () => {
              console.log(
                `${new Date().toLocaleTimeString()} File ${path} has been changed`
              );
            });
          }
        })
        .catch((reason) => {
          console.log(reason);
        });
    })
    .on("unlink", (path) => {
      const outfile = getminpath(path);
      fs.rm(outfile, (error) => {
        if (error) {
          console.log(
            `${new Date().toLocaleTimeString()} Could not remove the file: ${
              error.message
            }`
          );
        } else {
          console.log(
            `${new Date().toLocaleTimeString()} File ${outfile} was removed because ${path} was removed.`
          );
        }
      });
    });

  watcher
    .on("error", (error) => console.log(`Watcher error: ${error.message}`))
    .on("ready", () => console.log(`Initial scan complete. Ready for changes`));
};

/**
 * Minifies and bundles JS and CSS files.
 *
 * @param entries The list of source files.
 */
const production = (entries: { jsFiles: string[]; cssFiles: string[] }) => {
  const { jsFiles, cssFiles } = entries;
  const numFiles = [...jsFiles, ...cssFiles].length;

  jsFiles.forEach((source) => {
    /** The path to the minified file */
    const out = source.replace(".js", ".min.js");
    fs.readFile(source, { encoding: "utf-8" }, (readError, data) => {
      if (readError) {
        console.error(readError);
      }
      // If the first line is a comment indicating a module,
      // esbuild is used, otherwise swc is used.
      if (data.split("\n")[0] === `// @MODULE`) {
        console.log(`File ${source} is a module, switching to esbuild.`);
        esbuild
          .build({
            entryPoints: [source],
            bundle: true,
            minify: true,
            sourcemap: true,
            target,
            treeShaking: true,
            outfile: out,
          })
          .then((result) => {
            if (result.errors.length > 0 || result.warnings.length > 0) {
              console.log(result);
            }
            logResult(source, out, numFiles);
          })
          .catch((reason) => {
            console.trace(
              `Build (esbuild) failed for ${source} with error: %o`,
              reason
            );
          });
      } else {
        swc
          .minify(data, {
            compress: {
              drop_console: true,
            },
            mangle: false,
          })
          .then((output) => {
            fs.writeFile(
              out,
              output.code,
              { encoding: "utf-8" },
              (writeError) => {
                if (writeError) {
                  console.log(
                    `Could not write the file: ${writeError.message}`
                  );
                } else {
                  logResult(source, out, numFiles);
                }
              }
            );
          })
          .catch((reason) => {
            console.trace(
              `Build (swc) failed for ${source} with error: %o`,
              reason
            );
          });
      }
    });
  });

  cssFiles.forEach((sourceFile) => {
    const out = sourceFile.replace(".css", ".min.css");
    fs.readFile(sourceFile, { encoding: "utf-8" }, (readError, data) => {
      if (readError) {
        console.log(readError);
      }
      const css = minifyCss(data).css;
      fs.writeFile(out, css, { encoding: "utf-8" }, (writeError) => {
        if (writeError) {
          console.log(`Could not write the file: ${writeError.message}`);
        } else {
          logResult(sourceFile, out, numFiles);
        }
      });
    });
  });
};

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
    console.log(`minifying using an array of files\n`);
  } else {
    console.log(
      `minifying using a glob pattern.\nread more on glob patterns at: https://github.com/sindresorhus/globby#globbing-patterns\n`
    );
  }

  if (!isProduction) {
    development([...jsFiles, ...cssFiles]);
  } else {
    production({ jsFiles, cssFiles });
  }
};

export { main as default };
