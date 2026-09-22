/** Expo's babel preset — required by Metro and by jest-expo. */
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
