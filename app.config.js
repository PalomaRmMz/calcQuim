module.exports = ({ config }) => {
  const testing = process.env.CALCQUIM_BUILD_VARIANT === 'tests';
  const qa = process.env.CALCQUIM_BUILD_VARIANT === 'revisionqa';
  return {
    ...config,
    name: qa ? 'Nexo · Ventas' : testing ? 'Nexo · Ventas' : config.name,
    android: { ...config.android, package: qa ? `${config.android.package}.revisionqa` : testing ? `${config.android.package}.pruebas` : config.android.package, ...(qa ? {versionCode:1} : {}) },
    plugins: [...(config.plugins || []), './plugins/withLocalHttp'],
  };
};
