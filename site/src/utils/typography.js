const Typography = require('typography');
const theme = require('typography-theme-noriega').default;
const CodePlugin = require('typography-plugin-code').default;

theme.plugins = [new CodePlugin()];

theme.overrideThemeStyles = () => ({
  a: {
    color: '#003c88',
    textDecoration: 'none'
  }
});

module.exports = new Typography(theme);
