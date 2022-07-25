import * as chokidar from "chokidar";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { extname } from "path";

const target: esbuild.CommonOptions["target"] = [];

/**
 * Monitors a list of files and writes minified versions whenever the source changes.
 *
 * @param entry The paths to the files to be monitored.
 */
export const development = (entry: string[]) => {
  // Initialize watcher.
  const watcher = chokidar.watch(entry, {
    persistent: true,
  });

  /**
   * @param path The path to the source file.
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
  const hasModuleComment = (path: string) => {
    return new Promise<boolean>((resolve, reject) => {
      const stream = fs.createReadStream(path, { encoding: "utf8" });
      const comment = `// @MODULE`;
      let string = "";

      stream
        .on("data", (chunk) => {
          if (typeof chunk === "string") {
            string = chunk;
            stream.close();
          }
        })
        .on("close", () => {
          resolve(string.includes(comment));
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

  const watch = (
    isModule: boolean,
    path: string,
    outfile: string,
    changed: boolean
  ) => {
    if (isModule) {
      console.log(`File ${path} is a module, switching to esbuild.`);
      watcher.unwatch(path);
      esbuild
        .build({
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
        })
        .catch((reason) => {
          console.log(`esbuild failed with error: %o`, reason);
        });
    } else {
      fs.copyFile(path, outfile, () => {
        const message = changed
          ? `File ${path} has been added`
          : `File ${path} has been changed`;
        console.log(`${new Date().toLocaleTimeString()} ${message}`);
      });
    }
  };

  // Add event listeners.
  watcher
    .on("add", (path) => {
      const outfile = getminpath(path);

      hasModuleComment(path)
        .then((isModule) => {
          watch(isModule, path, outfile, false);
        })
        .catch((reason) => {
          console.log(reason);
        });
    })
    .on("change", (path) => {
      const outfile = getminpath(path);

      hasModuleComment(path)
        .then((isModule) => {
          watch(isModule, path, outfile, true);
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
