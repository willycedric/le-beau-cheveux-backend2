var mongoose = require('mongoose');
var Schema = mongoose.Schema
,logger=require('../../util/logger');

/**
 * Product dimension schema
 * @type {Schema}
 */
var dimensionSchema = new Schema({
	width:{
		type:Number
	},
	height:{
		type:Number
	},
	depth:{
		type:Number
	}	
});

/**
 * Product shipping informations
 * @type {Schema}
 */
var shippingSchema = new Schema({
	weight:{
		type:String
	},
	dimensions:dimensionSchema,

});

/**
 * Product prince schema
 * @type {Schema}
 */
var pricingSchema = new Schema({
	retail:{ //normal retail price
		type:Number
	},
	retailOnDiscount:{ //retail during solde
		type:Number
	},
	savings:{ //price which will be saved by the customer
		type:Number
	},
	pct_savings:{ //saving percentage
		type:Number
	}
});

/**
 * product details schema
 * @type {Schema}
 */
var detailSchema = new Schema({
	shortDescription:{
		type:String
	},
	sizes: {                                                                                                                                                                                                          
	    type:Array                                                                                                                                                                                                        
	  },
	  color:{
	  	type:String
	  }
});
/**
 * Product schema
 * @type {Schema}
 */
var ProductSchema = new Schema({                                                                                                                                                                                    
	   sku: {                                                                                                                                                                                                            
	    type: Number                                                                                                                                                                                                    
	  },                                                                                                                                                                                              
	  kind: {                                                                                                                                                                                                           
	    type: String                                                                                                                                                                                                    
	  },                                                                                                                                                                                                                
	  title: {                                                                                                                                                                                                          
	    type: String                                                                                                                                                                                                    
	  },	                                                                                                                                                                                                                                                                                                                                                                                                                            
	  shipping:shippingSchema,
	  pricing:pricingSchema,                                                                                                                                                                                                                                                                                                                                                                                                             
	  details:detailSchema,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
	  description: {                                                                                                                                                                                                    
	    type: String                                                                                                                                                                                                    
	  },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
	  imageUrl: {                                                                                                                                                                                                         
	    type: Array                                                                                                                                                                                                        
	  }                                                                                                                                                                                                                                                                                                                                                                                                                      
}); 

/**
 *  the following query returns all products with a discount greater than (discount)%,
sorted by descending percentage discount
 * @param  {[type]} discount [discount value]
 * @return {[type]}          [products]
 */
ProductSchema.statics.productWithAParticularDiscount = function(discount){
	 var Product = this;
	 Product.find({'pricing.pct_savings':{$gt:discount}}, function(err,Products){
	 	if(err){
	 		throw err;
	 	}else{
	 		return Products.sort([('pricing.pct_savings',-1)]);
	 	}
	 });
	
};

//create an index on the pricing.pct_savings field in order to ensure the query 1
ProductSchema.index({'pricing.pct_savings':1,type:-1});//compound index at the schema level
ProductSchema.on('Index', function(err){
	console.err('From ProductSchema on Index creation ', err);
});
module.exports = mongoose.model('product',ProductSchema);            