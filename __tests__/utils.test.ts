import { isCSS, getminpath, isModule } from "../src/utils";
import * as fs from "fs";

jest.mock("fs");

describe("Utils Tests", () => {
  test("isCSS should return true for .css files", () => {
    expect(isCSS("styles.css")).toBe(true);
    expect(isCSS("index.html")).toBe(false);
  });

  test("getminpath should return correct minified path", () => {
    expect(getminpath("index.js")).toBe("index.min.js");
    expect(getminpath("styles.css")).toBe("styles.min.css");
    expect(getminpath("README")).toBe("README");
  });

  test("isModule should resolve true if file contains @MODULE comment", async () => {
    const mockStream = {
      on: jest.fn().mockImplementation(function (event, callback) {
        if (event === "data") callback("// @MODULE");
        if (event === "close") callback();
        return this;
      }),
      close: jest.fn(),
    };
    fs.createReadStream.mockReturnValue(mockStream);

    const result = await isModule("testfile.js");
    expect(result).toBe(true);
  });

  test("isModule should resolve false if file does not contain @MODULE comment", async () => {
    const mockStream = {
      on: jest.fn().mockImplementation(function (event, callback) {
        if (event === "data") callback('console.log("Hello World");');
        if (event === "close") callback();
        return this;
      }),
      close: jest.fn(),
    };
    fs.createReadStream.mockReturnValue(mockStream);

    const result = await isModule("testfile.js");
    expect(result).toBe(false);
  });
});
