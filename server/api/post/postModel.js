var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  
  author: {
    type: Schema.Types.ObjectId, 
    ref: 'user'
  },
  text:{
    type:String
  },
  createdAt:{
    Type:Date
  }
});

var PostSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },

  body: {
    type: String,
    required: true
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  lastUpadtedAt:{
    type:Date,
    default:Date.now
  }
  //comments:[CommentSchema],

  //author: {type: Schema.Types.ObjectId, ref: 'user'},

  //categories: [{type: Schema.Types.ObjectId, ref: 'category'}]
});

module.exports = mongoose.model('post', PostSchema);
