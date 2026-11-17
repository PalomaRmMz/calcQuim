const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
// QA web sources and transient Vite caches are independent of the native bundle.
config.resolver.blockList = [config.resolver.blockList].flat().filter(Boolean).concat(/[\\/]qa[\\/].*/, /[\\/]\.artifacts[\\/].*/);

// SDK56 Metro expects a newer file-map event than NativeWind4 virtual modules emit.
// In isolated QA, use the supported file output path instead of private Metro hooks.
module.exports = withNativeWind(config, { input: './global.css', forceWriteFileSystem: process.env.EXPO_PUBLIC_CALCQUIM_QA === '1' })