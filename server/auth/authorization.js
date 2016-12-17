var User = require('../api/user/userModel');
var Hairdresser = require('../api/hairdresser/hairdresserModel');

var _ = require('lodash');

exports.isAuthenticated = function (req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect("/login");
    }
}

exports.userExist = function(req, res, next) {
    User.count({
        email: req.body.email
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            /*res.redirect("/signup");*/
            User.findOne({email:req.body.email}, function(err,user){
                res.status("301").send(_.omit(user,['password','hash','salt'])); //find a way to drop the password property before send the user account to the client

            });
        }
    });
}

exports.hairdresserExist = function(req, res, next) {
    Hairdresser.count({
        email: req.body.email
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            /*res.redirect("/signup");*/
            Hairdresser.findOne({email:req.body.email}, function(err,hairdresser){
                res.status("301").send(_.omit(hairdresser,['password','hash','salt'])); //find a way to drop the password property before send the user account to the client

            });
        }
    });
}
