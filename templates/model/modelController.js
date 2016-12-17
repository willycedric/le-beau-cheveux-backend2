var <%= upCaseName %> = require('./<%= name %>Model');
var _ = require('lodash');

exports.params = function(req, res, next, id) {
  <%= upCaseName %>.findById(id)
    .then(function(<%= name %>) {
      if (!<%= name %>) {
        next(new Error('No <%= name %> with that id'));
      } else {
        req.<%= name %> = <%= name %>;
        next();
      }
    }, function(err) {
      next(err);
    });
};

exports.get = function(req, res, next) {
  <%= upCaseName %>.find({})
    .then(function(<%= name %>s){
      res.json(<%= name %>s);
    }, function(err){
      next(err);
    });
};

exports.getOne = function(req, res, next) {
  var <%= name %> = req.<%= name %>;
  res.json(<%= name %>);
};

exports.put = function(req, res, next) {
  var <%= name %> = req.<%= name %>;

  var update = req.body;

  _.merge(<%= name %>, update);

  <%= upCaseName %>.save(function(err, saved) {
    if (err) {
      next(err);
    } else {
      res.json(saved);
    }
  })
};

exports.post = function(req, res, next) {
  var new<%= name %> = req.body;

  <%= upCaseName %>.create(new<%= name %>)
    .then(function(<%= name %>) {
      res.json(<%= name %>);
    }, function(err) {
      next(err);
    });
};

exports.delete = function(req, res, next) {
  req.<%= name %>.remove(function(err, removed) {
    if (err) {
      next(err);
    } else {
      res.json(removed);
    }
  });
};
