const gulp = require('gulp');
const dartSass =require('sass');
const gulpSass =require('gulp-sass');
const sass = gulpSass(dartSass)
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
const objectFitImages = require('postcss-object-fit-images');

const dirs = {
  src: './styles',
  dest: '.'
};

const sassPaths = {
  src: `${dirs.src}/style.sass`,
  dest: `${dirs.dest}/`
};

const paths = {
  scss: [
    'styles/**/*.sass'
  ]
};

gulp.task('css', function () {
  const pluginsPostCss = [
    autoprefixer(), objectFitImages
  ];
  return gulp.src(sassPaths.src)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    })
      .on('error', sass.logError))
    .pipe(postcss(pluginsPostCss))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(sassPaths.dest));
});

gulp.task('watch', function () {
  gulp.watch(paths.scss, gulp.series('css'));
});


gulp.task('default', gulp.series('css', 'watch'));
