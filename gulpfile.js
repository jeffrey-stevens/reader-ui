// ----- Dependencies -----
var exec = require('child_process').exec;
var url = require('url');

var gulp = require('gulp');
var path = require('path');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var concatcss = require('gulp-concat-css');
var server = require('gulp-webserver');
var cors = require('cors');


// Local includes
var seqServer = require('./js/sequencer-sim.js');


// ----- Constants -----

var SIMULATE = true;


// Source directories
var IMAGES_SRC_DIR = "images";
var HTML_SRC_DIR = "html";
var STYLES_SRC_DIR = "styles";
var JS_SRC_DIR = "js";
var DATA_SRC_DIR = "data";

// Distribution directories
var ROOT_DIR = __dirname;
var DIST_DIR = path.join(ROOT_DIR, "dist");
var DATA_DEST_DIR = path.join(DIST_DIR, "data");

var DEFAULT_HTML_NAME = "index.html";
var DEFAULT_JS_BUNDLE_NAME = "bundle.js";
var DEFAULT_CSS_BUNDLE_NAME = "bundle.css";

// Chart.js
var CHARTJS_SRC_HTML = path.join(HTML_SRC_DIR, "results-chartjs.html");
var CHARTJS_JS_MAIN = path.join(JS_SRC_DIR, "main-chartjs.js");

var CHARTJS_DEST_DIR = path.join(DIST_DIR, "Chartjs");
var CHARTJS_JS_BUNDLE = "chartjs-bundle.js";
var CHARTJS_MODULE = "Chart";

// Wells selection
var WELLS_SRC_HTML = path.join(HTML_SRC_DIR, "wells-selection.html");
var WELLS_JS_MAIN = path.join(JS_SRC_DIR, "main-wells.js");
var WELLS_CSS_FILE = path.join(STYLES_SRC_DIR, "wells-selection.css");
var WELLS_PLATE_SVG = path.join(IMAGES_SRC_DIR, "plate-wells-selection.svg");

var WELLS_DEST_DIR = path.join(DIST_DIR, "Wells");
var WELLS_JS_BUNDLE = "wells-bundle.js";
var WELLS_MODULE = "Wells";

// Dashboard
var DASHBOARD_SRC_HTML = path.join(HTML_SRC_DIR, "dashboard.html");
var DASHBOARD_JS_MAIN = path.join(JS_SRC_DIR, "main-dashboard.js");
var DASHBOARD_CSS_MAIN = path.join(STYLES_SRC_DIR, "main-dashboard.css");
var DASHBOARD_PLATE_SVG = path.join(IMAGES_SRC_DIR, "plate-wells-selection.svg");
var DASHBOARD_PROGRESS_SVG = path.join(IMAGES_SRC_DIR, "progress-plate.svg");

// Copy bootstrap assets directly, for now
var BOOTSTRAP_DIR = path.join("node_modules", "bootstrap", "dist");
var BOOTSTRAP_FONTS = path.join(BOOTSTRAP_DIR, "fonts");

var DASHBOARD_DEST_DIR = path.join(DIST_DIR, "Dashboard");
var DASHBOARD_FONTS_DIR = path.join(DASHBOARD_DEST_DIR, "fonts");
var DASHBOARD_PLATE_SVG_DEST_NAME = "plate.svg";
var DASHBOARD_JS_BUNDLE = "dashboard-bundle.js";
var DASHBOARD_CSS_BUNDLE = "dashboard-bundle.css";
var DASHBOARD_MODULE = "Dash";


// Servers
var FILE_SERVER_DIR = DIST_DIR;
var FILE_SERVER_PORT = "4000";
var FILE_SERVER_DB_PATH = "Dashboard";
var FILE_SERVER_URL = url.format({
    protocol : 'http',
    hostname : 'localhost',
    port : FILE_SERVER_PORT,
    pathname : FILE_SERVER_DB_PATH
});

var SEQUENCER_SIM_PORT = "5000";
var SEQUENCER_SIM_HOST = "localhost";
var SEQUENCER_SIM_URL = url.format({
    protocol : 'http',
    hostname : SEQUENCER_SIM_HOST,
    port : SEQUENCER_SIM_PORT
});

var SEQUENCER_URL = null;
if (SIMULATE) {
    SEQUENCER_URL = SEQUENCER_SIM_URL;
} else if (SEQUENCER_URL === null) {
    console.log("Sequencer URL not defined...Will use the simulator.");
    SEQUENCER_URL = SEQUENCER_SIM_URL;
}

// ----- Tasks -----

gulp.task('copy-data', copyDataTask);

