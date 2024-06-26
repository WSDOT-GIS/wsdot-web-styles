// @ts-check
import eslint from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  jsdoc.configs["flat/recommended-typescript"],
  {
    ignores: [".prettierrc.js"],
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    plugins: { jsdoc },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // "jsdoc/check-access": 1, // Recommended
      // "jsdoc/check-alignment": 1, // Recommended
      // "jsdoc/check-examples": 1,
      // "jsdoc/check-indentation": 1,
      // "jsdoc/check-line-alignment": 1,
      // "jsdoc/check-param-names": 1, // Recommended
      // "jsdoc/check-property-names": 1, // Recommended
      // "jsdoc/check-syntax": 1,
      // "jsdoc/check-tag-names": 1, // Recommended
      // "jsdoc/check-types": 1, // Recommended
      // "jsdoc/check-values": 1, // Recommended
      // "jsdoc/empty-tags": 1, // Recommended
      // "jsdoc/implements-on-classes": 1, // Recommended
      // "jsdoc/informative-docs": 1,
      // "jsdoc/match-description": 1,
      // "jsdoc/multiline-blocks": 1, // Recommended
      // "jsdoc/no-bad-blocks": 1,
      // "jsdoc/no-blank-block-descriptions": 1,
      // "jsdoc/no-defaults": 1,
      // "jsdoc/no-missing-syntax": 1,
      // "jsdoc/no-multi-asterisks": 1, // Recommended
      // "jsdoc/no-restricted-syntax": 1,
      "jsdoc/no-types": [
        "warn",
        {
          contexts: ["any"],
        },
      ],
      // "jsdoc/no-undefined-types": 1, // Recommended
      // "jsdoc/require-asterisk-prefix": 1,
      // "jsdoc/require-description": 1,
      // "jsdoc/require-description-complete-sentence": 1,
      // "jsdoc/require-example": 1,
      // "jsdoc/require-file-overview": 1,
      // "jsdoc/require-hyphen-before-param-description": 1,
      // "jsdoc/require-jsdoc": 1, // Recommended
      "jsdoc/require-jsdoc": [
        "warn",
        {
          publicOnly: true,
          exemptEmptyConstructors: true,
          enableFixer: false,
          // fixerMessage: " TODO: Add documentation here",

          require: {
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
        },
      ],
      // "jsdoc/require-param": 1, // Recommended
      // "jsdoc/require-param-description": 1, // Recommended
      // "jsdoc/require-param-name": 1, // Recommended
      // "jsdoc/require-param-type": 1, // Recommended
      // "jsdoc/require-property": 1, // Recommended
      // "jsdoc/require-property-description": 1, // Recommended
      // "jsdoc/require-property-name": 1, // Recommended
      // "jsdoc/require-property-type": 1, // Recommended
      // "jsdoc/require-returns": 1, // Recommended
      // "jsdoc/require-returns-check": 1, // Recommended
      // "jsdoc/require-returns-description": 1, // Recommended
      // "jsdoc/require-returns-type": 1, // Recommended
      // "jsdoc/require-throws": 1,
      // "jsdoc/require-yields": 1, // Recommended
      // "jsdoc/require-yields-check": 1, // Recommended
      // "jsdoc/sort-tags": 1,
      // "jsdoc/tag-lines": 1, // Recommended
      // "jsdoc/valid-types": 1, // Recommended
    },
  },
);
