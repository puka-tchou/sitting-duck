import * as swc from "@swc/core";
import * as esbuild from "esbuild";
import * as fs from "fs";
import { getminpath, isCSS, isModule } from "./utils.js";

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
  const locale = "en-US";
  console.log(
    `${filename}: ${Intl.NumberFormat(locale, {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(sourceSize)} > ${Intl.NumberFormat(locale, {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(outSize)} (${Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      style: "percent",
      signDisplay: "exceptZero",
    }).format((outSize - sourceSize) / sourceSize)})`
  );

  // If all files have been processed, the current iteration is the length of the input array.
  // The totals are displayed: weight percentage and difference in MB.
  if (iteration === numFiles) {
    console.log(
      `Total: ${Intl.NumberFormat(locale, {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
      }).format(totSourceSize / 1_000_000)} > ${Intl.NumberFormat(locale, {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
      }).format(totOutSize / 1_000_000)} (${Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
        style: "percent",
        signDisplay: "exceptZero",
      }).format(
        (totOutSize - totSourceSize) / totSourceSize
      )} / ${Intl.NumberFormat(locale, {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
        signDisplay: "exceptZero",
      }).format(((totSourceSize - totOutSize) / 1_000_000) * -1)})`
    );
  }
};

/**
 * Bundles and minifies a source file using swc.
 *
 * @param source The path to the input file.
 * @param sourcemap Should sourcemaps be generated?
 * @param out The path to the out file.
 * @param numFiles The total number of files.
 */
const bundleWithSwc = (
  source: string,
  sourcemap: boolean,
  out: string,
  numFiles: number
) => {
  fs.readFile(source, { encoding: "utf-8" }, (readError, data) => {
    if (readError) {
      console.error(readError);
    }

    swc
      .minify(data, {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: false,
        sourceMap: sourcemap,
        module: false,
      })
      .then((output) => {
        fs.writeFile(out, output.code, { encoding: "utf-8" }, (writeError) => {
          if (writeError) {
            console.log(`Could not write the file: ${writeError.message}`);
            return;
          }

          logResult(source, out, numFiles);
        });
        if (output.map) {
          fs.writeFile(
            `${out}.map`,
            output.map,
            { encoding: "utf-8" },
            (writeError) => {
              if (writeError) {
                console.log(
                  `Could not write the source map (this is probably fine): ${writeError.message}`
                );
              }
            }
          );
        }
      })
      .catch((reason) => {
        console.log(reason);
        console.log(`swc failed on ${source}`);
      });
  });
};

/**
 * Bundles and minifies a source file using esbuild.
 *
 * @param source The path to the input file.
 * @param sourcemap Should sourcemaps be generated?
 * @param out The path to the out file.
 * @param numFiles The total number of files.
 */
const bundleWithEsbuild = (
  source: string,
  sourcemap: boolean,
  out: string,
  numFiles: number
) => {
  console.log(`Using esbuild to bundle ${source}`);
  esbuild
    .build({
      entryPoints: [source],
      bundle: true,
      drop: ["console", "debugger"],
      format: "iife",
      platform: "browser",
      minify: true,
      sourcemap,
      target,
      treeShaking: true,
      outfile: out,
      legalComments: "linked",
      loader: {
        ".png": "file",
        ".jpg": "file",
        ".jpeg": "file",
        ".webp": "file",
        ".svg": "file",
      },
    })
    .then((result) => {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        console.log(result);
      }
      logResult(source, out, numFiles);
    })
    .catch(() => {
      console.log(`esbuild failed on ${source}`);
    });
};

/**
 * Minifies and bundles JS and CSS files.
 *
 * @param entries The list of source files.
 */
const production = (entries: string[], sourcemap: boolean) => {
  const numFiles = entries.length;

  entries.forEach((source) => {
    /** The path to the minified file */
    const out = getminpath(source);
    // If the first line is a comment indicating a module,
    // esbuild is used, otherwise swc is used.
    isModule(source)
      .then((module) => {
        if (module || isCSS(source)) {
          bundleWithEsbuild(source, sourcemap, out, numFiles);
          return;
        }

        bundleWithSwc(source, sourcemap, out, numFiles);
      })
      .catch((reason) => {
        console.log(reason);
      });
  });
};

export { production };
