const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const isExpoGo = !process.env.EAS_BUILD && !process.env.EXPO_DEV_CLIENT_NETWORK;

const config = getDefaultConfig(projectRoot);

if (isExpoGo) {
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@react-native-google-signin/google-signin') {
      return {
        filePath: path.resolve(projectRoot, 'src/platform/google-signin.stub.ts'),
        type: 'sourceFile',
      };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

// Watch all packages in the monorepo
config.watchFolders = [workspaceRoot];

// Resolve packages from workspace root first, then project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add CSS to source extensions for Expo 58 CSS modules support
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

// Disable CSS modules in development (workaround for @expo/log-box issue)
config.resolver.assetExts = [...config.resolver.assetExts.filter(ext => ext !== 'css')];

// Use turbo cache directory
config.cacheStores = [
  new FileStore({ root: path.join(projectRoot, '.metro-cache') }),
];

module.exports = config;
