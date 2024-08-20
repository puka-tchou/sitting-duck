import main from "../index";
import fg from "fast-glob";
import { development } from "../src/development";
import { production } from "../src/production";
import path from "path";

jest.mock("fast-glob");
jest.mock("../src/development");
jest.mock("../src/production");

describe("index.ts", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call development for non-production mode", () => {
    const jsFiles = ["file1.js", "file2.js"];
    const cssFiles = ["file1.css", "file2.css"];

    (fg.globSync as jest.Mock)
      .mockReturnValueOnce(jsFiles)
      .mockReturnValueOnce(cssFiles);
    process.argv = ["node", "index.ts"];

    main(jsFiles, cssFiles);

    expect(development).toHaveBeenCalledWith([
      path.normalize("file1.js"),
      path.normalize("file2.js"),
      path.normalize("file1.css"),
      path.normalize("file2.css"),
    ]);
    expect(production).not.toHaveBeenCalled();
  });

  it("should call production for production mode", () => {
    const jsFiles = ["file1.js", "file2.js"];
    const cssFiles = ["file1.css", "file2.css"];

    (fg.globSync as jest.Mock)
      .mockReturnValueOnce(jsFiles)
      .mockReturnValueOnce(cssFiles);
    process.argv = ["node", "index.ts", "--prod"];

    main(jsFiles, cssFiles);

    expect(production).toHaveBeenCalledWith(
      [
        path.normalize("file1.js"),
        path.normalize("file2.js"),
        path.normalize("file1.css"),
        path.normalize("file2.css"),
      ],
      false,
    );
    expect(development).not.toHaveBeenCalled();
  });
});
