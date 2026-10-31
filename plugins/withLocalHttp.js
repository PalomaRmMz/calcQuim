const { withAndroidManifest } = require('expo/config-plugins');
// El servidor Express local utiliza HTTP; las URLs admitidas por la app se restringen a la red privada.
module.exports = config => withAndroidManifest(config, result => {
  const app = result.modResults.manifest.application?.[0];
  if (app) app.$['android:usesCleartextTraffic'] = 'true';
  return result;
});
