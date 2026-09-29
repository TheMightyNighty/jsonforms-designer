import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

/**
 * Flat-Config für ESLint 9.
 *
 * Wired die installierten Plugins (typescript-eslint, simple-import-sort,
 * react-hooks) zusammen. Vorher existierte keine Config — `npm run lint` lief
 * ins Leere. Formatierung läuft separat über `npm run format` (Prettier);
 * `eslint-config-prettier` schaltet kollidierende Stil-Regeln ab.
 */
export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.{js,mjs,cjs,ts}',
    ],
  },
  js.configs.recommended,
  {
    // Werkzeug-Skripte laufen in Node, nicht im Browser (z. B. das
    // KERN-Vendoring, siehe ADR 0004).
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly' },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'simple-import-sort': simpleImportSort,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // TS übernimmt die Undefined-Prüfung zuverlässiger als ESLint.
      'no-undef': 'off',
      /**
       * Abgeleiteten Zustand gleicht man im Render an, nicht im Effekt: Ein
       * Effekt läuft nach dem Malen, also sieht die Redakteurin für einen
       * Durchlauf den alten Wert zum neuen Gegenstand — den Reiter des
       * vorigen Feldes, die Bedingung der vorigen Auswahl.
       *
       * Echte Außensynchronisation ist etwas anderes und bleibt erlaubt:
       * Ein Ladezustand, der zum Abruf gehört, oder ein Speicherstatus, der
       * zum Schreibvorgang gehört. Diese Stellen tragen eine einzeilige
       * Ausnahme mit Begründung — das sind vier, und sie sollen auffallen.
       */
      'react-hooks/set-state-in-effect': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  prettierConfig,
];
