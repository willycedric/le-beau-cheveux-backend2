var User = require('../api/user/userModel');
var _ = require('lodash');
var logger = require('./logger')
,hash = require('./hash');

logger.log('Seeding the Database');

var buildUsers = function(password){
  return new Promise(function(resolve, reject){
    hash(password, function(err, salt,hash){
      if (err) reject(err);
       var users =[
          {email: 'Jimmylo@lebeaucheveu.com', password: 'test',salt:salt,hash:hash,role:'Client'},
          {email: 'Xoko@lebeaucheveu.com', password: 'test',salt:salt,hash:hash,role:'Manager'},
          {email: 'katamon@lebeaucheveu.com', password: 'test',salt:salt,hash:hash,role:'Admin'}
        ];
      resolve(users);
    });
  });
};

/*var users = buildUsers('test').then(function success(userList){
  console.log(userList);
}, function err(err){
  console.error(err);
});*/

var createDoc = function(model, doc) {
  //logger.log(doc);
  return new Promise(function(resolve, reject) {
    new model(doc).save(function(err, saved) {
      return err ? reject(err) : resolve(saved);
    });
  });
};

var cleanDB = function() {
  logger.log('... cleaning the DB');
  var cleanPromises = [User]
    .map(function(model) {
      return model.remove().exec();
    });
  return Promise.all(cleanPromises);
};
var tempUser=[];


var createUsers = function(data) {
  buildUsers('test').then(
    function(users){
        var promises = users.map(function(user){
          return createDoc(User, user);
        });
      return Promise.all(promises)
        .then(function(users){
          return _.merge({users: users}, data || {});
        });
    }, function(err){
      logger.erro(err);
    });

};


cleanDB()
  .then(createUsers)
  .then(logger.log.bind(logger))
  .catch(logger.log.bind(logger));
