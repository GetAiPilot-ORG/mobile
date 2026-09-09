const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Preserve default blocklist and add project-specific ignore patterns
const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
  ? [config.resolver.blockList]
  : [];

config.resolver.blockList = [
  ...defaultBlockList,
  /.*\.git\/.*/,
  /.*\.tmp$/,
  /.*~\$/,
  /.*\.gemini\/.*/,
  /.*\.expo\/.*/,
];

module.exports = config;
