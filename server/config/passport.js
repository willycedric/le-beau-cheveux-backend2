 var LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  ,JwtStrategy = require('passport-jwt').Strategy //need to npm install it
  ,ExtractJwt = require('passport-jwt').ExtractJwt//need to npm install it
  ,User = require('../api/user/userModel')
  ,Hairdresser = require('../api/hairdresser/hairdresserModel')
  ,config = require('./config')
  ,logger = require('./../util/logger');
  mongoose = require('mongoose');
//var app = require('express')();


module.exports = function (passport, config) {
  // Setup work and export for the JWT passport strategy
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
    opts.secretOrKey = config.secrets.jwt;


   passport.use('user-jwt',new JwtStrategy(opts, function(jwt_payload, done) {
      User.findOne({_id: jwt_payload._id}, function(err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
         
          done(null, user);
        } else {

          done(null, false);
        }
      });
    }));
     passport.use('hairdresser-jwt',new JwtStrategy(opts, function(jwt_payload, done) {
      Hairdresser.findOne({_id: jwt_payload._id}, function(err, user) {
        if (err) {
          return done(err, false);
        }
        if (user) {
         
          done(null, user);
        } else {

          done(null, false);
        }
      });
    }));

  passport.serializeUser(function(user, done) {   
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    
    User.findOne({ _id: id }, function (err, user) {
        if(err) done(err, null);
        else if(!user){
            Hairdresser.findOne({_id:id}, function(err,user){
                if(err) done(err,null);
                done(null,user);
            });
        }else{
             done(null, user);
        } 
     
    });
  });

    passport.use('user-local',new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
    function(username, password, done) {
      //logger.log(user);
      User.isValidUserPassword(username, password, done);
    }));
    
     passport.use('hairdresser-local',new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password'
    },
    function(username, password, done) {
      //logger.log(user);
      Hairdresser.isValidUserPassword(username, password, done);
    }));

  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'displayName', 'photos', 'email','gender']
    },
    function(accessToken, refreshToken, profile, done) {
      profile.authOrigin = 'facebook';
      User.findOrCreateOAuthUser(profile, function (err, user) {
        return done(err, user);
      });
    }));

  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      profile.authOrigin = 'google';
      User.findOrCreateOAuthUser(profile, function (err, user) {
        return done(err, user);
      });
    }
  ));
};
