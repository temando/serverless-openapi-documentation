module.exports = {
  "verbose": true,
  "rootDir": ".",
  "preset": "ts-jest",
  "coverageDirectory": ".coverage",
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/build/",
    "d.ts"
  ],
  "coverageThreshold": {
    "global": {
      "lines": 5
    },
  }
}
