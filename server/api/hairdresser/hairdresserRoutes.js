var router = require('express').Router();
var logger = require('../../util/logger');
var controller = require('./hairdresserController');
var Auth = require('../../auth/authorization');
var Hairdresser = require('./hairdresserModel');
var config = require('./../../config/config');


module.exports = function(passport){
	router.param('id', controller.params);
	router.get('/me',passport.authenticate('hairdresser-jwt'), controller.me);
	router.post('/me',passport.authenticate('hairdresser-local'), controller.login);
	router.get("/auth/facebook", passport.authenticate("facebook",{ scope : "email"}));
	router.get("/auth/facebook/callback",passport.authenticate("facebook",{successRedirect:'/api/hairdressers/login',
failureRedirect:'/api/hairdressers/failure'}));
	router.get('/failure', controller.failure);
	router.get('/login', controller.facebookLogin);
	router.get('/',controller.get);
	router.post('/hairdresserAppointmentId', passport.authenticate('hairdresser-jwt'), controller.getAppointmentById);
	router.put('/hairdresserupdatebooking', passport.authenticate('hairdresser-jwt'), controller.hairdresserUpdateBooking)
	router.put('/updateappointmentstatewithreason', passport.authenticate('user-jwt'), controller.updateAppointmentStateWithReason)
	router.put('/updateappointmentstate', passport.authenticate('hairdresser-jwt'), controller.updateAppointmentState)
	router.post('/forgot', controller.forgot);
	router.post('/reset',controller.reset); 
	router.post('/updatePassword',controller.updatePassword);
	router.post('/',Auth.hairdresserExist,controller.post);
	router.post('/findHairdressers', controller.findHairdressers);
	router.get('/logout',passport.authenticate('hairdresser-jwt'),controller.logout);
	router.get('/test', controller.getAWeek);
	router.post('/isAvailable',controller.isAvailable);
	router.post('/activate',controller.activateUserAccount);
	router.post('/isUsernameAvailable',controller.isUsernameAvailable);
    router.put('/hairdresserAppointment',passport.authenticate('user-jwt'),controller.updateAppointmentSchema);
    router.put('/lockedHairdressertimeslot',passport.authenticate('hairdresser-jwt'),controller.lockedHairdressertimeslot);
    router.delete('/hairdresserupdatebooking', passport.authenticate('hairdresser-jwt'), controller.hairdresserDeleteAppointment)
    router.delete('/hairdresserbooking', passport.authenticate('hairdresser-jwt'), controller.hairdresserDeleteBooking)
	router.route('/:id',passport.authenticate('hairdresser-jwt'))
		.get(controller.getOne)
		.put(controller.put)
		.delete(controller.delete);
	return router;

};