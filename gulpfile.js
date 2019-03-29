// ----- Dependencies -----

var url = require('url');
var path = require('path');
var fs = require('fs');

var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var concatcss = require('gulp-concat-css');


// ----- Constants -----

var SIMULATE = true;


// The project root
var ROOT_DIR = __dirname;

// Source directories
var SRC_DIR = path.join(ROOT_DIR, "src");
var SRC_SITE_DIR = path.join(SRC_DIR, "site");
var SRC_SERVERS_DIR = path.join(SRC_DIR, "servers");
var SRC_SHARED_DIR = path.join(SRC_DIR, "shared");

var SRC_SITE_HTML_DIR = path.join(SRC_SITE_DIR, "html");
var SRC_SITE_JS_DIR = path.join(SRC_SITE_DIR, "js");
var SRC_SITE_STYLES_DIR = path.join(SRC_SITE_DIR, "styles");
var SRC_SITE_IMAGES_DIR = path.join(SRC_SITE_DIR, "images");

// The Build directories
var BUILD_DIR = path.join(ROOT_DIR, "build");
var BUILD_SITE_DIR = path.join(BUILD_DIR, "site");
var BUILD_SERVERS_DIR = path.join(BUILD_DIR, "servers");

var BUILD_SITE_CHARTJS = path.join(BUILD_SITE_DIR, "Chartjs");
var BUILD_SITE_WELLS = path.join(BUILD_SITE_DIR, "Wells");
var BUILD_SITE_DASHBOARD = path.join(BUILD_SITE_DIR, "Dashboard");

// The Data directory
var DATA_DIR = path.join(ROOT_DIR, "data");



// Individual build files

var DEFAULT_HTML_NAME = "index.html";
var DEFAULT_JS_BUNDLE_NAME = "bundle.js";
var DEFAULT_CSS_BUNDLE_NAME = "bundle.css";


// Chart.js
var CHARTJS_SRC_HTML = path.join(SRC_SITE_HTML_DIR, "results-chartjs.html");
var CHARTJS_JS_MAIN = path.join(SRC_SITE_JS_DIR, "main-chartjs.js");

var CHARTJS_JS_BUNDLE = "chartjs-bundle.js";
var CHARTJS_MODULE = "Chart";

// Wells selection
var WELLS_SRC_HTML = path.join(SRC_SITE_HTML_DIR, "wells-selection.html");
var WELLS_JS_MAIN = path.join(SRC_SITE_JS_DIR, "main-wells.js");
var WELLS_CSS_FILE = path.join(SRC_SITE_STYLES_DIR, "wells-selection.css");
var WELLS_PLATE_SVG = path.join(SRC_SITE_IMAGES_DIR, "plate-wells-selection.svg");

var WELLS_JS_BUNDLE = "wells-bundle.js";
var WELLS_MODULE = "Wells";

// Dashboard
var DASHBOARD_SRC_HTML = path.join(SRC_SITE_HTML_DIR, "dashboard.html");
var DASHBOARD_JS_MAIN = path.join(SRC_SITE_JS_DIR, "main-dashboard.js");
var DASHBOARD_CSS_MAIN = path.join(SRC_SITE_STYLES_DIR, "main-dashboard.css");
var DASHBOARD_PLATE_SVG = path.join(SRC_SITE_IMAGES_DIR, "plate-wells-selection.svg");
var DASHBOARD_PROGRESS_SVG = path.join(SRC_SITE_IMAGES_DIR, "progress-plate.svg");

// Copy bootstrap assets directly, for now
var BOOTSTRAP_DIR = path.join(ROOT_DIR, "node_modules", "bootstrap", "dist");
var BOOTSTRAP_FONTS = path.join(BOOTSTRAP_DIR, "fonts");

var DASHBOARD_FONTS_DIR = path.join(BUILD_SITE_DASHBOARD, "fonts");
var DASHBOARD_PLATE_SVG_DEST_NAME = "plate.svg";
var DASHBOARD_JS_BUNDLE = "dashboard-bundle.js";
var DASHBOARD_CSS_BUNDLE = "dashboard-bundle.css";
var DASHBOARD_MODULE = "Dash";


// Servers info
var BUILD_FILE_SERVER_JS = path.join(BUILD_SERVERS_DIR, "file-server.js");
var BUILD_SIM_SERVER_JS = path.join(BUILD_SERVERS_DIR, "sequencer-sim.js");

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

var BUILD_SIM_DATA_FILE = path.join(BUILD_SERVERS_DIR, "data", "Sample data.csv");


// ----- Tasks -----

gulp.task('build-chartjs', buildChartJSTask);
gulp.task('bundle-chartjs', bundleChartJSTask);

gulp.task('build-wells', buildWellsTask);
gulp.task('bundle-wells', bundleWellsTask);

gulp.task('build-dashboard', buildDashboardTask);
gulp.task('bundle-dashboard', bundleDashboardTask);

gulp.task('build-servers', buildServersTask);

