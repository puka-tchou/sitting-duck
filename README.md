# sitting-duck

[![lint](https://github.com/puka-tchou/sitting-duck/actions/workflows/main.yml/badge.svg)](https://github.com/puka-tchou/sitting-duck/actions/workflows/main.yml)
[![Depfu](https://badges.depfu.com/badges/ca84f96e8d849db6e081d875d6c7b3a0/count.svg)](https://depfu.com/github/puka-tchou/sitting-duck?project_id=36118)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/puka-tchou/sitting-duck.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/puka-tchou/sitting-duck/alerts/)
![Snyk security rating](https://snyk-widget.herokuapp.com/badge/npm/sitting-duck/badge.svg)

_A legacy minifier combination that can handle ES6 import/export style and script styles without breaking your codebase._

You are working on a legacy project and you would like to progressively modernize it? That's a nice goal but good luck finding a bundler/minifier capable of handling **old-school script-style global-variable based and copy-pasted libraries** as well as **modern ES6 import/export syntax and `node_modules/` dependencies** without forcing you to halt the project evolution for at least a month while you clean this mess.

## getting started

create a file named `minify.mjs`:

```js
import minify from "sitting-duck";

// You can either pass a string that will be interpreted as a glob pattern by globby or an array of files.
minify(
  `_test/*.js, !node_modules/, !**/*.min.js`, // These would be your JS files
  `_test/*.css, !node_modules/, !**/*.min.css` // Here are your CSS files
);
```

install the required dependencies:

```shell-session
npm i -D sitting-duck
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

```text
*.min.js
*.min.js.map
*.min.css
*.min.css.map
*.LEGAL.txt
```

## use import/exports with the `// @MODULE` annotation

If you need to import a module from `node_modules/`, the trick is to add this line at the very beggining of you files:

```js
// @MODULE
```

_see the [\_test/module.js](_test/module.js) file for an example:_

```js
// @MODULE
import distance from "@turf/distance";
import { point } from "@turf/helpers";

const testModule = () => {
  const from = point([-75.343, 39.984]);
  const to = point([-75.534, 39.123]);
  const options = { units: "miles" };

  return distance(from, to, options);
};

export { testModule };
```

_we also bundle and minify the CSS files using esbuild, allowing you to use this syntax by eg.:_

```css
@import "./parial.css";
```

_see the esbuild docs for more info: https://esbuild.github.io/content-types/#css_

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
