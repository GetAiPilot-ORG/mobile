const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
  ? [config.resolver.blockList]
  : [];

config.resolver.blockList = [
  ...defaultBlockList,
  /.*[/\\]Getaipilot-bff[/\\].*/,
];

module.exports = config;
