var morgan = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var override = require('method-override');
var cookieParser = require('cookie-parser')
,session = require('express-session')
,methodOverride = require('method-override');
 // setup global middleware here

module.exports = function(app,passport){
  app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cors());
  app.set('etag',false); //Use to resolve the issue https://bugs.chromium.org/p/chromium/issues/detail?id=633696
  app.use(override());
  app.use(cookieParser());
  app.use(session(
  	{ 
  		secret: 'keyboard cat',
   		resave:false,
   		saveUninitialized:false
	}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(methodOverride());
};
