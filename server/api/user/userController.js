var User = require('./userModel');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var helper = require('sendgrid').mail;
var crypto = require('crypto'),
  async = require('async');
var signToken = require('../../auth/auth').signToken
, logger = require('./../../util/logger'),
moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var hash = require('../../util/hash'),
config = require('../../config/config');

/**
 * [params description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @param  {[type]}   id   [description]
 * @return {[type]}        [description]
 */
exports.params = function(req, res, next, id) {
    logger.log('inside the user params');
  User.findById(id)
    .select('-password')
    .exec()
    .then(function(user) {
      if (!user) {
        next(new Error('No user with that id'));
      }else{
        req.user = user;
        next();
      }
    }, function(err) {
      next(err);
    });
};
/**
 * [get description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.get = function(req, res, next) {
  User.find({})
    .select('-password')
    .exec()
    .then(function(users){
      res.json(users.map(function(user){
        return user.toJson();
      }));
    }, function(err){
      next(err);
    });
};

/**
 * [getOne description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getOne = function(req, res, next) {
  var user = new User(req.user);
  //var user = req.user.toJson();
  res.json(user.toJson());
};

/**
 * [put description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.put = function(req, res, next) {
  var user = req.user;
  var update = req.body;
  _.merge(user, update);
  user.save(function(err, saved) {
    if (err) {
      next(err);
    } else {
      res.json(saved.toJson());
    }
  })
};
/**
 * [updateCustomerPreference function allowing to update customer preferences]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateCustomerPreference = function(req, res, next){
  var  customer = req.user;
  //check if the location has already been created
  
  if(req.body.location.hasOwnProperty('_id')){
    var location = req.body.location;
    var query = {   
      _id: new ObjectID(customer._id),
      locations:{
        $elemMatch:{
          _id: new ObjectID(location._id)
        }
      }
    };

    User.update(query,{
      $set:{
        "locations.$.type":location.type==1?'main':'secondary',
        "locations.$.address":location.address,
        "locations.$.city":location.city,
        "locations.$.zipcode":location.zipcode
      }
    },{
      multi:false
    }, function(err,saved){
      if(err){
        return next(err);
      }else if(saved){
        res.status(202).json({sucess:true});
      }
    });
  }else{ //create a new location object
    console.log('creation de la location ', JSON.stringify(req.body.location));
    var location = {
      type: req.body.location.type==1?'main':'secondary',
      address:req.body.location.address,
      city:req.body.location.city,
      zipcode: req.body.location.zipcode
      };
    customer.locations.push(location); 
    //save the customer profile
    customer.save(function(err,saved){
      if(err){
        return next(err);
      }else if(saved){
        res.status(202).json({success:true});
      }
    });
  }
};
/**
 * [put description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateUserProfile = function(req,res,next){
  var user = req.user;
  var update = req.body.user;
  _.merge(user, update);
  user.save(function(err, saved) {
    if (err) {
      next(err);
    } else {
      res.json(saved.toJson());
    }
  })
};

/**
 * [updateCustomerNotification Function allowing us to update a notifiaction state (read or not)]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateCustomerNotification = function(req, res, next){
  var user = req.user;
  var message = req.body.message;
  console.log('message ',message);
  var query= {
    _id:new ObjectID(user._id),
    notifications:    {
      $elemMatch:{
        _id:new ObjectID(message._id)
      } 
    }
  };

  User.update(query,{
    $set:{
      "notifications.$.read":true
    }
  },
    {
      multi:false
    },function(err,saved){
      if(err){
        return next(err);
      }else if (saved){
        res.status(202).json({success:true});
      }
    }
  );
};


/**
 * [updateAppointmentSchema Populate user appointment schema]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentSchema = function (req, res, next){
      var customer = req.user;
      customer.nextAppointment.push({
      _id:req.body.id,
      haidresserId:req.body.hairdresserId,
      selectedHour: req.body.selectedHour,
      hairdresserUsername: req.body.hairdresserUsername,
      dayOfWeek:req.body.dayOfWeek,
      createdAt:Date.now()
     });
      customer.save(function(err,saved){
      if(err){
        return next(err)
      }else{
        res.json({success:true});
      }
    });
  
};

exports.updateAppointmentState=function (req, res, next){
    var query = {
                _id : new ObjectID(req.body.customerId), 
                nextAppointment : {
                    $elemMatch : {
                        _id : new ObjectID(req.body.appointmentId)
                    }
                }
            };
    User.update(query, {
                $set : {
                    "nextAppointment.$.appointmentState" : 0,//pending (confirmed by the hairdresser and displayed in the custommer booking list)
                    "nextAppointment.$.updateAt":Date.now()
                    }
            }, {
                multi : false
            }, function(err, result){
                if(err){
                    //res.status(500).json({error:"the appointment can't be save"});
                    next(new Error("It seems to have a problem with the appointment update process ",err));
                }else if(result){
                    res.status(200).json({success:true});
                }
                
      });
};

/**
 * [removeCustomerAppointmentAndNotify delete user appointment and send a notification to the user about with deletion details]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.removeCustomerAppointmentAndNotify = function(req,res, next){
  var appointmentId = req.query.appointmentId, 
      customerId = req.query.customerId;

  User.findById(customerId,function(err, user){
    if(err){
      return next(err);
    }else if(user){
      if(user.nextAppointment.id(appointmentId) !== undefined){
        var notification = 'Votre rendez-vous du '+(currentAppointment.dayOfWeek).toLocaleDateString()+' à '+currentAppointment.selectedHour+' a été annulé par '+currentAppointment.hairdresserUsername+'. Nous vons prions de prendre un autre rendez-vous. Merci de votre compréhension.';
        user.notifications.push({message:notification});
        user.nextAppointment.id(appointmentId).remove();

        user.save(function(err,saved){
          if(err){
            return next(err);
          }else{
            res.status(202).json({success:true});
          }
        });
      }
    }
  });
};
/**
 * [removeCustomerAppointmentWithReason function allowing to remove a cionfirmed user appointment with reasons]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.removeCustomerAppointmentWithReason = function(req,res, next){
  var appointmentId = req.query.appointmentId, 
      customerId = req.query.customerId,
      hairdresserReason = req.query.reason;

  User.findById(customerId,function(err, user){
    if(err){
      return next(err);
    }else if(user){
      if(user.nextAppointment.id(appointmentId) !== undefined){
        user.notifications.push({message:hairdresserReason});
        user.nextAppointment.id(appointmentId).remove();

        user.save(function(err,saved){
          if(err){
            return next(err);
          }else{
            res.status(202).json({success:true});
          }
        });
      }
    }
  });
};
/**
 * [post description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.post = function(req, res, next) {
    logger.log('You reach the right function');
     var newUser = new User(req.body);      
     User.signup( newUser, function(err, user){
    if(err) throw err;
    req.login(user, function(err){
      if(err) return next(err);
      //res.status("200").send(JSON.stringify(_.omit(user,['password','hash','salt','__v','_id'])));
      res.status("200").send(JSON.stringify({isRegistered:true}));
    });
  });
};

/**
 * [function used to login a user through with locals credentials]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.login = function(req, res, next){  
  if(req.isAuthenticated()){    
     var token = signToken(req.user._id,req.user.role,req.user.username,req.user.firstname, req.user.lastname);
     var user = new User(req.user);
     res.json({status:"ok",token:token,user:user.toJson()});
   }else{
      res.json({status:"no",token:"",user:{}})
   } 
};

/**
 * [function used to log in a user through facebook oauth]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.facebookLogin = function(req,res,next){
  if(req.isAuthenticated()){
   var token = signToken(req.user._id,req.user.role,req.user.username);
   var user = new User(req.user);
   //console.log("facebook Login " ,user);
   res.redirect('http://192.168.0.10:4500/#/home/'+token);
  }else{
      res.redirect('http://192.168.0.10:4500/#/login');
   } 
};
/**
 * [failure description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.failure = function(req,res,next){
  req.session['failure']='facebook issue';
  res.redirect('http://192.168.0.10:4500/#/login');
};

/**
 * [delete description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.delete = function(req, res, next) {
  req.user.remove(function(err, removed) {
    if (err) {
      next(err);
    } else {
      res.json(removed.toJson());
    }
  });
};


/**
 * [me description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.me = function(req, res) {
  var user = new User(req.user);
  res.json(user.toJson());
};

/**
 * [logout description]
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.logout = function(req, res){
   if(req.session){   
       req.logout();
       res.json({message:"OK"});
   }else{
      logger.log("No session defined");
   }   
};
/**
 * 
 */

