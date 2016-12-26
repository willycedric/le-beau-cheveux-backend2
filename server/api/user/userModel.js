var mongoose = require('mongoose');
var Schema = mongoose.Schema
,hash = require('../../util/hash')
,logger=require('../../util/logger');
var bcrypt = require('bcrypt');


var appointmentSchema = new Schema({
  selectedHour:{
    type:String
  },
  dayOfWeek:{
    type:Date
  },
  haidresserId:{
    type:Schema.Types.ObjectId
  },
  hairdresserUsername:{
    type:String
  },
  //describe the appointment progression
  appointmentState:{
    type:Number,
    default:-1,//-1 -> empty,0 -> pending, 1 -> done,-2 --> cancel by the hairdresser, -3 --> cancel by the customer.
    min:-3,
    max:0
  },
  createdAt:{
    type:Date
  },
  updateAt:{
    type:Date
  },
  location:{
    type:String
  }
});

//User can have many locations
var locationSchema = new Schema({
  type:{
    type:String
  },
  address:{
    type:String
  },
  city:{
    type:String
  },
  zipcode:{
    type:String
  }
});

//Related users
var relatedSchema = new Schema({
  _id:{
    type:Schema.Types.ObjectId
  },
  name:{
    type:String
  },
  role:{
    type:String
  }

});

//products purchased by the user
var productSchema = new Schema ({
  _id:{
    type:Schema.Types.ObjectId,
  },
  purchasedAt:Date
})
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
//Common user schema, the properties used depend on the user role (1 -> hairdresser, 2-> customer, 0->administrator)
var UserSchema = new Schema({
    lastname:{
      type:String
    },
    firstname:{
      type:String
    },
    username:{
      type:String,
      unique:true
    },
    lastconnection:{
    type:Date,
    default:Date.now
  },
  accountstatus:{
    type:Number,
    max:1,
    default:0//1-> Active, 0-> deactivated
  },
    role: {
    type: Number, min:0, max:2,
    default: 2 //0 -> Admin, 1 -> Hairdresser, 2->customer
  },
    email: {
      type: String,
      lowercase:true,
      unique: true
    },
    password: {
      type: String
    },
    
    dateOfBirth:{
      type:Date
    },
    photoUrl:{
      type:String
    },
    locations:[locationSchema],
    nextAppointment:[appointmentSchema],
    notifications:[NotificationSchema],
    salt: String,
    hash: String,
    facebook:{
      id:       String,
      email:    String,
      name:     String,
      gender:   String
    },
    google:{
      id:       String,
      email:    String,
      name:     String,
    },
    resetPasswordToken:String,
    resetPasswordExpires:Date
});

UserSchema.statics.signup = function(user,done){
  User=this;
  logger.log("Inside the signup method");
  var User = this;
  hash(user.password, function(err, salt, hash){
    if(err) throw err;
    // if (err) return done(err);
    User.create({
      firstname:user.firstname,
      lastname:user.lastname,
      username:user.username,
      email : user.email,
      customerAppointment:user.customerAppointment,
      role:user.role,
      password:User.encryptPassword(user.password),
      salt : salt,
      hash : hash
    }, function(err, user){
      if(err) throw err;
      // if (err) return done(err);
      done(null, user);
    });
  });
}


UserSchema.statics.isValidUserPassword = function(username, password, done) {
  this.findOne({username : username}, function(err, user){
    // if(err) throw err;
    if(err) return done(err);
    if(!user) return done(null, false, { message : 'Incorrect username.' });
    hash(password, user.salt, function(err, hash){
      if(err) return done(err);
      if(hash == user.hash) return done(null, user);
      done(null, false, {
        message : 'Incorrect password'
      });
    });
  });
};

// Create a new user given a profile
UserSchema.statics.findOrCreateOAuthUser = function(profile, done){
  var User = this;

  // Build dynamic key query
  var query = {};
  query[profile.authOrigin + '.id'] = profile.id;

  // Search for a profile from the given auth origin
  User.findOne(query, function(err, user){
    if(err) throw err;

    // If a user is returned, load the given user
    if(user){
      //console.log('user ',user);
      done(null, user);
    } else {
      // Otherwise, store user, or update information for same e-mail
      User.findOne({ 'email' : profile.emails[0].value }, function(err, user){
        if(err) throw err;

        if(user){
          // Preexistent e-mail, update
         
          user[''+profile.authOrigin] = {};
          user[''+profile.authOrigin].id = profile.id;
          user[''+profile.authOrigin].email = profile.emails[0].value;
          user[''+profile.authOrigin].name = profile.displayName;
          user[''+profile.authOrigin].gender = profile.gender;

          user.save(function(err, user){
            if(err) throw err;
            done(null, user);
          });
        } else {
          // New e-mail, create
           console.log('facebook profile ',profile.photos[0].value);
          // Fixed fields
          user = {
            email : profile.emails[0].value,
            firstname : profile.displayName.split(" ")[0],
            lastname : profile.displayName.replace(profile.displayName.split(" ")[0] + " ", ""),
            username:profile.displayName,
            photoUrl:profile.photos[0].value
          };

          // Dynamic fields
          user[''+profile.authOrigin] = {};
          user[''+profile.authOrigin].id = profile.id;
          user[''+profile.authOrigin].email = profile.emails[0].value;
          user[''+profile.authOrigin].name = profile.displayName;
          user[''+profile.authOrigin].gender = profile.gender;

          User.create(
            user,
            function(err, user){
              if(err) throw err;
              done(null, user);
            }
          );
        }
      });
    }
  });
}
// hash the passwords
UserSchema.statics.encryptPassword =function(plainTextPword) {
    if (!plainTextPword) {
      return ''
    } else {
      var salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(plainTextPword, salt);
    }
  };

UserSchema.methods = {
  toJson: function(user) {
    var obj = this.toObject()
    delete obj.password;
    delete obj.hash;
    delete obj.salt;
    delete obj.__v;
    return obj;
  },
  // check the passwords on signin
  authenticate: function(plainTextPword) {
    return bcrypt.compareSync(plainTextPword, this.password);
  }
  
};

//create an index on the user role
UserSchema.index({role:1,type:-1});//compound index at the schema level
UserSchema.index({username:1,type:-1});//compound index at the schema level
UserSchema.on('Index', function(err){
  console.err('From ProductSchema on Index creation ', err);
});
module.exports = mongoose.model('user', UserSchema);
