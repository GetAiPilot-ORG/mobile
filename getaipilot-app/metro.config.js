const fs = require('fs');
const os = require('os');

// Windows file-handle safeguard: Graceful FS and Promise retry to prevent EMFILE crashes
try {
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);

  const wrapPromise = (fn) => {
    return async function (...args) {
      let attempts = 0;
      while (true) {
        try {
          return await fn.apply(this, args);
        } catch (err) {
          if ((err.code === 'EMFILE' || err.code === 'ENFILE') && attempts < 10) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, attempts * 50));
            continue;
          }
          throw err;
        }
      }
    };
  };

  if (fs.promises) {
    if (fs.promises.open) fs.promises.open = wrapPromise(fs.promises.open);
    if (fs.promises.readFile) fs.promises.readFile = wrapPromise(fs.promises.readFile);
  }
} catch {
  // safe fallback
}

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Limit concurrent workers on Windows to avoid bursting file handles
config.maxWorkers = Math.max(1, Math.min(4, os.cpus().length - 1));

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

