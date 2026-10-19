const fs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(fs);

const nodeFs = require('node:fs');
try {
  gracefulFs.gracefulify(nodeFs);
} catch (e) {
  // ignore
}

// Windows EMFILE / concurrency guard for fs.promises
['open', 'readFile'].forEach((method) => {
  const orig = fs.promises[method];
  if (typeof orig === 'function') {
    const wrapped = async function (...args) {
      let retries = 5;
      while (true) {
        try {
          return await orig.apply(this, args);
        } catch (err) {
          if ((err?.code === 'EMFILE' || err?.code === 'ENFILE') && retries > 0) {
            retries--;
            await new Promise((resolve) => setTimeout(resolve, 50 * (6 - retries)));
          } else {
            throw err;
          }
        }
      }
    };
    fs.promises[method] = wrapped;
    if (nodeFs && nodeFs.promises) {
      nodeFs.promises[method] = wrapped;
    }
  }
});

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Limit worker threads on Windows to prevent file descriptor exhaustion
config.maxWorkers = 2;

const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
  ? [config.resolver.blockList]
  : [];

config.resolver.blockList = [
  ...defaultBlockList,
  /.*[/\\]\.git[/\\].*/,
  /.*[/\\]Getaipilot-bff[/\\].*/,
  /.*[/\\]android[/\\].*/,
  /.*[/\\]state[/\\].*/,
];

module.exports = withNativeWind(config, { input: './src/global.css' });