/**
 * [forgot description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.forgot = function(req,res,next){  
  async.waterfall([
      function(done){
        crypto.randomBytes(20, function(err,buf){
          var token = buf.toString('hex');
          done(err,token);
        });
      },
      function(token,done){
               User.findOne({email:req.body.email}, function(err,user){
          if(!user){
            //req.flash('error','No account with that email address exits.');
            console.log('No account with that email address exists');
            return next(err);
          }
          //console.log('user found ',user);
          user.resetPasswordToken =token;
          user.resetPasswordExpires=Date.now()+3600000;//1 hour
          user.save(function(err){
            done(err,token,user);
          });
        });
      },
      function(token, user, done){
        var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(user.email);
        var subject="mot de passe oublié";
        var content =new helper.Content('text/plain','You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
           req.headers.origin + '/#/forgot/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n');
        var mail = new helper.Mail(from_email,subject,to_email,content);

        var sg = require('sendgrid')(config.sendgrid.key);
        var request = sg.emptyRequest({
          method:'POST',
          path:'/v3/mail/send',
          body:mail.toJSON(),
          'Content-Length':Buffer.byteLength(mail)
        });

        sg.API(request,function(err,response){
          /*console.log("statusCode ",response.statusCode);
          console.log("body ",response.body);
          console.log("headers ",response.headers);*/
          if(err) return next(err);
          done(err,null);
        });
      }
    ], function(err){
        if(err) {
            return next(err);     
        }else{
          res.status(202).json({success:true});
        }   
    });  
};

