var path = require('path');

// Docker paths
var APP_ROOT = "/usr/src/app"
var DOCKER_SITE_DIR = path.join(APP_ROOT, "site");
var DOCKER_SERVER_DIR = path.join(APP_ROOT, "servers");
var DOCKER_FILE_SERVER_JS = path.join(DOCKER_SERVER_DIR, "file-server.js");
var DOCKER_SIM_SERVER_JS = path.join(DOCKER_SERVER_DIR, "sequencer-sim.js");
var DATA_FILE = path.join(DOCKER_SERVER_DIR, "data", "Sample data.csv");

// Server URLs
FILE_SERVER_URL = "http://localhost:4000";
SEQUENCER_SIM_URL = "http://localhost:5000";


// Run the servers

var simserver = require(DOCKER_SIM_SERVER_JS);
simserver.run(SEQUENCER_SIM_URL, FILE_SERVER_URL, DATA_FILE);

var fileServer = require(DOCKER_FILE_SERVER_JS);
fileServer.run(DOCKER_SITE_DIR);