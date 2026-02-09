module.exports = {
  collectCoverage: true,
  coverageReporters: ["text", "cobertura"],
  testPathIgnorePatterns: ["<rootDir>/build/"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