/**
 * 
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.reset = function(req, res,next){
    User.findOne({resetPasswordToken:req.body.token, resetPasswordExpires:{$gt:Date.now()}}, function(err,user){
      if(err) return next(err);
      else if(!user){
          res.json({error:'Password reset token is invalid or has expired.'});
      }else{
        res.json({passworsToken:req.body.token});
      }
    });
};

/**
 * [updatePassword description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updatePassword = function(req, res,next){     
  async.waterfall([
      function(done){
        User.findOne({resetPasswordToken:req.body.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
          if(err)return next(err);
          else if(!user){
            res.json({error:'Password reset token is invalid or has expired.'});
          }
          //user.password= req.body.password;
          hash(req.body.password, function(err, salt, hash){
              user.password= req.body.password,
              user.salt = salt,
              user.hash = hash,
              user.resetPasswordToken=undefined;
              user.resetPasswordExpires=undefined;
              user.save(function(err,user){
              /*req.login(user,function(err){
                done(err,user);
              });*/
              done(err,user);
            });
          });        
          
        });
      },
      function(user, done){
        var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(user.email);
        var subject="nouveau mot de passe";
        var content =new helper.Content('text/plain','You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n');
        var mail = new helper.Mail(from_email,subject,to_email,content);

        var sg = require('sendgrid')(config.sendgrid.key);
        var request = sg.emptyRequest({
          method:'POST',
          path:'/v3/mail/send',
          body:mail.toJSON()
        });
        sg.API(request,function(err,response){
         /* console.log("statusCode ",response.statusCode);
          console.log("body ",response.body);
          console.log("headers ",response.headers);*/
          if(err) return next(err);
          done(null,err);
        });
      }
    ],function(err){
        if(err){
          return next(err);
        }else{
          res.status(202).json({success:true});
        }
      }
    );
};

