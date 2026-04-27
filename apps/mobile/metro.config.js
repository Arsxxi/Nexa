const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..'); // Naik 2 tingkat ke Root Monorepo

const config = getDefaultConfig(projectRoot);

// 1. Pantau semua file di monorepo
config.watchFolders = [workspaceRoot];

// 2. Cari modul di node_modules mobile DAN root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Pastikan Metro memprioritaskan paket yang ada di workspace
config.resolver.disableHierarchicalLookup = true;

module.exports = config;