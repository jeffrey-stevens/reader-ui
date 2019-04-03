var url = require('url');
var path = require('path');


function run() {
    var config = require('./config.json');

    if (config.simulate === true) {
        var simserver = require("./sequencer-sim.js");
        simserver.run(config.simServerPort, config.fileServerUrl, config.simDataFile,
            config.simRunDelay, config.simCancelDelay, config.simEjectDelay, config.simReadInterval);
    }

    var fileServer = require("./file-server.js");

    var dir;
    if (!path.isAbsolute(config.siteDir)) {
        // Then assume it is relative to the current directory
        dir = path.join(__dirname, config.siteDir);
    } else {
        dir = config.siteDir;
    }
    console.log(dir);

    var port = url.parse(config.fileServerUrl).port;

    fileServer.run(dir, port);
}


module.exports = {
    run : run
};