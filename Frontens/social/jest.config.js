module.exports = {
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest", // use babel-jest to transform JS/TS files
  },
  transformIgnorePatterns: [
    "/node_modules/(?!axios)/", // optionally transform specific node_modules
  ],
  testEnvironment: "jsdom", // necessary for React components
};
