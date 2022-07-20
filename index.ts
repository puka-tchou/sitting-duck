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
 * @param source Le chemin vers le fichier source.
 * @param output Le chemin vers le fichier minifié et transformé.
 * @param numFiles Le nombre total de fichiers.
 */
const logResult = (source: string, output: string, numFiles: number) => {
  const sourceSize = fs.statSync(source).size;
  const outSize = fs.statSync(output).size;
  const filename =
    source.length >= 60 ? source.slice(source.length - 60) : source.padEnd(60);

  // On accumule la taille totale des fichiers source et des fichiers minifiés.
  totSourceSize += sourceSize;
  totOutSize += outSize;
  iteration++;

  // On affiche dans la console le nom du fichier source, sa taille originale, sa taille finale et la différence entre
  // les deux en pourcentage.
  console.log(
    `${filename}: ${Intl.NumberFormat("fr-FR", {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(sourceSize)} > ${Intl.NumberFormat("fr-Fr", {
      style: "unit",
      unit: "byte",
      unitDisplay: "long",
    }).format(outSize)} (${Intl.NumberFormat("fr-Fr", {
      maximumFractionDigits: 2,
      style: "percent",
      signDisplay: "exceptZero",
    }).format((outSize - sourceSize) / sourceSize)})`
  );

  // Si on a terminé de traiter tous les fichiers, l'itération actuelle correspond à la longueur du tableau d'entrées.
  // On affiche les totaux : pourcentage de poids et différence en Mo.
  if (iteration === numFiles) {
    console.log(
      `Total: ${Intl.NumberFormat("fr-FR", {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
      }).format(totSourceSize / 1_000_000)} > ${Intl.NumberFormat("fr-FR", {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
      }).format(totOutSize / 1_000_000)} (${Intl.NumberFormat("fr-Fr", {
        maximumFractionDigits: 2,
        style: "percent",
        signDisplay: "exceptZero",
      }).format(
        (totOutSize - totSourceSize) / totSourceSize
      )} / ${Intl.NumberFormat("fr-FR", {
        style: "unit",
        unit: "megabyte",
        unitDisplay: "short",
        signDisplay: "exceptZero",
      }).format(((totSourceSize - totOutSize) / 1_000_000) * -1)})`
    );
  }
};

/**
 * Surveille une liste de fichiers et écrit les versions minifiées à chaque
 * changement de la source.
 *
 * @param entry Les chemins vers les fichiers à surveiller.
 */
const development = (entry: string[]) => {
  // Initialize watcher.
  const watcher = chokidar.watch(entry, {
    persistent: true,
  });

  /**
   * @param {string} path Le chemin du fichier source.
   * @returns Le chemin fourni avec `.min` ajouté devant l'extension.
   */
  const getminpath = (path: string) =>
    extname(path).length > 0
      ? `${path.slice(0, path.length - extname(path).length)}.min${path.slice(
          -extname(path).length
        )}`
      : path;

  /**
   * Lit la première ligne d'un fichier.
   *
   * @returns Une promesse qui se résout à la première ligne du fichier.
   * @parampath Chemin d'accès au fichier à lire.
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

  // Add event listeners.
  watcher
    .on("add", (path) => {
      const outfile = getminpath(path);

      readfirstline(path).then((firstLine) => {
        if (firstLine === "// @MODULE") {
          console.log(`File ${path} is a module, switching to esbuild.`);
          watcher.unwatch(path);
          esbuild.build({
            entryPoints: [path],
            bundle: true,
            minify: false,
            sourcemap: true,
            target,
            treeShaking: false,
            outfile,
            watch: {
              onRebuild(error) {
                if (error) {
                  console.error(
                    `${new Date().toLocaleTimeString()} Build failed: ${error}`
                  );
                } else {
                  console.log(
                    `${new Date().toLocaleTimeString()} File ${path} has been changed`
                  );
                }
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
      });
    })
    .on("change", (path) => {
      const outfile = getminpath(path);

      readfirstline(path).then((firstLine) => {
        if (firstLine === "// @MODULE") {
          console.log(`File ${path} is a module, switching to esbuild.`);
          watcher.unwatch(path);
          esbuild.build({
            entryPoints: [path],
            bundle: true,
            minify: false,
            sourcemap: true,
            target,
            treeShaking: false,
            outfile,
            watch: {
              onRebuild(error) {
                if (error) {
                  console.error(
                    `${new Date().toLocaleTimeString()} Build failed: ${error}`
                  );
                } else {
                  console.log(
                    `${new Date().toLocaleTimeString()} File ${path} has been changed`
                  );
                }
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
      });
    })
    .on("unlink", (path) => {
      const outfile = getminpath(path);
      fs.rm(outfile, (err) => {
        if (err) {
          console.log(
            `${new Date().toLocaleTimeString()} Could not remove the file: ${err}`
          );
        } else {
          console.log(
            `${new Date().toLocaleTimeString()} File ${outfile} was removed because ${path} was removed.`
          );
        }
      });
    });

  watcher
    .on("error", (error) => console.log(`Watcher error: ${error}`))
    .on("ready", () => console.log(`Initial scan complete. Ready for changes`));
};

/**
 * Minifie et bundle les fichiers JS et CSS.
 *
 * @param entries La liste des fichiers source.
 */
const production = (entries: { jsFiles: string[]; cssFiles: string[] }) => {
  const { jsFiles, cssFiles } = entries;
  const numFiles = [...jsFiles, ...cssFiles].length;

  jsFiles.forEach((source) => {
    /** Le chemin vers le fichier minifié */
    const out = source.replace(".js", ".min.js");
    fs.readFile(source, { encoding: "utf-8" }, (readError, data) => {
      if (readError) {
        console.error(readError);
      }
      // Si la première ligne est un commentaire indiquant un module, on utilise esbuild,
      // sinon on utilise swc.
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
                  console.log(`Could not write the file: ${writeError}`);
                } else {
                  logResult(source, out, numFiles);
                }
              }
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
          console.log(`Could not write the file: ${writeError}`);
        } else {
          logResult(sourceFile, out, numFiles);
        }
      });
    });
  });
};

/**
 * @param js La liste des fichiers Javascript à traiter, ou un glob.
 * @param css La liste des fichiers CSS à traiter, ou un glob.
 * @param mode Le mode à utiliser `'dev'` ou `'build'`. `'dev'` par défaut.
 * @see https://github.com/sindresorhus/globby#globbing-patterns
 */
const main = (js: string[], css: string[], mode: string) => {
  const jsFiles =
    js ?? globbySync(["**/*.js", "!node_modules/", "!**/*.min.js"]);
  const cssFiles =
    css ?? globbySync(["**/*.css", "!node_modules/", "!**/*.min.css"]);

  const isProduction = mode === "build";

  if (!isProduction) {
    development([...jsFiles, ...cssFiles]);
  } else {
    production({ jsFiles, cssFiles });
  }
};

export { main as default };
