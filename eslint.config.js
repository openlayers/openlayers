import tsParser from '@typescript-eslint/parser';
import openlayers from 'eslint-config-openlayers';

/**
 * @type {Array<import("eslint").Linter.Config>}
 */
export default [
  ...openlayers,
  {
    // global ignores (don't include other keys in this object)
    // https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
    ignores: [
      'config/jsdoc/api/template/static/scripts/',
      'examples/resources/*',
      'site/build/*',
    ],
  },
  {
    name: 'common-config',
    rules: {
      'import/no-unresolved': [
        'error',
        {
          'ignore': ['@octokit/rest', '@typescript-eslint/parser'],
        },
      ],
    },
  },
  {
    name: 'examples-config',
    files: ['examples/*'],
    rules: {
      'no-unused-vars': ['error', {'varsIgnorePattern': '^map'}],
    },
    languageOptions: {
      globals: {
        arc: 'readonly',
        bootstrap: 'readonly',
        createMapboxStreetsV6Style: 'readonly',
        gifler: 'readonly',
        GyroNorm: 'readonly',
        mapboxgl: 'readonly',
        NumpyLoader: 'readonly',
        toastr: 'readonly',
        topolis: 'readonly',
      },
    },
  },
  {
    name: 'test-config',
    files: ['test/**/*'],
    languageOptions: {
      globals: {
        after: 'readonly',
        afterEach: 'readonly',
        afterLoadText: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        createMapDiv: 'readonly',
        defineCustomMapEl: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        disposeMap: 'readonly',
        it: 'readonly',
        render: 'readonly',
        where: 'readonly',
      },
    },
  },
  {
    name: 'test-typescript-config',
    files: ['test/typescript/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'import/named': 'off',
    },
  },
];
