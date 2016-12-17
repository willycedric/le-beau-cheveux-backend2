var router = require('express').Router();
// api router will mount other routers
// for all our resources


module.exports = function(passport){
	router.use('/users',require('./user/userRoutes')(passport));
	router.use('/hairdressers', require('./hairdresser/hairdresserRoutes')(passport));
	router.use('/posts', require('./post/postRoutes'));
	router.use('/products', require('./product/productRoutes'));

	return router;
};


//module.exports = router;
