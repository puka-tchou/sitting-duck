# sitting-duck

[![npm](https://img.shields.io/npm/v/sitting-duck)](https://www.npmjs.com/package/sitting-duck)
[![bundle size](https://badgen.net/bundlephobia/min/sitting-duck)](https://bundlephobia.com/package/sitting-duck)
[![install size](https://packagephobia.com/badge?p=sitting-duck)](https://packagephobia.com/result?p=sitting-duck)
[![lint](https://github.com/puka-tchou/sitting-duck/actions/workflows/main.yml/badge.svg)](https://github.com/puka-tchou/sitting-duck/actions/workflows/main.yml)
[![Depfu](https://badges.depfu.com/badges/ca84f96e8d849db6e081d875d6c7b3a0/count.svg)](https://depfu.com/github/puka-tchou/sitting-duck?project_id=36118)
[![Snyk security rating](https://snyk-widget.herokuapp.com/badge/npm/sitting-duck/badge.svg)](https://snyk.io/vuln/npm:sitting-duck)

_simplify the modernization of your legacy project by combining a minifier capable of handling both ES6 import/export syntax and outdated script-style global-variable based code._

Are you managing a legacy project that needs gradual modernization? Finding a bundler/minifier that handles **antiquated script-style global-variable based code** as well as **contemporary ES6 import/export syntax and `node_modules/` dependencies** can be challenging. With sitting-duck, you don't have to pause your project's evolution to address these issues.

## Getting Started

1. **Create a file named `minify.mjs`:**

   ```js
   import minify from "sitting-duck";

   // You can either pass a string that will be interpreted as a glob pattern by globby or an array of files.
   minify(
     `_test/*.js, !node_modules/, !**/*.min.js`, // Your JS files
     `_test/*.css, !node_modules/, !**/*.min.css`, // Your CSS files
   );
   ```

2. **Install the necessary dependencies:**

   ```shell-session
   npm i -D sitting-duck
   ```

3. **Update your `package.json`:**

   ```json
   {
     "scripts": {
       "dev": "node ./minify.mjs --dev",
       "build": "node ./minify.mjs"
     }
   }
   ```

4. **Execute the commands:**

   ```shell-session
   npm run build
   npm run dev
   ```

5. **Optionally, update your `.gitignore`:**

   ```text
   *.min.js
   *.min.js.map
   *.min.css
   *.min.css.map
   *.LEGAL.txt
   ```

## Using Import/Exports with the `// @MODULE` Annotation

When importing a module from `node_modules/`, add the following line at the very beginning of the file:

```js
// @MODULE
```

_See the [\_test/module.js](_test/module.js) file for an example:_

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
@import "./partial.css";
```

_For more information, consult the esbuild docs: [esbuild CSS Content Types](https://esbuild.github.io/content-types/#css)_

## About This Project

The goals of this project are simple:

1. Minify legacy files without breaking the code.
2. Bundle and minify modern syntax.
3. Streamline your codebase's modernization.

We adhere to the principle of **"do not f\*cking touch my code"**. We understand that sometimes things just work, and we respect that. This project won't impose arbitrary coding styles, conventions, or syntax changes. When dealing with large codebases, you don’t want unexpected transformations breaking your app.

To achieve this, we use:

1. [SWC](https://github.com/swc-project/swc) to minify legacy files. SWC is known for its speed.
2. [esbuild](https://github.com/evanw/esbuild) to bundle dependencies and transform modern syntax to `iife`. esbuild is also fast.

The generated files are saved alongside the original ones and can be used in place of the originals.
