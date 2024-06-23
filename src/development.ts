import * as chokidar from "chokidar";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { esbuildOptions } from "./options.js";
import { getminpath, isCSS, isModule } from "./utils.js";

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
  watcher: chokidar.FSWatcher,
) => {
  const outfile = getminpath(path);

  await isModule(path)
    .then(async (module) => {
      const css = isCSS(path);
      if (module || css) {
        console.log(`Using esbuild to bundle ${path}`);
        watcher.unwatch(path);
        (
          await esbuild.context({
            ...esbuildOptions,
            entryPoints: [path],
            minify: false,
            sourcemap: true,
            treeShaking: false,
            outfile,
            plugins: [
              {
                name: "watch",
                setup(build) {
                  build.onEnd((result) => {
                    if (result.errors.length > 0) {
                      const logError = (message: esbuild.Message): void => {
                        console.log(
                          `Error in file ${message.location?.file ?? "undefined"}: ${message.text}`,
                        );
                        console.log(message.location);
                      };

                      result.errors.forEach(logError);
                    } else {
                      console.log(`File ${path} was successfully built`);
                    }
                  });
                },
              },
            ],
          })
        )
          .watch()
          .catch((reason: unknown) => {
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
    .catch((reason: unknown) => {
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
            }`,
          );
        } else {
          console.log(
            `${new Date().toLocaleTimeString()} File ${outfile} was removed because ${path} was removed.`,
          );
        }
      });
    });

  watcher
    .on("error", (error) => {
      console.log(`Watcher error: ${error.message}`);
    })
    .on("ready", () => {
      console.log(`Initial scan complete. Ready for changes`);
    });
};

export { development };
