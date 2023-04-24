module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  root: true,
  extends: 'airbnb-base',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-use-before-define': [
      'error', {
        functions: false,
      },
    ],
  },
};
