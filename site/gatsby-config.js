const path = require('path');
const typography = require('./src/utils/typography');

module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-typography',
      options: {
        pathToConfigModule: 'src/utils/typography.js'
      }
    },
    'gatsby-plugin-emotion',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'examples',
        path: path.join(__dirname, '..', 'new-examples')
      }
    },
    {
      resolve: 'examples',
      options: {
        sourceInstanceName: 'examples',
        baseCss: typography.toString()
      }
    },
    'gatsby-transformer-remark',
    'gatsby-plugin-react-next'
  ]
};
