import * as chokidar from "chokidar";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { esbuildOptions } from "./options.js";
import { getminpath, isCSS, isModule } from "./utils.js";

const target: esbuild.CommonOptions["target"] = [];

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

/**
 * Builds the file for development purposes.
 *
 * @param path The path to the file.
 * @param changed Has the file changed or has it just been added to the watch list?
 * @param watcher The chokidar file watcher instance.
 */
const build = async (
  path: string,
  changed: boolean,
  watcher: chokidar.FSWatcher
) => {
  const outfile = getminpath(path);

  await isModule(path)
    .then((module) => {
      const css = isCSS(path);
      if (module || css) {
        console.log(`Using esbuild to bundle ${path}`);
        watcher.unwatch(path);
        esbuild
          .build({
            ...esbuildOptions,
            entryPoints: [path],
            minify: false,
            sourcemap: true,
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
    })
    .catch((reason) => {
      console.log(reason);
    });
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

  // Add event listeners.
  watcher
    .on("add", (path) => {
      void build(path, false, watcher);
    })
    .on("change", (path) => {
      void build(path, true, watcher);
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

export { development };
