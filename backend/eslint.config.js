const globals = require('globals');
const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    // Lista de padrões de arquivos/pastas para o ESLint ignorar globalmente
    ignores: ['**/*.test.js', '**/*.spec.js', 'tests/**'],
  },

  // Aplica as configurações recomendadas pelo ESLint
  js.configs.recommended,
  prettierConfig,

  {
    // Aplica estas regras a todos os arquivos .js
    files: ['**/*.js'],

    languageOptions: {
      // Define as variáveis globais disponíveis no ambiente
      globals: {
        ...globals.node, // Variáveis do Node.js (require, module, process, etc.)
        ...globals.jest, // Adiciona globais do Jest (describe, it, expect) caso algum arquivo de teste escape
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
