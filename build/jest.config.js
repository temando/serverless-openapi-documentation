module.exports = {
  "verbose": true,
  "transform": { ".(ts|tsx)": "<rootDir>/node_modules/ts-jest/preprocessor.js" },
  "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  "moduleFileExtensions": [ "ts", "tsx", "js" ],
  "coverageDirectory": ".coverage",
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/build/",
    "d.ts"
  ]
}
