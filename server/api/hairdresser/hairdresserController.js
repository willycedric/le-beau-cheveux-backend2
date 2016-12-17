var Hairdresser = require('./hairdresserModel');
var _ = require('lodash');
var nodemailer = require('nodemailer');
var helper = require('sendgrid').mail;
var crypto = require('crypto'),
async = require('async');
var signToken = require('../../auth/auth').signToken
, logger = require('./../../util/logger'),
moment = require('moment');
var ObjectID = require('mongodb').ObjectID;


/**
 * [params description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @param  {[type]}   id   [description]
 * @return {[type]}        [description]
 */
exports.params = function(req,res,next,id){
     Hairdresser.findById(id,function(err,hairdresser) {
        if(err){
          next(err);
        }
        else if (!hairdresser) {
          next(new Error('No project with that id'));
        } else {
          req.hairdresser = hairdresser;
          next();
        }
      });
};
/**
 * [get description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.get = function(req,res, next){
  var alreadyDisplayed = parseInt(req.query.alreadyDisplayed);
  var numberOfHairdresserPerQuery = 6;
  var query = Hairdresser.find();
  Hairdresser.count({}, function(err, value){
      if(err){
        return next(err);
      }else if(value){
         if(alreadyDisplayed === 0){
            query.limit(numberOfHairdresserPerQuery);
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

/**
 * [getOne description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getOne = function(req, res, next) {
  var hairdresser = new Hairdresser(req.hairdresser);
  //var hairdresser = req.hairdresser.toJson();
  res.json(hairdresser.toJson());
};

/**
 * [put description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.put = function(req, res, next) {
    var hairdresser = req.hairdresser;   
    var update = req.body.user;
    delete hairdresser.categories;
    delete hairdresser.activityArea;
    delete hairdresser.listOfPerformance;
    delete hairdresser.areaPostCode;
    delete hairdresser.description;
    hairdresser.categories = req.body.user.categories;
    hairdresser.activityArea = req.body.user.activityArea;
    hairdresser.description = req.body.user.description;
    req.body.user.activityArea.forEach(function(area){
      hairdresser.areaPostCode.push(area[0]+area[1]);
    });    
    hairdresser.listOfPerformance = req.body.user.listOfPerformance;
  _.merge(hairdresser, update);
     hairdresser.save(function(err, saved) {
        if (err) {
          next(err);
        } else {
          res.json(saved.toJson());
        }
  });
};

/**
 * [updateAppointmentSchema description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentSchema = function(req,res,next){
   //req.user contains customer information 
   Hairdresser.findById(req.body.hairdresserId, function(err,hairdresser){
      if(err){
        return next(err);
      }else{
        var newAppointment = {
          slotTime:req.body.selectedHour,
          dayOfWeek:req.body.dayOfWeek,
          slotType:0, //temporally
          createdAt:Date.now(),
          relatedCustomers:{
            _id:req.user._id,
            customerLastname:req.user.lastname,
            customerFirstname:req.user.firstname,
            customerUsername:req.user.username,
            createdAt:Date.now()
          }
        }; 
        //populate the hairdresser appointment array
        hairdresser.appointments.push(newAppointment);
        //update the hairdresser modal 
        hairdresser.save(function(err,saved){
          if(err){
            return next(err);
          }else{
            res.json(saved.appointments[saved.appointments.length-1]._id);
          }
        });
      }
   });
};

/**
 * [lockedHairdressertimeslot Allow an hairdresser to locked a date&time period]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.lockedHairdressertimeslot = function(req,res,next){
  var hairdresser = req.user;
  
  hairdresser.lockedDays.push(req.body.date);
  hairdresser.save(function(err,saved){
          if(err){
            return next(err);
          }else if(saved){
            res.status(202).json({success:true});
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
     var newHairdresser = new Hairdresser(req.body);
     Hairdresser.signup( newHairdresser, function(err, hairdresser){
    if(err) {return next(err);}
    req.login(hairdresser, function(err){
      if(err) return next(err);
      res.status("200").send(JSON.stringify({isRegistered:true}));
    });
  });
};

/**
 * [function used to login a hairdresser through with locals credentials]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.login = function(req, res, next){  
  if(req.isAuthenticated()){ 
     var token = signToken(req.user._id,req.user.role,req.user.username,req.user.firstname,req.user.lastname);
     var hairdresser = new Hairdresser(req.user);
     res.json({status:"ok",token:token,hairdresser:hairdresser.toJson()});
   }else{
      res.json({status:"no",token:"",hairdresser:{}});
   } 
};
/**
 * [function used to log in a hairdresser through facebook oauth]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.facebookLogin = function(req,res,next){
  if(req.isAuthenticated()){
   var token = signToken(req.hairdresser._id,req.hairdresser.role,req.hairdresser.username);
   var hairdresser = new Hairdresser(req.hairdresser);
   //console.log("facebook Login " ,hairdresser);
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
  req.hairdresser.remove(function(err, removed) {
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
  var hairdresser = new Hairdresser(req.user);
  res.json(hairdresser.toJson());
};

/**
 * [logout description]
 * @param  {[type]} req [description]lastconnection
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
        Hairdresser.findOne({email:req.body.email}, function(err,hairdresser){
          if(!hairdresser){
            //req.flash('error','No account with that email address exits.');
            console.log('No account with that email address exists');
            return next(err);
          }
          //console.log('hairdresser found ',hairdresser);
          hairdresser.resetPasswordToken =token;
          hairdresser.resetPasswordExpires=Date.now()+3600000;//1 hour
          hairdresser.save(function(err){
            done(err,token,hairdresser);
          });
        });
      },
      function(token, hairdresser, done){
        var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(hairdresser.email);
        var subject="mot de passe oublié";
        var content =new helper.Content('text/plain','You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
           req.headers.origin + '/#/forgot/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n');
        var mail = new helper.Mail(from_email,subject,to_email,content);

        var sg = require('sendgrid')("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");
        var request = sg.emptyRequest({
          method:'POST',
          path:'/v3/mail/send',
          body:mail.toJSON()
        });
        sg.API(request,function(err,response){
          /*console.log("statusCode ",response.statusCode);
          console.log("body ",response.body);
          console.log("headers ",response.headers);*/
          if(err) return next(err);
        });
      }
    ], function(err){

        if(err) return next(err);
        
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
    Hairdresser.findOne({resetPasswordToken:req.body.token, resetPasswordExpires:{$gt:Date.now()}}, function(err,hairdresser){
      if(err) return next(err);
      else if(!hairdresser){
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
        Hairdresser.findOne({resetPasswordToken:req.body.token,resetPasswordExpires:{$gt:Date.now()}},function(err,hairdresser){
          if(err)return next(err);
          else if(!hairdresser){
            res.json({error:'Password reset token is invalid or has expired.'});
          }
          hairdresser.password= req.body.password;
          hairdresser.resetPasswordToken=undefined;
          hairdresser.resetPasswordExpires=undefined;
          hairdresser.save(function(err){
            req.login(hairdresser,function(err){
              done(err,hairdresser);
            });
          });
        });
      },
      function(hairdresser, done){
        var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(hairdresser.email);
        var subject="nouveau mot de passe";
        var content =new helper.Content('text/plain','You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'This is a confirmation that the password for your account ' + hairdresser.email + ' has just been changed.\n');
        var mail = new helper.Mail(from_email,subject,to_email,content);

        var sg = require('sendgrid')("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");
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
        });
      }
    ],function(err){
        if(err) return next(err);
      }
    );
};

