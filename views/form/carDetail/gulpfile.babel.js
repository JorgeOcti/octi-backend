import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
// import sourcemaps from 'gulp-sourcemaps';
import objectFitImages from 'postcss-object-fit-images';

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
    autoprefixer({
      browsers: [
        'last 2 versions',
        'ie 6-10'
      ]
    }), objectFitImages
  ];
  return gulp.src(sassPaths.src)
    // .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(postcss(pluginsPostCss))
    // .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(sassPaths.dest));
});

gulp.task('watch', function () {
  gulp.watch(paths.scss, ['css']);
});


gulp.task('default', ['css', 'watch']);
