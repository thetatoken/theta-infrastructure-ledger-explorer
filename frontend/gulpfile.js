let gulp = require('gulp'),
  sass = require('gulp-sass')(require('sass')),
  cssnano = require('gulp-cssnano'),
  prefixer = require('gulp-autoprefixer'),
  webpack = require("webpack-stream"),
  compiler = require('webpack'),
  gulpClean = require("gulp-clean");
let browserSync = require('browser-sync').create()
let webPackConfig = require('./webpack.config.js');
const revCollector = require('gulp-rev-collector');
const hash = require('gulp-hash');

let buildMode = 'development';
const DEV = 'development';
const PROD = 'production';

let paths = {
  sass_start: './src/styles/styles.scss',
  sass_dest: './public/css',
  sass_watch: './src/styles/**/*.scss',

  js_start: './src/index.jsx',
  js_dest: './public/',
  js_watch: ['./src/**/*.jsx', './src/**/*.js'],

  clean: ['./public/js/', './public/css/'],
  sassCache: "/tmp/sass-cache"
};

let displayError = error => {

  // Initial building up of the error
  var errorString = '[' + error.plugin + ']';
  errorString += ' ' + error.message.replace("\n", ''); // Removes new line at the end

  // If the error contains the filename or line number add it to the string
  if (error.fileName)
    errorString += ' in ' + error.fileName;

  if (error.lineNumber)
    errorString += ' on line ' + error.lineNumber;

  // This will output an error like the following:
  // [gulp-sass] error message in file_name on line 1
  console.error(errorString);
  return errorString;
};

const setBuildMode = mode => done => {
  buildMode = mode;
  done();
}

const buildSASS = done => {
  return stream = gulp.src(paths.sass_start)
    .pipe(sass())
    .on("error", async (err) => {
      displayError(err);
      done();
    })
    .pipe(cssnano())
    //
    .pipe(hash())
    .pipe(gulp.dest(paths.sass_dest))
    .pipe(hash.manifest('css.json', {
      deleteOld: true,
      sourceDir: paths.sass_dest,
      destDir: paths.sass_dest
    }))
    //
    .pipe(gulp.dest(paths.sass_dest))
    .pipe(browserSync.stream());
}

const buildJS = done => {
  webPackConfig.mode = buildMode;
  return gulp.src(paths.js_start)
    .pipe(webpack(webPackConfig, compiler))
    .pipe(gulp.dest(paths.js_dest))
    .pipe(browserSync.stream());
}

const clean = done => {
  return gulp.src(paths.clean, { read: false, allowEmpty: true })
    .pipe(gulpClean({ allowEmpty: true }))
    .on("error", async (err) => {
      displayError(err);
    });
}

const sync = done => {
  browserSync.init({
    proxy: "https://localhost:4000"
  });
  done();
}

const reload = done => {
  browserSync.reload();
  done();
};

const watch = done => {
  gulp.watch(paths.sass_watch, gulp.series(buildSASS));
  gulp.watch(paths.js_watch, gulp.series(buildJS));
  done();
};

const replaceCSSHash = done => {
  return gulp.src(['public/css/css.json', 'public/**/*.html'])
    .pipe(revCollector({
      replaceReved: true
    }))
    .pipe(gulp.dest('public'));
}

gulp.task('default', gulp.series(setBuildMode(DEV), clean, sync, buildSASS, buildJS, replaceCSSHash, watch));
gulp.task('build-dev', gulp.series(setBuildMode(DEV), clean, buildSASS, buildJS, replaceCSSHash));
gulp.task('build-prod', gulp.series(setBuildMode(PROD), clean, buildSASS, buildJS, replaceCSSHash));
gulp.task('nosync', gulp.series(clean, buildSASS, buildJS, replaceCSSHash, watch));
gulp.task('build-js', buildJS);
gulp.task('build-sass', buildSASS);
gulp.task('clean', clean);
gulp.task('watch', watch);




