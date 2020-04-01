export default {
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',

        'prettier/@typescript-eslint',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'eslint-plugin-jest', 'eslint-plugin-node'],
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
        ecmaFeatures: {
            modules: true,
        },
        tsconfigRootDir: __Dirname,
        project: ['./tsconfig.json'],
    },
    root: true,
    rules: {
        '@typescript-eslint/brace-style': [2],
        '@typescript-eslint/quotes': ['off'],
        '@typescript-eslint/semi': [2],
        'brace-style': 'off',
        quotes: 'off',
        semi: 'off',
        '@typescript-eslint/ban-ts-ignore': 'warn',
    },
};
