var gulp = require('gulp');

global.gulp = {};
global.gulp.config = require('./.gulp/config.js');
global.gulp.base = process.cwd().replace(/\\/g,"/");
global.gulp.path = global.gulp.base+"/.gulp";

gulp.task('build',require('./.gulp/Build/Build'));

gulp.task('watch',require('./.gulp/Watch/Watch'));

gulp.task('test',require('./.gulp/Test/Test'));

gulp.task('default',require('./.gulp/Default/Default'));