gulp.task('build-chartjs', buildChartJSTask);
gulp.task('bundle-chartjs', bundleChartJSTask);

gulp.task('build-wells', buildWellsTask);
gulp.task('bundle-wells', bundleWellsTask);

gulp.task('build-dashboard', gulp.parallel('copy-data', buildDashboardTask));
gulp.task('bundle-dashboard', bundleDashboardTask);

gulp.task('run-app', runApp);
gulp.task('run-sim', runSim);
// It's probably better to start the simulator before the file server...
gulp.task('run-all', gulp.parallel('run-sim', 'run-app'));

gulp.task('build-all', 
            gulp.parallel('build-chartjs', 'build-wells', 'build-dashboard') );
gulp.task('default', gulp.parallel('build-all'));


function copyDataTask(done) {
    // Copy the data files
    gulp.src(path.join(DATA_SRC_DIR, "**/*"))
        .pipe(gulp.dest(DATA_DEST_DIR));
		
	done();
}



// ----- Chart.js plotting test -----

function buildChartJSTask(done) {
    // Copy the html file
    gulp.src(CHARTJS_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(CHARTJS_DEST_DIR));

    // Bundle
    bundleChartJSTask(done);
}


function bundleChartJSTask(done) {
    browserify({
        entries: CHARTJS_JS_MAIN,
        debug: true,
        standalone: CHARTJS_MODULE })
        .bundle()
        .pipe(source(CHARTJS_JS_BUNDLE))
        .pipe(gulp.dest(CHARTJS_DEST_DIR));
	
	done();
}


// ----- Wells selection test -----

function buildWellsTask(done) {
    // Copy the html file
    gulp.src(WELLS_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(WELLS_DEST_DIR));

    // Copy the plate SVG file
    gulp.src(WELLS_PLATE_SVG)
        .pipe(rename('plate.svg'))
        .pipe(gulp.dest(WELLS_DEST_DIR));

    // Copy the CSS file
    gulp.src(WELLS_CSS_FILE)
        .pipe(gulp.dest(WELLS_DEST_DIR));

    // Bundle
    bundleWellsTask(done);
}


function bundleWellsTask(done) {
    browserify({
        entries: WELLS_JS_MAIN,
        debug: true,
        standalone: WELLS_MODULE })
        .bundle()
        .pipe(source(WELLS_JS_BUNDLE))
        .pipe(gulp.dest(WELLS_DEST_DIR));
		
	done();
}


// ----- Dashboard -----

function buildDashboardTask(done) {

    // Copy the html files
    gulp.src(DASHBOARD_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(DASHBOARD_DEST_DIR));

    // Copy the plate SVG file
    gulp.src(DASHBOARD_PLATE_SVG)
        // Must rename with with the path
        .pipe(rename(DASHBOARD_PLATE_SVG_DEST_NAME))
        .pipe(gulp.dest(DASHBOARD_DEST_DIR));

    // Copy the progress plate SVG file
    gulp.src(DASHBOARD_PROGRESS_SVG)
        // Save to the root directory
        .pipe(rename({dirname : ''}))
        .pipe(gulp.dest(DASHBOARD_DEST_DIR));

    // Copy the bootstrap fonts
    gulp.src(path.join(BOOTSTRAP_FONTS, '*.*'))
        .pipe(gulp.dest(DASHBOARD_FONTS_DIR));
    // Should eventualy bundle this as well...

    // Bundle
    bundleDashboardTask(done);
}


function bundleDashboardTask(done) {
    browserify({
        entries: DASHBOARD_JS_MAIN,
        debug: true,
        standalone: DASHBOARD_MODULE })
        .bundle()
        .pipe(source(DASHBOARD_JS_BUNDLE))
        .pipe(gulp.dest(DASHBOARD_DEST_DIR));

    // Bundle (concatenate) the css files
    gulp.src(DASHBOARD_CSS_MAIN)
        .pipe(concatcss(DASHBOARD_CSS_BUNDLE))
        .pipe(gulp.dest(DASHBOARD_DEST_DIR));
		
	done();
}


function runApp(done) {

    console.log("File server directory: " + FILE_SERVER_DIR);

    gulp.src(FILE_SERVER_DIR)
        .pipe(server({
            livereload : false,
            open : FILE_SERVER_URL,
            port : FILE_SERVER_PORT,
        }));

    done();
}


function runSim(done) {

    seqServer.run(SEQUENCER_SIM_URL, FILE_SERVER_URL);

    done();
}


// ----- Testing -----

// Dump output of exec to the console
function dump(err, stdout, stderr) {
    console.log(err);
    console.log(stdout);
    console.log(stderr);
}
