const fs = require('fs');
const os = require('os');

// Windows file-handle safeguard: Graceful FS and Promise/Sync retry to prevent EMFILE crashes
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
          if ((err.code === 'EMFILE' || err.code === 'ENFILE') && attempts < 50) {
            attempts++;
            await new Promise((resolve) =>
              setTimeout(resolve, Math.min(200, 20 * attempts) + Math.random() * 20)
            );
            continue;
          }
          throw err;
        }
      }
    };
  };

  const wrapSync = (fn) => {
    return function (...args) {
      let attempts = 0;
      while (true) {
        try {
          return fn.apply(this, args);
        } catch (err) {
          if ((err.code === 'EMFILE' || err.code === 'ENFILE') && attempts < 50) {
            attempts++;
            const end = Date.now() + Math.min(100, 10 * attempts);
            while (Date.now() < end) { }
            continue;
          }
          throw err;
        }
      }
    };
  };

  if (fs.promises) {
    ['open', 'readFile', 'writeFile', 'stat', 'readdir', 'access'].forEach((m) => {
      if (typeof fs.promises[m] === 'function') {
        fs.promises[m] = wrapPromise(fs.promises[m]);
      }
    });
  }

  ['openSync', 'readFileSync', 'writeFileSync', 'statSync', 'readdirSync', 'accessSync'].forEach((m) => {
    if (typeof fs[m] === 'function') {
      fs[m] = wrapSync(fs[m]);
    }
  });
} catch {
  // safe fallback
}

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Limit concurrent workers on Windows to avoid bursting file handles
config.maxWorkers = 2;

const defaultBlockList = Array.isArray(config.resolver.blockList)
  ? config.resolver.blockList
  : config.resolver.blockList
    ? [config.resolver.blockList]
    : [];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const projectRoot = escapeRegExp(__dirname);

config.resolver.blockList = [
  ...defaultBlockList,
  new RegExp(`^${projectRoot}[/\\\\]dist[/\\\\].*`),
  new RegExp(`^${projectRoot}[/\\\\]android[/\\\\].*`),
  new RegExp(`^${projectRoot}[/\\\\]docs[/\\\\].*`),
  new RegExp(`^${projectRoot}[/\\\\]Getaipilot-bff[/\\\\].*`),
];

module.exports = withNativeWind(config, { input: './src/global.css' });