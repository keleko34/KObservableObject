var gulp = require('gulp')
  , prompt = require('gulp-prompt')
  , inject = require('gulp-inject')
  , sort = require('sort-stream')
  , replace = require('gulp-replace')
  , file = require('gulp-file')
  , closureCompiler = require('gulp-closure-compiler')
  , fs = require('fs');

var settings = global.gulp,
    ignore = settings.config.ignore,
    builds = fs.readdirSync(settings.base).filter(function(file){
        return (fs.statSync(settings.base+"/"+file).isDirectory() && ignore.indexOf(file) === -1);
    });

module.exports = function()
{
    gulp.src('*')
    .pipe(prompt.prompt({
        type: 'list',
        name: 'Component',
        message: 'Which module would you like to build?',
        choices:builds
    },function(res){
        fs.stat('./'+res.Component+'/'+res.Component+'.js',function(err,stats){
            if(!err && stats.isFile())
            {
                console.log('\033[36mStarting to compile module:\033[37m',res.Component);
                var ignorePath = ['./'+res.Component+'.js','./Build/'+res.Component+'.js','./Min/'+res.component+'.min.js'],
                    subFiles = gulp.src(['./'+res.Component+'/**/*.js']).pipe(sort(function(a,b){
                        return 1;
                    })),
                    reD = /(define)(.*)(function\()(.*)(\))(.*)(?:{)/,
                    reE = /\}\)(?![\s\S]*}\))/m;

                gulp.src('./'+res.Component+'/'+res.Component+'.js')
                .pipe(inject(subFiles,{
                    relative:true,
                    starttag: '/* BUILD SECTION */',
                    endtag: '/* END BUILD SECTION */',
                    transform: function(filepath,file,i,length)
                    {
                        if(ignorePath.indexOf('./'+filepath) !== -1)
                        {
                            console.log('\033[36mInjecting File:\033[37m',filepath);
                            var contents = file.contents.toString('utf8'),
                                re = /(function Create)(.*)(\()/;
                            var module = 'Create'+re.exec(contents)[2];

                            contents = contents.replace(reE,"}());");
                            contents = contents.replace(reD,"var "+module+" = (function(){");
                            return contents;
                        }
                        else
                        {
                            return "";
                        }
                    },
                    ignorePath:ignorePath
                }))
                .pipe(replace(reE,"}())"))
                .pipe(replace(reD,("var Create"+res.Component+" = (function(){")))
                .pipe(gulp.dest('./'+res.Component+'/Build'));

                console.log('\033[36mRunning clojure compiler minification:\033[37m');
                gulp.src('./'+res.Component+'/Build/'+res.Component+'.js')
                .pipe(closureCompiler({
                    compilerPath:"./compiler.jar",
                    fileName:res.Component+".min.js"
                }))
                .pipe(gulp.dest('./'+res.Component+'/Min'));
            }
            else
            {
                console.error('\033[31mYour missing a main js file by the same name:\033[37m ',res.Component);
            }
        });
    }));
}