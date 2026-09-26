const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

// Expo's defaults already make Metro monorepo-aware: they watch the root
// node_modules and every workspace package (packages/domain among them) and
// resolve from both node_modules folders. expo-doctor flags a watchFolders that
// drops any of those defaults, so this only adds to them.
config.resolver.extraNodeModules = {
  '@fitlog/domain': path.resolve(workspaceRoot, 'packages/domain/src'),
};
module.exports = config;
