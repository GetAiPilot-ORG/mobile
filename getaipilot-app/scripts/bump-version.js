#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appJsonPath = path.join(rootDir, 'app.json');
const pkgJsonPath = path.join(rootDir, 'package.json');

const type = process.argv[2] || 'patch'; // 'patch' | 'minor' | 'major' | '1.0.1'

if (!fs.existsSync(appJsonPath) || !fs.existsSync(pkgJsonPath)) {
  console.error('Error: app.json or package.json not found in root.');
  process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

const currentVersion = appJson.expo?.version || pkgJson.version || '1.0.0';
let [major, minor, patch] = currentVersion.split('.').map((n) => parseInt(n, 10) || 0);

let nextVersion = currentVersion;
if (type === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
  nextVersion = `${major}.${minor}.${patch}`;
} else if (type === 'minor') {
  minor += 1;
  patch = 0;
  nextVersion = `${major}.${minor}.${patch}`;
} else if (type === 'patch') {
  patch += 1;
  nextVersion = `${major}.${minor}.${patch}`;
} else if (/^\d+\.\d+\.\d+$/.test(type)) {
  nextVersion = type;
} else {
  console.error(`Invalid version bump type: "${type}". Use patch, minor, major, or X.Y.Z.`);
  process.exit(1);
}

// Android versionCode increment
const currentVersionCode = appJson.expo?.android?.versionCode || 1;
const nextVersionCode = currentVersionCode + 1;

// Update app.json
appJson.expo.version = nextVersion;
if (!appJson.expo.android) appJson.expo.android = {};
appJson.expo.android.versionCode = nextVersionCode;

// Update package.json
pkgJson.version = nextVersion;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');

console.log(`✅ App version updated successfully:`);
console.log(`   Version: ${currentVersion} -> ${nextVersion}`);
console.log(`   Android versionCode: ${currentVersionCode} -> ${nextVersionCode}`);

