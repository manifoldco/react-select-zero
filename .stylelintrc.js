module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-prettier'],
  plugins: ['stylelint-order'],
  rules: {
    'declaration-colon-newline-after': null, // let Prettier decide (when to put values on a new line new line)
    'property-no-vendor-prefix': null, // some properties need vendor prefixes
    'value-list-comma-newline-after': null, // let Prettier decide (when to put comma separated values on new lines)
  },
};
