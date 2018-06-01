import gulp from 'gulp';
import sass from 'gulp-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';

const dirs = {
    src: './styles',
    dest: '../../css/support'
};

const sassPaths = {
    src: `${dirs.src}/style.scss`,
    dest: `${dirs.dest}/`
};

const paths = {
    scss: [
        'styles/**/*.scss'
    ]
};

gulp.task('css', function () {
    const pluginsPostCss = [
        autoprefixer({
            browsers: [
                'last 2 versions',
                'ie 6-10'
            ]
        })
    ];
    return gulp.src(sassPaths.src)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(postcss(pluginsPostCss))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(sassPaths.dest));
});

gulp.task('watch', function () {
    gulp.watch(paths.scss, ['css']);
});


gulp.task('default', ['css', 'watch']);
