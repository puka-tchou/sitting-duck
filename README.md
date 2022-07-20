# sitting-duck

[![Depfu](https://badges.depfu.com/badges/ca84f96e8d849db6e081d875d6c7b3a0/count.svg)](https://depfu.com/github/puka-tchou/sitting-duck?project_id=36118)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/puka-tchou/sitting-duck.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/puka-tchou/sitting-duck/alerts/)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=puka-tchou_legacy-minifier&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=puka-tchou_legacy-minifier)

_A legacy minifier combination that can handle ES6 import/export style and script styles without breaking your codebase._

You are working on a legacy project and you would like to progressively modernize it? That's a nice goal but good luck finding a bundler/minifier capable of handling **old-school script-style global-variable based and copy-pasted libraries** as well as **modern ES6 import/export syntax and `node_modules/` dependencies** without forcing you to halt the project evolution for at least a month while you clean this mess.

## getting started

create a file named `minify.mjs`:

```js
import { globbySync } from "globby";
import minify from "sitting-duck";

minify(
  globbySync(["**/*.js", "!node_modules/", "!**/*.min.js"]), // These would be your JS files
  globbySync(["**/*.css", "!node_modules/", "!**/*.min.css"]), // Here are your CSS files
  process.argv[2]?.split("--")[1] ?? "build"
);
```

install the required dependencies:

```shell-session
npm i -D sitting-duck globby
```

update your `package.json`:

```json
{
  "scripts": {
    "dev": "node ./minify.mjs --dev",
    "build": "node ./minify.mjs"
  }
}
```

run the command:

```shell-session
npm run build
npm run dev
```

_optionally update your .gitignore:_

```
*.min.js
*.min.js.map
*.min.css
*.min.css.map
```

## about this project

The goals of this project are pretty straightforward:

1. minify the legacy files without breaking the code
2. bundle and minify the modern syntax
3. silently modernize your codebase

To do this, we use a simple concept: **do not f\*cking touch my code**.

Sometimes, things just work. I understand and respect that and this project won't force you to use an arbitrary coding style, convention or syntax. _When you're working on 10 000+ lines long files, you do not want your bundler to transform your code and unexpectedly break your app._

As a result of this philosophy, we use a combination of tools:

1. [swc](https://github.com/swc-project/swc) to minify the legacy files. swc is fast, very fast.
2. [esbuild](https://github.com/evanw/esbuild) to bundle the dependencies and transform the modern syntax to `iife`. esbuild is fast as well.

the files generated are saved at the side of the original ones and can be used in place of the originals.
