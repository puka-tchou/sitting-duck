import { extname } from "path";
import * as fs from "fs";

/**
 * Check if a file path contains a CSS extension.
 *
 * @param path The path to the file.
 * @returns Does the file has an extension indicating that it's a CSS file ?
 */
const isCSS = (path: string) => {
  const regex = /\.css$/mu;
  return regex.test(path);
};

/**
 * @param path The path to the source file.
 * @returns The path provided with `.min` added before the extension.
 */
const getminpath = (path: string) => {
  return extname(path).length > 0
    ? `${path.slice(0, path.length - extname(path).length)}.min${path.slice(
        -extname(path).length
      )}`
    : path;
};

/**
 * Reads the first line of a file.
 *
 * @param path Path to the file to be read.
 * @returns A promise that is resolved at the first line of the file.
 */
const isModule = async (path: string) => {
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

export { isCSS, getminpath, isModule };