gulp.task( 'build-all', gulp.parallel('build-chartjs', 'build-wells',
                'build-dashboard', 'build-servers') );

gulp.task('run-app', runAppTask);
gulp.task('run-sim', runSimTask);
// It's probably better to start the simulator before the file server...
gulp.task('run-all', gulp.parallel('run-sim', 'run-app'));

gulp.task('default', gulp.parallel('build-all'));


// ----- Chart.js plotting test -----

function buildChartJSTask(done) {
    // Copy the html file
    gulp.src(CHARTJS_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(BUILD_SITE_CHARTJS));

    // Bundle
    bundleChartJSTask(done);
}


function bundleChartJSTask(done) {
    browserify({
        entries: CHARTJS_JS_MAIN,
        debug: true,
        basedir: SRC_SITE_JS_DIR,
        // So that that util.js can be found...
        paths: [SRC_SHARED_DIR],
        standalone: CHARTJS_MODULE })
        .bundle()
        .pipe(source(CHARTJS_JS_BUNDLE))
        .pipe(gulp.dest(BUILD_SITE_CHARTJS));
	
	done();
}


// ----- Wells selection test -----

function buildWellsTask(done) {
    // Copy the html file
    gulp.src(WELLS_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(BUILD_SITE_WELLS));

    // Copy the plate SVG file
    gulp.src(WELLS_PLATE_SVG)
        .pipe(rename('plate.svg'))
        .pipe(gulp.dest(BUILD_SITE_WELLS));

    // Copy the CSS file
    gulp.src(WELLS_CSS_FILE)
        .pipe(gulp.dest(BUILD_SITE_WELLS));

    // Bundle
    bundleWellsTask(done);
}


function bundleWellsTask(done) {
    browserify({
        entries: WELLS_JS_MAIN,
        debug: true,
        basedir: SRC_SITE_JS_DIR,
        // So that that util.js can be found...
        paths: [SRC_SHARED_DIR],
        standalone: WELLS_MODULE })
        .bundle()
        .pipe(source(WELLS_JS_BUNDLE))
        .pipe(gulp.dest(BUILD_SITE_WELLS));
		
	done();
}


// ----- Dashboard -----

function buildDashboardTask(done) {

    // Copy the html files
    gulp.src(DASHBOARD_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(BUILD_SITE_DASHBOARD));

    // Copy the plate SVG file
    gulp.src(DASHBOARD_PLATE_SVG)
        // Must rename with with the path
        .pipe(rename(DASHBOARD_PLATE_SVG_DEST_NAME))
        .pipe(gulp.dest(BUILD_SITE_DASHBOARD));

    // Copy the progress plate SVG file
    gulp.src(DASHBOARD_PROGRESS_SVG)
        // Save to the root directory
        .pipe(rename({dirname : ''}))
        .pipe(gulp.dest(BUILD_SITE_DASHBOARD));

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
        basedir: SRC_SITE_JS_DIR,
        // So that that util.js can be found...
        paths: [SRC_SHARED_DIR],
        standalone: DASHBOARD_MODULE })
        .bundle()
        .pipe(source(DASHBOARD_JS_BUNDLE))
        .pipe(gulp.dest(BUILD_SITE_DASHBOARD));

    // Bundle (concatenate) the css files
    gulp.src(DASHBOARD_CSS_MAIN)
        .pipe(concatcss(DASHBOARD_CSS_BUNDLE))
        .pipe(gulp.dest(BUILD_SITE_DASHBOARD));
		
	done();
}


// ----- Servers -----

function buildServersTask(done) {

    // Copy the server JS files
    gulp.src(path.join(SRC_SERVERS_DIR, '**/*'))
        .pipe(gulp.dest(BUILD_SERVERS_DIR));
    
    // Copy any shared files
    gulp.src(path.join(SRC_SHARED_DIR, '**/*'))
        .pipe(gulp.dest(BUILD_SERVERS_DIR));
    
    // Copy the data
    gulp.src(path.join(DATA_DIR, '**/*'))
        .pipe(gulp.dest(path.join(BUILD_SERVERS_DIR, "data")));

    done();
}


function runAppTask(done) {

    // Check that the project has been built (essentially)
    if (fs.existsSync(BUILD_FILE_SERVER_JS)) {

        var fileServer = require(BUILD_FILE_SERVER_JS);
        fileServer.run(BUILD_SITE_DIR);

    } else {
       throw new Error("Project not built yet.");
    }

    done();
}


function runSimTask(done) {

    // Check that the project has been built (essentially)
    if (fs.existsSync(BUILD_SIM_SERVER_JS)) {

        var simserver = require(BUILD_SIM_SERVER_JS);
        simserver.run(SEQUENCER_SIM_URL, FILE_SERVER_URL, BUILD_SIM_DATA_FILE);

    } else {
       throw new Error("Project not built yet.");
    }

    done();
}


// ----- Testing -----

// Dump output of exec to the console
function dump(err, stdout, stderr) {
    console.log(err);
    console.log(stdout);
    console.log(stderr);
}
