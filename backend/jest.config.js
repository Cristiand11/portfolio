module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**', // Ignora configs
    '!src/routes/**', // Ignora routes
  ],
  coverageDirectory: 'coverage',
};