var express = require('express');
var app = express();
var mongoose= require('mongoose');
var config = require('./config/config');
var logger = require('./util/logger');
var auth = require('./auth/routes');
var passport = require('passport')
,User = require('./api/user/userModel')
,Hairdresser = require('./api/hairdresser/hairdresserModel');
mongoose.Promise = require('bluebird'); //custom mongoose promise librairy 

require('./config/passport')(passport,config);
var api = require('./api/api')(passport);

//console.log(app.request.originalUrl);
// db.url is different depending on NODE_ENV
//console.log(config.db.url);
////In production mode we must set tge autoIndex to false
mongoose.connect(config.db.url,{ config: { autoIndex: true } });
if (config.seed) {
  require('./util/seed');
}else{
	logger.log("Seeding is inactive");
}
//console.log(app.request);
// setup the app middlware
require('./middleware/appMiddleware')(app,passport);
// setup the api
app.use('/api',api);
    
app.use('/auth', auth);
// set up global error handling

app.use(function(err, req, res, next) {
  // if error thrown from jwt validation check
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('Invalid token');
    return;
  }
  logger.error(err.stack);
  res.status(500).send('Oops');
});

// export the app for testing
module.exports = app;

