# Instructions pour les agents GitHub Copilot

Objectif rapide

- Aider un agent à être immédiatement productif : comprendre l'architecture, les commandes de build/test, les conventions projet-spécifiques et les points d'intégration.

Architecture & big-picture

- TypeScript library qui compile vers `build/` (ESM, `type: "module"`). Entrées principales : `index.ts`, `manual.ts`.
- Runtime : combinaison SWC (minification legacy) + esbuild (bundle des dépendances modernes). Voir le `README.md` pour la justification décisionnelle.
- Flux de données : le code TS dans `src/`/racine -> `tsc` -> `build/` -> exécutables comme `build/manual.js` utilisés pour tests manuels/CI.

Commandes essentielles (exemples)

- `npm run build` — compile TypeScript (`tsc`). Met à jour `build/`.
- `npm test` — lance la suite `jest` (tests dans `__tests__/`).
- `npm run test:build` — construit puis exécute `node ./build/manual.js --prod` (vérifie output buildé).
- `npm run test:dev` — construit puis `node ./build/manual.js --dev`.
- `npm run lint` / `npm run format` — lint/format.

Conventions projet-spécifiques

- Annotation `// @MODULE` : marque un fichier écrit comme module ES (utile pour importer depuis `node_modules`). Exemple : `_test/module.js`.
- Ne pas réécrire automatiquement le style du code : la README stipule "do not f\*cking touch my code" — privilégier modifications minimales et non-invasives.
- Les fichiers générés restent aux côtés des originaux (les outputs sont conservés dans `build/` et fichiers minifiés côte-à-côte).

Points d'intégration et dépendances

- Dépendances runtime importantes : `@swc/core`, `esbuild`, `fast-glob`, `watchpack`.
- Tests et CI : `jest`, `babel-jest` et workflows GitHub Actions sous `.github/workflows/`.

Guidance pour modification de code

- Si vous changez TS -> exécuter `npm run build` et vérifier `build/manual.js` (ou `npm run test:build`) avant d'ouvrir une PR.
- Quand vous modifiez des API publiques, mettez à jour `_types/index.d.ts` ou les déclarations sous `_types/`.
- Évitez transformations globales (réécritures AST massives) sans tests de régression : ajouter un test sous `__tests__/` couvrant le cas.

Fichiers à consulter en priorité

- [index.ts](index.ts) — point d'export principal.
- [manual.ts](manual.ts) et [build/manual.js](build/manual.js) — utilitaires d'exécution et scripts de démonstration.
- `src/*.ts` — logique modulaire principale.
- `_test/` — fixtures et scénarios d'exemple (notamment `_test/module.js`).
- `__tests__/` — tests unitaires existants (regarder `utils.test.ts`, `development.test.ts`).

Exemple d'actions simples pour un agent

- Pour corriger un bug TS : modifier `src/...`, exécuter `npm run build`, lancer `npm test` et `npm run test:build`.
- Pour ajouter un cas de module : copier le pattern de `_test/module.js` (inclure `// @MODULE`) et ajouter un test dans `__tests__/`.

Questions / itérations

- Indiquez si vous voulez que je formalise des checks CI supplémentaires (ex : exécuter `npm run test:build` dans le pipeline), ou si je dois adopter une tonalité/format différente pour ces instructions.
