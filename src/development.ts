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
    return new Promise<string>((resolve, reject) => {
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

  const watch = (
    firstLine: string,
    path: string,
    outfile: string,
    changed: boolean
  ) => {
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

      readfirstline(path)
        .then((firstLine) => {
          watch(firstLine, path, outfile, false);
        })
        .catch((reason) => {
          console.log(reason);
        });
    })
    .on("change", (path) => {
      const outfile = getminpath(path);

      readfirstline(path)
        .then((firstLine) => {
          watch(firstLine, path, outfile, true);
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
