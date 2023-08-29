# sitting-duck

[![npm](https://img.shields.io/npm/v/sitting-duck)](https://www.npmjs.com/package/sitting-duck)
[![install size](https://packagephobia.com/badge?p=sitting-duck)](https://packagephobia.com/result?p=sitting-duck)
[![lint](https://github.com/puka-tchou/sitting-duck/actions/workflows/main.yml/badge.svg)](https://github.com/puka-tchou/sitting-duck/actions/workflows/main.yml)
[![Depfu](https://badges.depfu.com/badges/ca84f96e8d849db6e081d875d6c7b3a0/count.svg)](https://depfu.com/github/puka-tchou/sitting-duck?project_id=36118)
[![Snyk security rating](https://snyk-widget.herokuapp.com/badge/npm/sitting-duck/badge.svg)](https://snyk.io/vuln/npm:sitting-duck)

_simplify the modernization of your legacy project by combining a minifier capable of handling both ES6 import/export syntax and outdated script-style global-variable based code._

are you managing a legacy project that's in need of gradual modernization? Achieving that goal is commendable, but finding a bundler/minifier that seamlessly handles **antiquated script-style global-variable based code** as well as **contemporary ES6 import/export syntax and `node_modules/` dependencies** can be daunting. You shouldn't have to put your project's evolution on hold for weeks to untangle this mess.

## getting started

create a file named `minify.mjs`:

```js
import minify from "sitting-duck";

// You can either pass a string that will be interpreted as a glob pattern by globby or an array of files.
minify(
  `_test/*.js, !node_modules/, !**/*.min.js`, // These would be your JS files
  `_test/*.css, !node_modules/, !**/*.min.css`, // Here are your CSS files
);
```

install the necessary dependencies:

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

execute the commands:

```shell-session
npm run build
npm run dev
```

_optionally, update your .gitignore:_

```text
*.min.js
*.min.js.map
*.min.css
*.min.css.map
*.LEGAL.txt
```

## using import/exports with the `// @MODULE` annotation

when importing a module from `node_modules/`, add this line at the very beginning of the file:

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

_CSS files are also bundled and minified using esbuild, supporting syntax like:_

```css
@import "./parial.css";
```

_for more information, consult the esbuild docs:  https://esbuild.github.io/content-types/#css_

## about this project

the objectives of this project are pretty straightforward:

1. minify legacy files without breaking the code
2. bundle and minify modern syntax
3. streamline your codebase's modernization.

To do this, we use a simple concept: **do not f\*cking touch my code**.

Sometimes, things just work. I understand and respect that and this project won't force you to use an arbitrary coding style, convention or syntax. _When you're working on 10 000+ lines long files, you do not want your bundler to transform your code and unexpectedly break your app._

As a result of this philosophy, we use a combination of tools:

1. [swc](https://github.com/swc-project/swc) to minify the legacy files. swc is fast, very fast.
2. [esbuild](https://github.com/evanw/esbuild) to bundle the dependencies and transform the modern syntax to `iife`. esbuild is fast as well.

the files generated are saved at the side of the original ones and can be used in place of the originals.