/**
 * [Function used to check if the username entered by the user willing to register is available]
 * @param  {[type]}   req  [req object]
 * @param  {[type]}   res  [res object]
 * @param  {Function} next [middleware error handler]
 * @return {Boolean}       [description]
 */
exports.isAvailable = function (req, res, next){
    //var username = req.body.username;
    var isAvailable=true;
    User.findOne({username:req.body.username},function(err, user){
        if (err){
           return next(err);
         }else if(user){
             
            res.json({isAvailable:!isAvailable})
         }else{
            res.json({isAvailable:isAvailable})
         }        

    });
};
/**
 * Retrieve all the hairdressers
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */

exports.getAllHairdressers = function(req,res, next){
  var alreadyDisplayed = parseInt(req.query.alreadyDisplayed);
  var numberOfHairdresserPerQuery = 6;
  var query = User.find({role:1});
  User.count({role:1}, function(err, value){
      if(err){
        return next(err);
      }else if(value){
         if(alreadyDisplayed == 0){
            query.limit(numberOfHairdresserPerQuery)
         }else if(alreadyDisplayed<=value){
          query.skip(alreadyDisplayed);
          query.limit(numberOfHairdresserPerQuery);
         }
         query.exec(function(err,hairdressers){
            if(err){
              return next(err);
              }else if(hairdressers){
                res.json(hairdressers.map(function(hairdresser){
                    return hairdresser.toJson();
                }));
              }
          });
        }
    });
  
};

exports.getUserById = function (req,res,next){
  User.findById({_id: req.body.id}, function(err, user){
      if(err){
          return next(new Error("An ouccus when trying to get the user by it's Id from getUserById (err) =>", err));
      }else{
        res.status(202).json(user.toJson());
      }
  });
};


/**
 * [updateAppointmentState Function allowing to update a customer appointment state]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.customerUpdateAppointmentState = function(req,res, next){
  var customer = req.user;
  var query = {
    _id:new ObjectID(customer._id),
    nextAppointment:{
      $elemMatch:{
         _id:new ObjectID(req.body.id)//appointment id
      }
    }
  };

  User.update(query,{
    $set:{
      "nextAppointment.$.appointmentState":req.body.state
    }
  },{
    multi:false
  }, function(err, saved){
      if(err){
        return next(err);
      }else if(saved){
        res.status(202).json({success:true});
      }
  });
};

/**
 * [updateAppointmentStateWithReason Function used to set an appointment state with reason]
 * @param  {[type]}   res  [description]
 * @param  {[type]}   req  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentStateWithReason = function(req, res, next){
  var hairdresser = req.user;
  async.waterfall([
    function(callback){
      User.findById({_id:req.body.customerId}, function(err, customer){
        if(err){
          return next(err);
        }else if(customer){
          customer.notifications.push({message:req.body.reason});
          callback(null,customer);
        }
      })
    }, function(customer,callback){
        if(customer){
          var query = {
            _id:new ObjectID(customer._id),
            nextAppointment:{
              $elemMatch:{
                _id: new ObjectID(req.body.id)//appointment id
              }
            }
          };
          User.update(query, {
            $set:{
              "nextAppointment.$.appointmentState":req.body.state //-2 --> canceled by the hairdresser
            }
          },{
            multi:false
          }, function(err,saved){
              if(err){
                return next(err);
              }else if(saved){
                callback(null,saved);
              }
          });
        }
    },
    function(saved){
      res.status(202).json({success:true});
    }
  ]);

};