/**
 * [Function used to check if the hairdressername entered by the hairdresser willing to register is available]
 * @param  {[type]}   req  [req object]
 * @param  {[type]}   res  [res object]
 * @param  {Function} next [middleware error handler]
 * @return {Boolean}       [description]
 */
exports.isAvailable = function (req, res, next){
    //var hairdressername = req.body.hairdressername;
    var isAvailable=true;
    Hairdresser.findOne({username:req.body.username},function(err, hairdresser){
        if (err){
           return next(err);
         }else if(hairdresser){
         
            res.json({isAvailable:!isAvailable});
         }else{
            res.json({isAvailable:isAvailable});
         }        

    });
};

/**
 * [isUsernameAvailable description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {Boolean}       [description]
 */
exports.isUsernameAvailable = function (req, res, next){
    //var hairdressername = req.body.hairdressername;
    var isAvailable=true;
    Hairdresser.findOne({username:req.body.username},function(err, hairdresser){
        if (err){
           return next(err);
         }else if(hairdresser){
          if(hairdresser.username === req.body.username){
             res.json({isAvailable:isAvailable});
          }else{
            res.json({isAvailable:!isAvailable});
          } 
            
         }else{
            res.json({isAvailable:isAvailable});
         }       
    });
};

/**
 * [getAWeek description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getAWeek = function(req, res, next){
  var query = Hairdresser.find();
  query.skip(0).limit(1);
  query.exec(function(err, hairdresser){
    if(err){
      return next(err);
    }else if(hairdresser){
      res.json(hairdresser[0].customerAppointment.forEach(function(apt){
          //console.log(apt.dayOfWeek);
      }));
    }
  });
};

/**
 * [getAppointmentById Function allowing to get appointment by is Id]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.getAppointmentById = function(req, res, next){
    var hairdresser = req.user;
    var appointment = hairdresser.appointments.id(req.body.appointmentId);
    if(appointment){
      res.status(202).json(appointment);
    }else{
      res.status(404);
    }
};

/**
 * [hairdresserUpdateBooking description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.hairdresserUpdateBooking = function(req,res, next){
    var hairdresser = req.user;
    var query = {
                _id : new ObjectID(hairdresser._id), 
                appointments : {
                    $elemMatch : {
                        _id : new ObjectID(req.body.id)
                    }
                }
            };
      hairdresser.nextbookings.push({_id:req.body.id,customerId:req.body.relatedCustomer._id,customerLastname:req.body.relatedCustomer.customerLastname, customerFirstname:req.body.relatedCustomer.customerFirstname, appointmentHour:req.body.time,
      appointmentDate:req.body.date,appointmentLocation:req.body.relatedCustomer.customerLocation,appointmentState:-1});

      hairdresser.save(function(err){
        if(err){
          return next(err);
        }else{
          res.json({success:true});
        }          
      });
     
     Hairdresser.update(query, {
                $set : {
                    "appointments.$.slotState" : -1,
                    "appointments.$.updateAt":Date.now()
                    }
            }, {
                multi : false
            }, function(err, result){
                if(err){
                    //res.status(500).json({error:"the appointment can't be save"});
                    next(new Error("It seems to have a problem with the appointment registration process ",err));
                }else if(result){
                    //res.status(200).json(result);
                }
                
      });
};
/**
 * [hairdresserDeleteAppointment remove an appointment based on it's id]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.hairdresserDeleteAppointment = function(req,res,next){
  var hairdresser = req.user;
  hairdresser.appointments.id(req.query.id).remove();
  hairdresser.save(function(err,saved){
    if(err){
      return next(err);
    }else{
      res.status(202).json({success:true});
    }
  });
};
/**
 * [hairdresserDeleteBooking remove a booking based on it's id]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.hairdresserDeleteBooking = function(req,res,next){
  var hairdresser = req.user;

  //update the appointment state to 1 --> done
  var query = {
    _id:new ObjectID(hairdresser._id),
    appointments:{
      $elemMatch:{
        _id: new ObjectID(req.query.id)
      }
    }
  };

  Hairdresser.update(query,{
    $set:{
      "appointments.$.slotState":1
    }
  },{
    multi:false
  }, function(err,saved){
    if(err){
      return next(err);
    }
  });
  //remove the appointment of the nextbookings document
  hairdresser.nextbookings.id(req.query.id).remove();

  hairdresser.save(function(err,saved){
    if(err){
      return next(err);
    }else{
      res.status(202).json({success:true});
    }
  });
};
/**
 * [findHairdressers return a list of hairdressers matching the search criteria]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.findHairdressers =  function(req, res, next){
  var location = req.body.location;
  var category = req.body.category;
  var haircut = req.body.haircut;
  var listOfAvailableCategories=['cheveux afro','cheveux lisses',"cheveux bouclés"];

  var listOfAvailableCurlyHaircuts = ["Vanilles",
                                      "Tresses (Braids)",
                                      "Crochet braids",
                                      "Tissages",
                                      "Locks ",
                                      "Coiffures sur cheveux naturels ",
                                      "Lissages (Brushing, Défrisage)",
                                      "Extensions de cheveux ",
                                      "Colorations",
                                      "Perruque / Lace wig",
                                      "Shampoing",
                                      "Nattes collées",
                                      "Cornrows",
                                      "Tresses enfants"];

  async.waterfall([
    function(callback){   //build list of hairdresser in the selected location
      //console.log('inside the first one');
        var listOfLocatedHairdressers=[];
        Hairdresser.find({}, function(err, hairdressers){
          if(err){
            return next (new Error('An error occured when tempting to find all hairdressers'));
          }else if(!hairdressers){
            console.error('no available hairdressers');
          }else{
              hairdressers.forEach(function(hairdresser){  //build the list of hairdresser in the selected area
                  if(hairdresser.areaPostCode.indexOf(location)!=-1){
                   listOfLocatedHairdressers.push(hairdresser);
                  }
              });
            callback(null,listOfLocatedHairdressers);
          }
        });
    
  },
  function(listOfLocatedHairdressers,callback){ //build list of hairdresser with the appropeiate category;
      var listOfLocatedAndCategorisedHairdressers=[];

      listOfLocatedHairdressers.forEach(function(hairdresser){
        if(hairdresser.categories.indexOf(listOfAvailableCategories[parseInt(category)])!=-1){
          listOfLocatedAndCategorisedHairdressers.push(hairdresser);
        };
      });
      callback(null,listOfLocatedAndCategorisedHairdressers);
  },
  function(listOfLocatedAndCategorisedHairdressers,callback){ //build list of hairdressers who are able to perform the haircut selected
    var listOfSelectedHairdressers=[];
    listOfLocatedAndCategorisedHairdressers.forEach(function(hairdresser){
      if(hairdresser.listOfPerformance.indexOf(listOfAvailableCurlyHaircuts[parseInt(haircut)])!=-1){
        listOfSelectedHairdressers.push(hairdresser);
      }
    });
    callback(null,listOfSelectedHairdressers);
  },
  function(listOfSelectedHairdressers){
      res.json(listOfSelectedHairdressers.map(function(hairdresser){
        return hairdresser.toJson();
      }))
    }
  ]);  
}

/**
 * [updateAppointmentStateWithReason Function used to set an appointment state with reason]
 * @param  {[type]}   res  [description]
 * @param  {[type]}   req  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentStateWithReason = function(req, res, next){
  var customer = req.user;
  async.waterfall([
    function(callback){
      Hairdresser.findById({_id:req.body.hairdresserId}, function(err, hairdresser){
        if(err){
          return next(err);
        }else if(hairdresser){
          hairdresser.notifications.push({message:req.body.reason});
          callback(null,hairdresser);
        }
      })
    }, function(hairdresser,callback){
        if(hairdresser){
          var query = {
            _id: new ObjectID(hairdresser._id),
            nextbookings:{
              $elemMatch:{
                _id:new ObjectID(req.body.id) //appointment id
              }
            }
          };
          Hairdresser.update(query, {
            $set:{
              "nextbookings.$.appointmentState":req.body.state
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

/**
 * [updateAppointmentState function allowing to update an appointment state]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
exports.updateAppointmentState = function(req,res,next){
  var hairdresser= req.user;
  var query = {
            _id:hairdresser._id,
            nextbookings:{
              $elemMatch:{
                _id:req.body.id //appointment id
              }
            },
            appointments:{
              $elemMatch:{
                 _id:req.body.id //appointment id
              }
            }
          };
          Hairdresser.update(query, {
            $set:{
              "nextbookings.$.appointmentState":req.body.state,
              "appointments.$.slotState":req.body.state
            }
          },{
            multi:false
          }, function(err,saved){
              if(err){
                return next(err);
              }else if(saved){
                res.status(202).json({success:true});
              }
          });
}
