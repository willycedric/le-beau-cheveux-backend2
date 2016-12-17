var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Message schema
var MessageSchema = new Schema ({
    message : String,
    date : { type : Date, default : Date.now() },
    read:{type:Boolean, default:false}
});

/*var CustomerMessageSchema = new Schema ({
    user : { type : Schema.ObjectId, ref : 'UserSchema' },
    notification : { type : Schema.ObjectId, ref : 'MessageSchema' },
    read : { type : Boolean, default : false }
});*/

module.exports = mongoose.model('message', MessageSchema);
