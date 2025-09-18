const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
  // Aplica as configurações recomendadas pelo ESLint
  js.configs.recommended,

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
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-unused-vars': ['warn', { 'args': 'none' }] // Avisa sobre variáveis não usadas
    },
  }
];