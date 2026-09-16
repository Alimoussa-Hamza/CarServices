const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;

// pnpm: force Metro to the app-local symlink (Expo Go + monorepo)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@stripe/stripe-react-native': path.resolve(
    projectRoot,
    'node_modules/@stripe/stripe-react-native',
  ),
};

module.exports = config;
