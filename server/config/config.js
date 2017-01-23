var _ = require('lodash');

var config = {
  dev: 'development',
  test: 'testing',
  prod: 'production',
  port: process.env.PORT || 3000,
  // 10 days in minutes
  expireTime: 24 * 60 * 10,
  secrets: {
    jwt: process.env.JWT || 'M54H8YFGUI0QS4BSHBDJTC3RJ6LS4ZC30V7P1KKFC3EZBRK1T5DGQB20MQT8RVFZIQG5XL6YVWQBASNP2OZ8ICT4D3ZB25NYMRY9'
  },
  app: {
      name: 'Lebeaucheveu'
    },
    facebook: {
      clientID: "1657107441282962",
      clientSecret: "f9445d8043eddd5903473544ff3bb822",
      callbackURL: "http://localhost:3000/api/users/auth/facebook/callback"
    },

    google: {
      clientID: "{{PLACEHOLDER}}",
      clientSecret: "{{PLACEHOLDER}}",
      callbackURL: "{{PLACEHOLDER}}"
    },
    sendgrid:{
      key:"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"
    }
};

process.env.NODE_ENV = process.env.NODE_ENV || config.dev;
config.env = process.env.NODE_ENV;

var envConfig;
// require could error out if
// the file don't exist so lets try this statement
// and fallback to an empty object if it does error out
try {
  envConfig = require('./' + config.env);
  // just making sure the require actually
  // got something back :)
  envConfig = envConfig || {};
} catch(e) {
  envConfig = {};
}

// merge the two config files together
// the envConfig file will overwrite properties
// on the config object
module.exports = _.merge(config, envConfig);
