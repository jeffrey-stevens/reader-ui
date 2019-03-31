// ----- Dependencies -----

var url = require('url');
var path = require('path');
var fs = require('fs');

var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var concatcss = require('gulp-concat-css');
var replace = require('gulp-replace-path');
var transform = require('vinyl-transform');


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

// The Config directory
var CONFIG_DIR = path.join(ROOT_DIR, "config");

// The Temporary directory
var TEMP_DIR = path.join(ROOT_DIR, "temp");


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
var BUILD_SERVERS_RUN_JS = path.join(BUILD_SERVERS_DIR, "run-servers.js");


// Docker
var SRC_DOCKER_DIR = path.join(SRC_DIR, "docker");
var SRC_DOCKER_FILE = path.join(SRC_DOCKER_DIR, "Dockerfile");
var BUILD_DOCKER_DIR = path.join(BUILD_DIR, "docker");
var BUILD_DOCKER_SITE_DIR = path.join(BUILD_DOCKER_DIR, "site");
var BUILD_DOCKER_SERVERS_DIR = path.join(BUILD_DOCKER_DIR, "servers");
var NPM_PACKAGE_FILE = path.join(ROOT_DIR, "package.json");


// Configuration files
var CONFIG_SITE_LOCAL = path.join(CONFIG_DIR, "config-site-local.json");
var CONFIG_SERVERS_LOCAL = path.join(CONFIG_DIR, "config-servers-local.json");
var CONFIG_SITE_DOCKER = path.join(CONFIG_DIR, "config-site-docker.json");
var CONFIG_SERVERS_DOCKER = path.join(CONFIG_DIR, "config-servers-docker.json");


// ----- Globals -----


// ----- Tasks -----

gulp.task('build-chartjs', buildChartJSTask);
gulp.task('bundle-chartjs', bundleChartJSTask);

gulp.task('build-wells', buildWellsTask);
gulp.task('bundle-wells', bundleWellsTask);

gulp.task('build-dashboard-local', buildDashboardLocalTask);
gulp.task('build-dashboard-docker', buildDashboardDockerTask);
gulp.task('build-dashboard-all', 
    gulp.parallel('build-dashboard-local', 'build-dashboard-docker'));

gulp.task('build-site-local',
    gulp.parallel('build-chartjs', 'build-wells', 'build-dashboard-local'));

gulp.task('build-servers-local', buildServersLocalTask);
gulp.task('build-servers-docker', buildServersDockerTask);
gulp.task('build-servers-all',
    gulp.parallel('build-servers-local', 'build-servers-docker'));

gulp.task('build-all-local',
    gulp.parallel('build-site-local', 'build-servers-local'));

gulp.task('build-docker-skeleton', buildDockerSkelTask);
gulp.task('build-docker',
    gulp.parallel('build-docker-skeleton', 'build-dashboard-docker',
     'build-servers-docker'));

gulp.task( 'build-all', gulp.parallel('build-all-local', 'build-docker') );

gulp.task('run-servers', runServersTask);

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

function buildDashboardLocalTask(done) {
    buildDashboard(BUILD_SITE_DASHBOARD, CONFIG_SITE_LOCAL);

    done();
}


function buildDashboardDockerTask(done) {
    buildDashboard(BUILD_DOCKER_SITE_DIR, CONFIG_SITE_DOCKER);

    done();
}


function buildDashboard(destdir, config) {

    // Copy the html files
    gulp.src(DASHBOARD_SRC_HTML)
        .pipe(rename(DEFAULT_HTML_NAME))
        .pipe(gulp.dest(destdir));

    // Copy the plate SVG file
    gulp.src(DASHBOARD_PLATE_SVG)
        // Must rename with with the path
        .pipe(rename(DASHBOARD_PLATE_SVG_DEST_NAME))
        .pipe(gulp.dest(destdir));

    // Copy the progress plate SVG file
    gulp.src(DASHBOARD_PROGRESS_SVG)
        // Save to the root directory
        .pipe(rename({dirname : ''}))
        .pipe(gulp.dest(destdir));

    // Copy the bootstrap fonts
    gulp.src(path.join(BOOTSTRAP_FONTS, '*.*'))
        .pipe(gulp.dest(path.join(destdir, "fonts")));
    // Should eventualy bundle this as well...

    // Bundle the Javascript files
    bundleDashboard(destdir, config);
}


function bundleDashboard(destdir, config) {

    gulp.src(DASHBOARD_JS_MAIN)
        .pipe(replace('config.json', path.basename(config)))
        .pipe(gulp.dest(TEMP_DIR));

    var tempfile = path.join(TEMP_DIR, path.basename(DASHBOARD_JS_MAIN));

    browserify(tempfile, {
        debug: true,
        basedir : ROOT_DIR,
        // So that that util.js can be found...
        paths: [SRC_SITE_JS_DIR, SRC_SHARED_DIR, CONFIG_DIR],
        standalone: DASHBOARD_MODULE
    })
        .bundle()
        .pipe(source(DASHBOARD_JS_BUNDLE))
        .pipe(gulp.dest(destdir));
    
    // Delete the temp file
    //fs.unlinkSync(tempfile);
    // This complains about not being able to find the file, *after* it deletes it...

    // Bundle (concatenate) the css files
    gulp.src(DASHBOARD_CSS_MAIN)
        .pipe(concatcss(DASHBOARD_CSS_BUNDLE))
        .pipe(gulp.dest(destdir));

}


// ----- Docker -----

function buildDockerSkelTask(done) {

    // Copy the Docker file
    gulp.src(SRC_DOCKER_FILE)
        .pipe(gulp.dest(BUILD_DOCKER_DIR));

    // Copy the package.json
    gulp.src(path.join(ROOT_DIR, 'package*.json'))
        .pipe(gulp.dest(BUILD_DOCKER_DIR));

    done();
}


// ----- Servers -----

function buildServersLocalTask(done) {

    buildServers(BUILD_SERVERS_DIR, CONFIG_SERVERS_LOCAL);

    done();
}

function buildServersDockerTask(done) {

    buildServers(BUILD_DOCKER_SERVERS_DIR, CONFIG_SERVERS_DOCKER);

    done();
}


function buildServers(destdir, config) {

    // Copy the server JS and configuration files
    gulp.src(path.join(SRC_SERVERS_DIR, '**/*'))
        .pipe(gulp.dest(destdir));
    
    // Copy any shared files
    gulp.src(path.join(SRC_SHARED_DIR, '**/*'))
        .pipe(gulp.dest(destdir));
    
    // Copy the data
    gulp.src(path.join(DATA_DIR, '**/*'))
        .pipe(gulp.dest(path.join(destdir, "data")));
    
    // Copy the config file
    gulp.src(config)
        .pipe(rename("config.json"))
        .pipe(gulp.dest(destdir));
}


function runServersTask(done) {

    var runServers = require(BUILD_SERVERS_RUN_JS);

    runServers.run();

    done();
}



// ----- Testing -----

// Dump output of exec to the console
function dump(err, stdout, stderr) {
    console.log(err);
    console.log(stdout);
    console.log(stderr);
}
