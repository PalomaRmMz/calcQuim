const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
// QA web sources and transient Vite caches are independent of the native bundle.
config.resolver.blockList = [config.resolver.blockList].flat().filter(Boolean).concat(/[\\/]qa[\\/].*/, /[\\/]\.artifacts[\\/].*/);

module.exports = withNativeWind(config, { input: './global.css' })