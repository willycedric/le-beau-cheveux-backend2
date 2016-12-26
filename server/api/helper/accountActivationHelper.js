var config = require('../../config/config'),
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
var sendActivationEmail = function(user,req, next){  
  async.waterfall([
      function(done){
        crypto.randomBytes(20, function(err,buf){
          var token = buf.toString('hex');
          done(err,token);
        });
      },
      function(token,done){
               
          if(!user){
            //req.flash('error','No account with that email address exits.');
            console.log('No account with that email address exists');
            return next(err);
          }
          //console.log('user found ',user);
          user.resetPasswordToken =token;
          user.resetPasswordExpires=Date.now()+(3600000*24);// 24 hours
          user.save(function(err){
            done(err,token,user);
          });
      },
      function(token, user, done){
        var from_email = new helper.Email('lebeaucheveu@market.com');
        var to_email = new helper.Email(user.email);
        var subject="Vérification de votre adresse mail";
        var content =new helper.Content('text/plain','Vous recevez cet email parce que vous venez de créer un nouveau compte sur lebeaucheveu.com \n\n' +
          'Veuillez cliquer sur le lien ci-dessous pour activer votre compte:\n\n' +
           req.headers.origin + '/#/accountactivation/'+user.role+'/' + token + '\n\n' +
          'Si vous n\'êtes pas à l\'origine de cet émail, merci de l\'ignorer. \n');
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
var activateUserAccount = function(Model, req, res,next){
    Model.findOne({resetPasswordToken:req.body.token, resetPasswordExpires:{$gt:Date.now()}}, function(err,user){
      if(err) return next(err);
      else if(!user){
          res.json({error:'Account activation token is invalid or has expired.'});
      }else{
        if(user.accountstatus === 0){
          user.accountstatus =1; //set the user account to active and save the user 
          user.save(function(err,saved){
            if(err){
              return next(err);
            }else if(saved){
              res.status(202).json({success:true});
            }
          });
        }else{
          res.status(202).json({success:true});
        }        
      }
    });
};

module.exports = {
	activate:activateUserAccount,
	send:sendActivationEmail
};