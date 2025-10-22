module.exports = {
  "testEnvironment": "node",
  "moduleFileExtensions": [
    "js",
    "ts"
  ],
  "testMatch": [
    "**/__tests__/**/*.spec.js",
    "**/__tests__/**/*.spec.ts"
  ],
  "coverageReporters": [
    "text",
    "lcov"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/tests/setupTests.js"
  ],
  "preset": "ts-jest"
};