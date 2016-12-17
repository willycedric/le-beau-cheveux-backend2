var gulp    = require('gulp');
var path    = require('path');
var yargs   = require('yargs').argv;
var tpl     = require('gulp-template');
var rename  = require('gulp-rename');

/*
map of paths for using with the tasks below
 */
var paths = {
  blankTemplates: 'templates/model/*.**',
};

// helper funciton
var resolveToComponents = function(glob){
  glob = glob || '';
  return path.join('server/api', glob); // server/api/{glob}
};


/*
simple task to copy over needed files to dist
 */
gulp.task('copy', function() {
  return gulp.src(paths.toCopy, { base: 'client' })
    .pipe(gulp.dest(paths.dest));
});

/**
 * [use to create new angular component]
 * @param  {[type]} ){                      var    cap                            [description]
 * @param  {[type]} parentPath [description]
 * @param  {[type]} name);                   return gulp.src(paths.blankTemplates)                 .pipe(tpl({      name: name,      upCaseName: cap(name)    }))    .pipe(rename(function(path){      path.basename [description]
 * @return {[type]}            [description]
 */
gulp.task('model', function(){
  var cap = function(val){
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  var name = yargs.name;
  var parentPath = yargs.parent || '';
  var destPath = path.join(resolveToComponents(), parentPath, name);

  return gulp.src(paths.blankTemplates)
    .pipe(tpl({
      name: name,
      upCaseName: cap(name)
    }))
    .pipe(rename(function(path){
      path.basename = path.basename.replace('model', name);
    }))
    .pipe(gulp.dest(destPath));
});

/*gulp.task('default', function(done) {
  sync('build', 'copy','serve', 'watch', done)
});*/
