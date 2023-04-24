module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: '../../.eslintrc.js',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'import/extensions': [2, 'always'],
  },
};
