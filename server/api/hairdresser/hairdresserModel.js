var mongoose = require('mongoose');
var Schema = mongoose.Schema
,hash = require('../../util/hash')
,logger=require('../../util/logger');
var bcrypt = require('bcrypt');

//Schema containing informations about customer who have made an reservation
var RelatedCustomerSchema  = new Schema({
    customerUsername:{ //The customer name
      type:String
    },
    customerFirstname:{
      type:String
    },
    customerLastname:{
      type:String
    },
    customerLocation:{
      type:String
    },
    createdAt:{
        type: Date //appointment creation date
    },
    updatedAt:{
        type:Date//appointment update date
    }
});

//user notifications schema 
var NotificationSchema = new Schema ({
    title:{
      type:String,
      default:'Rendez vous supprimé'
    },
    message : {
      type:String
    },
    date : { type : Date, default : Date.now() },
    read:{type:Boolean, default:false}
});

//Hairdresser appointmentSchema;
var HairdresserAppointmentSchema = new Schema({   
  slotTime:{ //appointment hours (in the hairdresser's opening hour list)
    type:String
  },
  //Used to check is the slot is already taken
  slotType:{ 
    type:Number,
    default:1 //1 --> Free, 0 --> already taken, -1 -->locked by the hairdresser
  },
  //describe the appointment progression
  slotState:{
    type:Number,
    default:0,//0 -> empty,-1 -> pending, 1 -> done,-2 --> cancel by the hairdresser, -3 --> cancel by the customer
    min:-3,
    max:1
  },
  dayOfWeek:{
    type:Date
  },
relatedCustomers:RelatedCustomerSchema,//customer with an appointment
createdAt:{ //appointment creatioon date
  type:Date
},
updateAt:{ //appointment update date
  type:Date
}
});


var bookingSchema = new Schema({
  customerId:{
    type:Schema.Types.ObjectId
  },
  customerLastname :{
    type:String
  },
  customerFirstname:{
    type:String
  },
  appointmentDate:{
    type:Date
  },
  appointmentHour:{
    type:String
  },
  appointmentLocation:{
    type:String
  },
  appointmentState:{
    type:Number,
    Max:1,
    Min:-3
  }
});


var HairdresserSchema = new Schema({
  description:{
  	type:String,
	lowercase:true,
  },
  categories:[String],
  paiementInfo:{
  	number:Number,
  	cvc:Number,
  	exp_month:Number,
  	exp_year:Number,
  },
  gallery_pictures:[String],
  customer_type:{
  	type:Number,
  	min:0,
 	max:2,
 	default:1
  },
  nextbookings:[bookingSchema],
  appointments:[HairdresserAppointmentSchema],
  listOfPerformance:[String],
  profile_picture:[String],
  accountstatus:{
    type:Number,
    max:1,
    default:0//1-> Active, 0-> deactivated
  },
  lastconnection:{
    type:Date,
    default:Date.now
  },
  notifications:[NotificationSchema],
    lastname:{
      type:String,
     lowercase:true,
    },
    firstname:{
      type:String,
     lowercase:true
    },
    rating:{
      type:Number
    },
    username:{
      type:String,
     lowercase:true,
     unique:true
    },
 	email: {
      type: String,
      lowercase:true
    },
    password: {
      type: String
    },
    role: {
    type: Number, min:0, max:2,
    default: 1 //0 -> Admin, 1 -> Hairdresser, 2->customer
  },
  activityArea:{ //Array of area covered by the hairdresser
    type:Array
  },
  areaPostCode:{
    type:Array
  },
 	salt: String,
    hash: String,
    facebook:{
      id:       String,
      email:    String,
      name:     String,
      gender:   String
    },
    resetPasswordToken:String,
    resetPasswordExpires:Date
});

HairdresserSchema.statics.signup = function(hairdresser,done){
  var User = this;
  hash(hairdresser.password, function(err, salt, hash){
    if(err) throw err;
    // if (err) return done(err);
    User.create({
      firstname:hairdresser.firstname,
      lastname:hairdresser.lastname,
      username:hairdresser.username,
      email : hairdresser.email,
      appointments:hairdresser.appointments,
      password:User.encryptPassword(hairdresser.password),
      salt : salt,
      hash : hash
    }, function(err, hairdresser){
      if(err) throw err;
      // if (err) return done(err);
      done(null, hairdresser);
    });
  });
}


