import Watchpack from "watchpack";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { esbuildOptions } from "./options.js";
import { getminpath, isCSS, isModule } from "./utils.js";

/**
 * Builds the file for development purposes.
 *
 * @param path The path to the file.
 *
 * @returns The message to be displayed in the console.
 */
const build = async (path: string) => {
  const outfile = getminpath(path);
  let message = "";

  await isModule(path)
    .then(async (module) => {
      const css = isCSS(path);
      console.log({ module, css });
      if (module || css) {
        message = `Using esbuild to rebuild ${path}`;
        (
          await esbuild.context({
            ...esbuildOptions,
            entryPoints: [path],
            minify: false,
            sourcemap: true,
            treeShaking: false,
            outfile,
          })
        )
          .rebuild()
          .catch(() => {
            message = `esbuild couldn't rebuild ${path}`;
          });
      } else {
        fs.copyFile(path, outfile, () => {
          message = `successfully copied ${path}`;
        });
      }
    })
    .catch((reason: unknown) => {
      console.log(reason);
    });

  return message;
};

/**
 * Monitors a list of files and writes minified versions whenever the source changes.
 *
 * @param files The paths to the files to be monitored.
 */
const development = (files: string[]) => {
  // Initial build to ensure that files are up to date in case they were changed
  // without being watched
  console.log(
    `Do an initial build to ensure that files are up to date in case they were changed without being watched`,
  );
  files.forEach((file) => {
    void build(file).then((message) => {
      console.log(message);
    });
  });

  // Initialize watcher.
  const watcher = new Watchpack({
    aggregateTimeout: 1000,
    poll: false,
    followSymlinks: false,
  });

  // Watch the list of files.
  watcher.watch({
    files: files,
  });

  // Do stuff based on the events ocurring on the original files.
  watcher
    .on("change", (path) => {
      void build(path).then((message) => {
        console.log(message);
      });
    })
    .on("remove", (path) => {
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
};

export { development };
