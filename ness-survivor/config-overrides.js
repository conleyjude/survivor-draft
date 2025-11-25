module.exports = function override(config, env) {
  // Add fallback for node core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "path": require.resolve("path-browserify"),
    "crypto": false,
    "stream": false,
    "fs": false,
    "os": false
  };

  return config;
};