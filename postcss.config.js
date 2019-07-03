const postcssPresetEnv = require('postcss-preset-env');
const cssnano = require('cssnano');

module.exports = {
  plugins: [
    postcssPresetEnv({
      features: {
        'custom-media-queries': true,
        'nesting-rules': true,
      },
    }),
    cssnano(),
  ],
};
