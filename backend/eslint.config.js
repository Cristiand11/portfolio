const globals = require('globals');
const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Aplica as configurações recomendadas pelo ESLint
  js.configs.recommended,
  prettierConfig,

  {
    // Aplica estas regras a todos os arquivos .js e .mjs
    files: ['**/*.js'],

    languageOptions: {
      // Define as variáveis globais disponíveis no ambiente
      globals: {
        ...globals.node, // Variáveis do Node.js (require, module, process, etc.)
      },
      // Define a versão do ECMAScript (JavaScript)
      ecmaVersion: 2022,
      sourceType: 'commonjs', // Ou 'commonjs' se você estiver usando 'require'
    },

    // Aqui você pode adicionar suas regras personalizadas
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-var': 'error',
      'no-trailing-spaces': 'error',
    },
  },
];
