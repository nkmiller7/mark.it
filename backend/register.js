const { register } = require('tsconfig-paths');

register({
  baseUrl: __dirname + '/dist',
  paths: { '@/*': ['*'] }
});
