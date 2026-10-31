module.exports = ({ config }) => {
  const testing = process.env.CALCQUIM_BUILD_VARIANT === 'tests';
  return {
    ...config,
    name: testing ? 'CalcQuim Pruebas' : config.name,
    android: { ...config.android, package: testing ? `${config.android.package}.pruebas` : config.android.package },
    plugins: [...(config.plugins || []), './plugins/withLocalHttp'],
  };
};
