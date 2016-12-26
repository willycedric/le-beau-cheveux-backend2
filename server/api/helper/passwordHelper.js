var hash = require('../../util/hash'),
config = require('../../config/config'),
async = require('async'),
crypto = require('crypto'),
helper = require('sendgrid').mail;
/**
 * [forgot description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
var forgot = function(Model,req,res,next){  
  async.waterfall([
      function(done){
        crypto.randomBytes(20, function(err,buf){
          var token = buf.toString('hex');
          done(err,token);
        });
      },
      function(token,done){
               Model.findOne({username:req.body.username}, function(err,user){
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
           req.headers.origin + '/#/forgot/'+user.role+'/' + token + '\n\n' +
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
var reset = function(Model, req, res,next){
    Model.findOne({resetPasswordToken:req.body.token, resetPasswordExpires:{$gt:Date.now()}}, function(err,user){
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
var updatePassword = function(Model,req, res,next){     
  async.waterfall([
      function(done){
        Model.findOne({resetPasswordToken:req.body.token,resetPasswordExpires:{$gt:Date.now()}},function(err,user){
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

module.exports = {
  forgot : forgot,
  reset :reset,
  updatePassword:updatePassword
};
