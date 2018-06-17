'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const webServer = require('gulp-webserver');
const rjs = require('requirejs');
const util = require('gulp-util');
const jsonMinify = require('gulp-json-minify');
/**
 * web server
 * Command - gulp webserver
 */
gulp.task('webserver', function () {
    gulp.src('public')
        .pipe(webServer({
            livereload: true,
            directoryListing: true,
            open: true
        }));
});

/**
 * Executes build of styles for Prod
 * Command - gulp prod:style
 */
gulp.task('prod:style', function () {
    return gulp.src('./app/style/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('./public/style'))
});
/**
 * Executes build of json-files for Prod
 * Command - gulp prod:json-minify
 */
gulp.task('prod:json-minify', function () {
    return gulp.src('./app/data/**/*.json')
        .pipe(jsonMinify())
        .pipe(gulp.dest('./public/data'))
        .on('error', util.log);
});
/**
 * Executes build of styles for Dev
 * Command - gulp dev:style
 */
gulp.task('dev:style', function () {
    return gulp.src('./app/style/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./app/style'))
});
/**
 * Executes build of js for Prod
 * Command - gulp prod:js
 */
gulp.task('prod:js', function (cb) {
    rjs.optimize({
        baseUrl: "./app/js/app",
        name: "../init",
        out: "./public/js/build.js",
        paths: {
            underscore: '../lib/underscore',
            text: '../lib/text',
            firebase: 'https://www.gstatic.com/firebasejs/4.1.2/firebase'
        },
        shim: {
            firebase: {
                exports: 'firebase'
            }
        }
    }, function (buildResponse) {
        console.log('build response', buildResponse);
        cb();
    }, cb);
});
/**
 * Executes copying of images for Prod
 * Command - gulp prod:img
 */
gulp.task('prod:img', function () {
    return gulp.src('./app/img/*')
        .pipe(gulp.dest('./public/img'));
});
/**
 * Executes build of js for Dev
 * Command - gulp dev:js
 */
gulp.task('dev:js', function (cb) {
    rjs.optimize({
        baseUrl: "./app/js/app",
        name: "../init",
        out: "./app/js/build.js",
        optimize: 'none',
        paths: {
            underscore: '../lib/underscore',
            text: '../lib/text',
            firebase: 'https://www.gstatic.com/firebasejs/4.1.2/firebase'
        },
        shim: {
            firebase: {
                exports: 'firebase'
            }
        }
    }, function (buildResponse) {
        console.log('build response', buildResponse);
        cb();
    }, cb);
});

/**
 * Watches for js files for Dev
 * Command - gulp dev:watch:js
 */
gulp.task('dev:watch:js', function () {
    gulp.watch('app/js/app/**/*.js', ['dev:js']);
});

/**
 * Watches for scss files for Dev
 * Command - gulp dev:watch:style
 */
gulp.task('dev:watch:style', function () {
    gulp.watch('app/style/**/*.scss', ['dev:style']);
});

/**
 * Watches for both js and scss files for Dev
 * Command - gulp dev:watch:style
 */
gulp.task('dev:watch', ['dev:watch:js', 'dev:watch:style']);


/**
 * Execute both js and style commands for Prod
 * Command - gulp prod:build
 */
gulp.task('prod:build', ['prod:style', 'prod:js', 'prod:json-minify', 'prod:img']);

/**
 * Execute both js and style commands for Dev
 * Command - gulp dev:build
 */
gulp.task('dev:build', ['dev:style', 'dev:js']);
