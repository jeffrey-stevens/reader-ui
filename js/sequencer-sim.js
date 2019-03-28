// sequencer-sim.js
//
// Web server to simulate the sequencer for the concept multiplex reader.

// ----- Includes -----

var url = require('url');
var cors = require('cors');

var Express = require('express');
var BodyParser = require('body-parser');

var Util = require("./util.js");


// ----- Constants -----

var RESULTS_SAMPLE = "./data/Sample data.csv";

var RUN_DELAY = 0; // Seconds
var CANCEL_DELAY = 5 * 1000; // Seconds
var EJECT_DELAY = 5 * 1000;  // Seconds


// ----- Globals -----

var app = Express();

var _run = false;
var _wellsToRun = [];
var _results = null;
var _pendingWells = [];
var _serverRunning = false;
var _carrierIn = true;



// ----- Initialization -----



// ----- Functions -----

// Read in the sample results file
function loadResults(filename, callback) {

    Util.loadFile(filename,
                  function(text) {
                      _results = Util.parseData(text);

                      callback();
                  });
}


function formatResponse(wells, pending) {
    // wells:  An array of wells to return data on
    // pending:  An array of wells to be run

    // See data/results-response.json for the response data format
    var results = wells.map(function(well) {

        // Get all results for this well
        var data = _results
                .filter(function(result) {
                    return (result.well == well); })
                .map(function(result) {
                    var res = {
                        analyte : result.analyte,
                        reading : result.reading };
                    return res;
                });

        // Now create a "well results" object
        var wellResults = {
            well : well,
            data : data
        };

        return wellResults;
    });

    // Now bundle this into the response object
    var response = {
        pending : pending,
        results : results
    };

    return response;
}



// ----- Server -----

function runRequestHandler(req, res, next) {

    // Get the list of wells to run
    _wellsToRun = req.body;
    _pendingWells = _wellsToRun;

    console.log("'/run' request received:");
    console.log(JSON.stringify(req.body));

    setTimeout(function() {
        // Respond with the wells to be run
        var response = {pending : _pendingWells };
        var respJSON = JSON.stringify(response);

        console.log("Sending a response:");
        console.log(respJSON);

        res.send(respJSON);

        // Set the run state
        _run = true;
        _carrierIn = true;
    }, RUN_DELAY);
}


function resultsRequestHandler(req, res, next) {

    // Get the list of pending wells from the client
    var pendingWells = req.body;

    // Respond with the results
    var wellsJSON = JSON.stringify(pendingWells);
    console.log("'/results' request received:");
    console.log(JSON.stringify(req.body));

    // Send back the results for just one well
    var well = pendingWells.shift();

    // Update the global pending wells list (in case it's needed later)
    _pendingWells = pendingWells;

    // Send the response
    var response = formatResponse([well], pendingWells);
    res.send(JSON.stringify(response));

}


function cancelRequestHandler(req, res, next) {

    // Get the list of pending wells from the client
    var pendingWells = req.body;

    // Respond with the results
    var wellsJSON = JSON.stringify(pendingWells);
    console.log("'/cancel' request received:");
    console.log(JSON.stringify(req.body));

    setTimeout(function() {
        // Update the global pending wells list (in case it's needed later)
        _pendingWells = pendingWells;

        // Send the response
        var wells = [];
        var response = formatResponse(wells, pendingWells);
        res.send(JSON.stringify(response));
    }, CANCEL_DELAY);

    // Should have this error if another request is sent in this timeframe...
}


function ejectRequestHandler(req, res, next) {

    // Ignore the body
    console.log("'/eject' request received.");

    // Simulate a delay in moving the carrier out
    var delay = (_carrierIn) ? EJECT_DELAY : 0;

    // Delay a certain amount of time
    setTimeout(function() {
        _carrierIn = false;

        // Send back an empty object upon success
        var response = {};
        var respJSON = JSON.stringify(response);
        console.log("Sending an '/eject' response:");
        console.log(respJSON);

        res.send(respJSON);
    }, delay);

    // Should error if another eject message was sent during this time

}


function startServer(simServerUrl, fileServerUrl) {

    // Set up CORS
    app.use( cors({
        origin : function(origin, callback) {
            // Only allow requests from the file server
            var originUrl = url.parse(origin);
            var serverUrl = url.parse(fileServerUrl);
            if (originUrl.origin == serverUrl.origin) {
                // Good to go!
                callback(null, true);
            } else {
                // Block access to this request
                callback(new Error("Access denied by CORS."));
            }
        }
    }));
    //app.use(function(req, res, next) {
        //res.header("Access-Control-Allow-Origin", fileServerUrl);
        //res.header("Access-Control-Allow-Methods", "POST,OPTIONS");
        //res.header("Access-Control-Allow-Headers",
                   //"Origin, X-Requested-With, Content-Type, Accept");

        //next();
    //});

    // Extract the JSON content from the body of the request
    app.use(BodyParser.json());

    // Set up the routes
    app.post('/run', runRequestHandler);
    app.post('/results', resultsRequestHandler);
    app.post('/cancel', cancelRequestHandler);
    app.post('/eject', ejectRequestHandler);

    // Now start up the server
    var port = url.parse(simServerUrl).port;
    app.listen(port, function() {
        _serverRunning = true;
    });

}


function run(simServerUrl, fileServerUrl) {

    // Load the results
    // Don't start the server until the file has loaded (for simplicity)
    loadResults(RESULTS_SAMPLE, function() {
        startServer(simServerUrl, fileServerUrl);
    });

}




// ----- Exports -----

module.exports = {
    run : run
};
