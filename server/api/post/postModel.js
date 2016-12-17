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

  text: {
    type: String,
    required: true
  },
  createdAt:{
    type:Date
  },
  lastUpadtedAt:{
    type:Date
  },
  comments:[CommentSchema],

  author: {type: Schema.Types.ObjectId, ref: 'user'},

  categories: [{type: Schema.Types.ObjectId, ref: 'category'}]
});

module.exports = mongoose.model('post', PostSchema);
