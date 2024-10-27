import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sourcemaps from 'gulp-sourcemaps';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import browsersync from 'browser-sync';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import concat from 'gulp-concat';
import imagemin, { mozjpeg } from 'gulp-imagemin';
import svgSprite from 'gulp-svg-sprite';
import { deleteAsync as del } from 'del';
import fileInclude from 'gulp-file-include';
import multiDest from 'gulp-multi-dest';
import changed from 'gulp-changed';
import webp from 'gulp-webp';
import gulpIf from 'gulp-if';
import ttf2woff from 'gulp-ttf2woff';
import ttf2woff2 from 'gulp-ttf2woff2';
import chalk from 'chalk';
import fs from 'fs';

const path = {
	build: {
		js: './build/js/',
		css: './build/css/',
		html: './build/',
		img: './build/img/',
		svg: './build/img',
		fonts: './build/fonts/',
		libs: './build/libs/',
	},
	src: {
		js: './src/js/main.js',
		css: './src/scss/**/*.scss',
		html: './src/*.html',
		img: './src/img/**/*.{jpg,jpeg,png,gif,webp}',
		svg: './src/svg/*.svg',
		fonts: './src/fonts/*.{ttf,otf}',
		libs: './src/libs/**/*.*',
	},
	watch: {
		js: './src/js/**/*.js',
		css: './src/scss/**/*.scss',
		html: './src/**/*.html',
		img: './src/img/**/*.*',
		svg: '.src/svg/*.svg',
		fonts: './src/fonts/*.*',
		libs: './src/libs/**/*.*',
	}
}

function js() {
	return gulp
		.src(path.src.js) 
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('main.js')) 
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.js)) 
		.pipe(browsersync.stream()); 
}

function minifyJs(){
	return gulp
		.src('build/js/main.js')
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(path.build.js))
}

function style() {
	return gulp
		.src(path.src.css) 
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError)) 
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 8 versions'],
      browsers: [
        'Android >= 4',
        'Chrome >= 20',
        'Firefox >= 24',
        'Explorer >= 11',
        'iOS >= 6',
        'Opera >= 12',
        'Safari >= 6',
      ],
		})) 
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css)) 
		.pipe(browsersync.stream()); 
}

function minifyCSS() {
	return gulp
		.src('build/css/style.css')
		.pipe(cleanCSS()) 
		.pipe(rename({ suffix: '.min' })) 
		.pipe(gulp.dest(path.build.css)) 
	}

// переносим все libs
function libs() {
	return gulp
		.src(path.src.libs) 
		.pipe(gulp.dest(path.build.libs)) 
		.pipe(browsersync.stream()) 
}

function html() {
	return gulp
		.src(path.src.html)
		.pipe(plumber())
		.pipe(fileInclude()) 
		.pipe(gulp.dest(path.build.html)) 
		.pipe(browsersync.stream()) 
}

async function img() {
	return gulp
		.src(path.src.img, { encoding: false }) 
		.pipe(plumber())
		.pipe(imagemin()) 
		.pipe(gulp.dest(path.build.img)) 
		.pipe(browsersync.stream()) 
}

function svg() {
	return gulp
		.src(path.src.svg)
		.pipe(plumber())
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: '../sprite.svg'  
				}
			}
		}
		))
		.pipe(gulp.dest(path.build.svg))
		.pipe(browsersync.stream())
}

function clean() {
	return del('./build');
}

function server() {
	browsersync.init({
		server: {
			baseDir: './build/'
		},
		notify: false, 
		port: 3000
	})
}

function ttfToWoff() {
	return gulp
		.src(path.src.fonts, { encoding: false }) 
		.pipe(ttf2woff()) 
		.pipe(gulp.dest(path.build.fonts)) 
}

function ttfToWoff2() {
	return gulp
		.src(path.src.fonts, { encoding: false }) 
		.pipe(ttf2woff2()) 
		.pipe(gulp.dest(path.build.fonts)); 
}

//fontFace
let srcFonts = 'src/scss/_local-fonts.scss';
let appFonts = 'build/fonts/';

function fontFace(done) {
	fs.writeFile(srcFonts, '', () => {});
	fs.readdir(appFonts, (err, items) => {
	  if (items) {
		let c_fontname;
		for (let i = 0; i < items.length; i++) {
		  let fontname = items[i].split('.'),
			fontExt;
		  fontExt = fontname[1];
		  fontname = fontname[0];
		  if (c_fontname != fontname) {
			if (fontExt == 'woff' || fontExt == 'woff2') {
			  fs.appendFile(srcFonts, `@include font-face("${fontname}", "${fontname}", 400);\r\n`, () => {});
			  console.log(chalk `
  {bold {bgGray Added new font: ${fontname}.}
  ----------------------------------------------------------------------------------
  {bgYellow.black Please, move mixin call from {cyan src/scss/_local-fonts.scss} to {cyan src/scss/global/_fonts.scss} and then change it!}}
  ----------------------------------------------------------------------------------
  `);
			}
		  }
		  c_fontname = fontname;
		}
	  }
	})
	done();
  }


//fontFace

function watchFiles() {
	gulp.watch(path.watch.libs, libs); 
	gulp.watch(path.watch.html, html);
	gulp.watch(path.watch.fonts, fonts);
	gulp.watch(path.watch.css, style);
	gulp.watch(path.watch.js, js);
	gulp.watch(path.watch.img, img);
}

const fonts = gulp.series(ttfToWoff, ttfToWoff2, fontFace);
const mainTasks = gulp.series(clean, gulp.parallel(html, fonts, fontFace, libs, style, js, img, svg));
const dev = gulp.series(mainTasks, gulp.parallel(watchFiles, server));

const build = gulp.series(clean, gulp.parallel(html, libs, style, js, img, fonts, fontFace, svg), minifyCSS, minifyJs);

gulp.task('svg', svg);
gulp.task('default', dev);
gulp.task('fonts', fonts);
gulp.task('clean', clean);
gulp.task('build', build);
