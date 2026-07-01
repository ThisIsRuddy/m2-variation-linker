const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
    { ignores: ['node_modules/', 'temp/', 'data/'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'commonjs',
            globals: { ...globals.node },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'smart'],
        },
    },
    // Must stay last: disables rules that would conflict with Prettier.
    prettier,
];
