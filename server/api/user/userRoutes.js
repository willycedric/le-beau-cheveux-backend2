var logger = require('../../util/logger');
var controller = require('./userController');
var router = require('express').Router();
var Auth = require('../../auth/authorization');
var config = require('./../../config/config');
var User = require('./userModel');

// setup boilerplate route just to satisfy a request
// for building
// 
// 


module.exports = function(passport){
	router.param('id',controller.params);
	router.get('/me',passport.authenticate('user-jwt'), controller.me);
	router.post('/me',passport.authenticate('user-local'), controller.login);
	router.get("/auth/facebook", passport.authenticate("facebook",{ scope : "email"}));
	router.get("/auth/facebook/callback",passport.authenticate("facebook",{successRedirect:'/api/users/login',
failureRedirect:'/api/users/failure'}));
	router.get('/failure', controller.failure);
	router.put('/hairdresserAppointment',passport.authenticate('user-jwt'),controller.updateAppointmentSchema);
	router.put('/updatecustomerpreference',passport.authenticate('user-jwt'), controller.updateCustomerPreference)
	router.put('/me', passport.authenticate('user-jwt'), controller.updateUserProfile)
	router.put('/updatecustomernotification',passport.authenticate('user-jwt'), controller.updateCustomerNotification)	
	router.put('/hairdresserAppointmentUpdate',passport.authenticate('hairdresser-jwt'),controller.updateAppointmentState);
	router.put('/updateappointmentstate',passport.authenticate('user-jwt'),controller.customerUpdateAppointmentState);
	router.put('/updateappointmentstatewithreason',passport.authenticate('hairdresser-jwt'),controller.updateAppointmentStateWithReason);
	router.delete('/removeCustomerAppointmentAndNotify',passport.authenticate('hairdresser-jwt'),controller.removeCustomerAppointmentAndNotify);
	router.delete('/removeappointmentwithreason',passport.authenticate('hairdresser-jwt'),controller.removeCustomerAppointmentWithReason);
	router.get('/login', controller.facebookLogin);
	router.get('/',controller.get);
	router.post('/forgot', controller.forgot);
	router.post('/reset',controller.reset);
	router.post('/updatePassword',controller.updatePassword);
	router.post('/getUserById', passport.authenticate('hairdresser-jwt'), controller.getUserById);
	router.post('/',Auth.userExist,controller.post);
	router.get('/logout',passport.authenticate('user-jwt'),controller.logout);
	router.post('/isAvailable',controller.isAvailable);
	router.route('/:id',passport.authenticate('user-jwt'))
		.get(controller.getOne)
		.put(controller.put)
		.delete(controller.delete);
	return  router;
};