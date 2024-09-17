import { describe, expect, jest, test } from "@jest/globals";
import { isCSS, getminpath, isModule } from "../src/utils";
import path from "path";
import * as fs from "fs";
import { Readable } from "stream";

describe("Utils Tests", () => {
  describe("isCSS", () => {
    test("should return true for .css files", () => {
      expect(isCSS("styles.css")).toBe(true);
    });

    test("should return false for non-css files", () => {
      expect(isCSS("index.html")).toBe(false);
    });
    test("should return false for files with no extension", () => {
      expect(isCSS("README")).toBe(false);
    });

    test("should return false for files with multiple extensions", () => {
      expect(isCSS("archive.tar.gz")).toBe(false);
    });

    test("should return false for files with .css in the middle of the name", () => {
      expect(isCSS("style.css.backup")).toBe(false);
    });
  });

  describe("getminpath", () => {
    test("should return correct minified path for .js files", () => {
      expect(getminpath("index.js")).toBe("index.min.js");
    });

    test("should return correct minified path for .css files", () => {
      expect(getminpath("styles.css")).toBe("styles.min.css");
    });

    test("should return the same path for files with no extension", () => {
      expect(getminpath("README")).toBe("README");
    });

    test("should handle non-standard extensions", () => {
      expect(getminpath("archive.tar.gz")).toBe("archive.tar.min.gz");
    });

    test("should handle file names with multiple periods", () => {
      expect(getminpath("file.name.js")).toBe("file.name.min.js");
    });
  });

  describe("isModule", () => {
    const fixturesPath = path.join(__dirname, "../fixtures");

    test("should resolve true if file contains @MODULE comment", async () => {
      const result = await isModule(path.join(fixturesPath, "module.js"));
      expect(result).toBe(true);
    });

    test("should resolve false if file does not contain @MODULE comment", async () => {
      const result = await isModule(path.join(fixturesPath, "non-module.js"));
      expect(result).toBe(false);
    });

    test("should resolve false for an empty file", async () => {
      const result = await isModule(path.join(fixturesPath, "empty-file.js"));
      expect(result).toBe(false);
    });

    test("should resolve false for @MODULE as part of a larger string", async () => {
      const result = await isModule(path.join(fixturesPath, "false-module.js"));
      expect(result).toBe(false);
    });

    test("should reject if data from file is not of type string", async () => {
      const mockReadStream = new Readable({
        read() {
          this.push(Buffer.from([0x01, 0x02])); // Emit a buffer (non-string)
          this.push(null); // End the stream
        },
      });

      const mockFs = {
        ...fs,
        createReadStream: jest.fn().mockReturnValue(mockReadStream),
      };

      await expect(isModule("path/to/file", mockFs)).rejects.toThrow(
        "Data was not of type string",
      );

      expect(mockFs.createReadStream).toHaveBeenCalledWith("path/to/file", {
        encoding: "utf8",
      });
    });
  });
});
