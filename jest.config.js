module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['jest-dom/extend-expect', '@testing-library/react/cleanup-after-each'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
