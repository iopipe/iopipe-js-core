module.exports = {
  parser: 'babel-eslint',
  extends: ['eslint:recommended'],
  plugins: ['prettier', 'jest'],
  env: {
    node: true,
    es6: true,
    jasmine: true,
    'jest/globals': true
  },
  parserOptions: {
    sourceType: 'module'
  },
  rules: {
    /**
 * Strict mode
 */
    'prettier/prettier': [
      'error',
      {
        singleQuote: true
      }
    ],
    'no-shadow': 2, // http://eslint.org/docs/rules/no-shadow
    'no-shadow-restricted-names': 2, // http://eslint.org/docs/rules/no-shadow-restricted-names
    'no-unused-vars': [
      2,
      {
        // http://eslint.org/docs/rules/no-unused-vars
        vars: 'local',
        args: 'after-used',
        varsIgnorePattern: '_'
      }
    ],
    'no-use-before-define': 2, // http://eslint.org/docs/rules/no-use-before-define
    'comma-dangle': [2, 'never'], // http://eslint.org/docs/rules/comma-dangle
    'no-alert': 2, // http://eslint.org/docs/rules/no-alert
    'no-console': 0, // http://eslint.org/docs/rules/no-console
    'block-scoped-var': 2, // http://eslint.org/docs/rules/block-scoped-var
    'consistent-return': 2, // http://eslint.org/docs/rules/consistent-return
    'default-case': 2, // http://eslint.org/docs/rules/default-case
    'guard-for-in': 2, // http://eslint.org/docs/rules/guard-for-in
    'no-caller': 2, // http://eslint.org/docs/rules/no-caller
    'no-else-return': 2, // http://eslint.org/docs/rules/no-else-return
    'no-eq-null': 2, // http://eslint.org/docs/rules/no-eq-null
    'no-eval': 2, // http://eslint.org/docs/rules/no-eval
    'no-extend-native': 2, // http://eslint.org/docs/rules/no-extend-native
    'no-extra-bind': 2, // http://eslint.org/docs/rules/no-extra-bind
    'no-floating-decimal': 2, // http://eslint.org/docs/rules/no-floating-decimal
    'no-implied-eval': 2, // http://eslint.org/docs/rules/no-implied-eval
    'no-invalid-this': 2, // http://eslint.org/docs/rules/no-invalid-this
    'no-lone-blocks': 2, // http://eslint.org/docs/rules/no-lone-blocks
    'no-loop-func': 2, // http://eslint.org/docs/rules/no-loop-func
    'no-multi-str': 2, // http://eslint.org/docs/rules/no-multi-str
    'no-global-assign': 2, // http://eslint.org/docs/rules/no-native-reassign
    'no-new': 2, // http://eslint.org/docs/rules/no-new
    'no-new-func': 2, // http://eslint.org/docs/rules/no-new-func
    'no-new-wrappers': 2, // http://eslint.org/docs/rules/no-new-wrappers
    'no-octal-escape': 2, // http://eslint.org/docs/rules/no-octal-escape
    'no-param-reassign': 2, // http://eslint.org/docs/rules/no-param-reassign
    'no-proto': 2, // http://eslint.org/docs/rules/no-proto
    'no-return-assign': 2, // http://eslint.org/docs/rules/no-return-assign
    'no-script-url': 2, // http://eslint.org/docs/rules/no-script-url
    'no-self-compare': 2, // http://eslint.org/docs/rules/no-self-compare
    'no-sequences': 2, // http://eslint.org/docs/rules/no-sequences
    'no-throw-literal': 2, // http://eslint.org/docs/rules/no-throw-literal
    'no-with': 2, // http://eslint.org/docs/rules/no-with
    radix: 2, // http://eslint.org/docs/rules/radix
    'vars-on-top': 2, // http://eslint.org/docs/rules/vars-on-top
    'wrap-iife': [2, 'any'], // http://eslint.org/docs/rules/wrap-iife
    yoda: 2, // http://eslint.org/docs/rules/yoda

    /**
 * Style
 */
    indent: 'off', // http://eslint.org/docs/rules/
    'brace-style': [
      2, // http://eslint.org/docs/rules/brace-style
      '1tbs',
      {
        allowSingleLine: false
      }
    ],
    quotes: [
      2,
      'single',
      'avoid-escape' // http://eslint.org/docs/rules/quotes
    ],
    camelcase: [
      2,
      {
        // http://eslint.org/docs/rules/camelcase
        properties: 'never'
      }
    ],
    'comma-spacing': [
      2,
      {
        // http://eslint.org/docs/rules/comma-spacing
        before: false,
        after: true
      }
    ],
    'comma-style': [2, 'last'], // http://eslint.org/docs/rules/comma-style
    'func-names': 2, // http://eslint.org/docs/rules/func-names
    'key-spacing': [
      2,
      {
        // http://eslint.org/docs/rules/key-spacing
        beforeColon: false,
        afterColon: true
      }
    ],
    'no-multiple-empty-lines': [
      2,
      {
        // http://eslint.org/docs/rules/no-multiple-empty-lines
        max: 2
      }
    ],
    'no-nested-ternary': 2, // http://eslint.org/docs/rules/no-nested-ternary
    'no-new-object': 2, // http://eslint.org/docs/rules/no-new-object
    'func-call-spacing': 2, // http://eslint.org/docs/rules/func-call-spacing
    'no-trailing-spaces': 2, // http://eslint.org/docs/rules/no-trailing-spaces
    'one-var': [2, 'never'], // http://eslint.org/docs/rules/one-var
    'padded-blocks': [2, 'never'], // http://eslint.org/docs/rules/padded-blocks
    semi: [2, 'always'], // http://eslint.org/docs/rules/semi
    'semi-spacing': [
      2,
      {
        // http://eslint.org/docs/rules/semi-spacing
        before: false,
        after: true
      }
    ],
    'keyword-spacing': 2, // http://eslint.org/docs/rules/keyword-spacing
    'space-before-function-paren': 0, // http://eslint.org/docs/rules/space-before-function-paren
    'space-infix-ops': 2, // http://eslint.org/docs/rules/space-infix-ops,
    'no-underscore-dangle': 2 //https://eslint.org/docs/rules/no-underscore-dangle
  }
};