HairdresserSchema.statics.isValidUserPassword = function(username, password, done) {
  this.findOne({username : username}, function(err, hairdresser){
    // if(err) throw err;
    if(err) return done(err);
    if(!hairdresser) return done(null, false, { message : 'Incorrect hairdressername.' });
    hash(password, hairdresser.salt, function(err, hash){
      if(err) return done(err);
      if(hash == hairdresser.hash) return done(null, hairdresser);
      done(null, false, {
        message : 'Incorrect password'
      });
    });
  });
};

// Create a new hairdresser given a profile
HairdresserSchema.statics.findOrCreateOAuthUser = function(profile, done){
  var User = this;

  // Build dynamic key query
  var query = {};
  query[profile.authOrigin + '.id'] = profile.id;

  // Search for a profile from the given auth origin
  User.findOne(query, function(err, hairdresser){
    if(err) throw err;

    // If a hairdresser is returned, load the given hairdresser
    if(hairdresser){
      //console.log('hairdresser ',hairdresser);
      done(null, hairdresser);
    } else {
      // Otherwise, store hairdresser, or update information for same e-mail
      User.findOne({ 'email' : profile.emails[0].value }, function(err, hairdresser){
        if(err) throw err;

        if(hairdresser){
          // Preexistent e-mail, update
         
          hairdresser[''+profile.authOrigin] = {};
          hairdresser[''+profile.authOrigin].id = profile.id;
          hairdresser[''+profile.authOrigin].email = profile.emails[0].value;
          hairdresser[''+profile.authOrigin].name = profile.displayName;
          hairdresser[''+profile.authOrigin].gender = profile.gender;

          hairdresser.save(function(err, hairdresser){
            if(err) throw err;
            done(null, hairdresser);
          });
        } else {
          // New e-mail, create
           console.log('facebook profile ',profile.photos[0].value);
          // Fixed fields
          hairdresser = {
            email : profile.emails[0].value,
            firstname : profile.displayName.split(" ")[0],
            lastname : profile.displayName.replace(profile.displayName.split(" ")[0] + " ", ""),
            username:profile.displayName,
            profile_picture:profile.photos[0].value
          };

          // Dynamic fields
          hairdresser[''+profile.authOrigin] = {};
          hairdresser[''+profile.authOrigin].id = profile.id;
          hairdresser[''+profile.authOrigin].email = profile.emails[0].value;
          hairdresser[''+profile.authOrigin].name = profile.displayName;
          hairdresser[''+profile.authOrigin].gender = profile.gender;

          User.create(
            hairdresser,
            function(err, hairdresser){
              if(err) throw err;
              done(null, hairdresser);
            }
          );
        }
      });
    }
  });
}
/**
 * [encryptPassword description]
 * @param  {[type]} plainTextPword [description]
 * @return {[type]}                [description]
 */
HairdresserSchema.statics.encryptPassword =function(plainTextPword) {
    if (!plainTextPword) {
      return ''
    } else {
      var salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(plainTextPword, salt);
    }
  };
/**
 * [methods description]
 * @type {Object}
 */
HairdresserSchema.methods = {
  toJson: function(hairdresser) {
    var obj = this.toObject()
    delete obj.password;
    delete obj.hash;
    delete obj.salt;
    delete obj.__v;
    delete obj.areaPostCode;
    return obj;
  },
  // check the passwords on signin
  authenticate: function(plainTextPword) {
    return bcrypt.compareSync(plainTextPword, this.password);
  }
  
};

//create an index on the hairdresser name
HairdresserSchema.index({hairdressername:1,type:-1});//compound index at the schema level
HairdresserSchema.on('Index', function(err){
  console.err('From HairdresserSchema on Index creation ', err);
});

module.exports = mongoose.model('hairdresser', HairdresserSchema);