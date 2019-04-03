// sequencer-sim.js
//
// Web server to simulate the sequencer for the conceptual multiplex reader.

// ----- Includes -----

var url = require('url');
var cors = require('cors');

var Express = require('express');
var BodyParser = require('body-parser');

var Util = require("./util.js");


// ----- Globals -----

var _runDelay;
var _cancelDelay;
var _ejectDelay;
var _readInterval;

var app = Express();

var _run = false;
var _wellsToRead = [];
var _wellsRead = [];
var _results = null;
var _wellsPending = [];
var _serverRunning = false;
var _carrierIn = true;

var _continueRead = false;



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
    // pending:  An array of wells remaining to be run

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

function initRun(toRead) {
    _wellsRead = [];
    _wellsToRead = toRead;
    _wellsPending = _wellsToRead;
}

function runRequestHandler(req, res, next) {

    // Initialize
    initRun(req.body);

    console.log("'/run' request received:");
    console.log(JSON.stringify(req.body));

    setTimeout(function() {
        // Respond with the wells to be run
        var response = {pending : _wellsPending };
        var respJSON = JSON.stringify(response);

        console.log("Sending a response:");
        console.log(respJSON);

        res.send(respJSON);

        // Set the run state
        _run = true;
        _carrierIn = true;

        // Start the run simulator
        startRunSimulator();
    }, _runDelay);
}


function startRunSimulator() {

    _continueRead = true;

    // Start the first read interval
    waitForRead();
}


function waitForRead() {

    if (_continueRead && _wellsToRead.length > 0) {

        // Pop the well off of the (front of the) "wellsToRun" stack, and push it to
        // the end of the "wellsRun" stack.
        var well = _wellsToRead.shift();
        _wellsRead.push(well);

        // Set the next interval if there are more wells to read
        if (_wellsToRead.length > 0) {
            setTimeout(waitForRead, _readInterval);
        } else {
            // No wells are left; stop the simulator (not strictly necessary since length = 0,
            // but resetting the read state is nonetheless good practice...)
            stopRunSimulator();
        }
    }
}


function stopRunSimulator() {
    _continueRead = false;
}


// Find the intersection of 2 arrays
function intersection(arr1, arr2) {

    // Filter out all elements of arr1 that are not in arr2
    isect = arr1.filter(function(elem) {
        // Check if elem is in arr2
        return arr2.indexOf(elem) != -1;
    });

    return isect;
}


// Return the set difference between 2 arrays
function setdiff(arr1, arr2) {

    diff = arr1.filter(function(elem) {
        return arr2.indexOf(elem) == -1;
    });

    return diff;
}


function adjustPending(pending) {

    // Find all "pending" wells that have been read
    var wellsToReturn = intersection(pending, _wellsRead);
    wellsPending = setdiff(pending, wellsToReturn);

    // Update the global pending wells list (in case it's needed later)
    _wellsPending = wellsPending;

    return {
        wellsToReturn : wellsToReturn,
        wellsPending : wellsPending
    };
}


function resultsRequestHandler(req, res, next) {

    // Get the list of pending wells from the client
    var wellsPending = req.body;

    // Respond with the results
    var wellsJSON = JSON.stringify(wellsPending);
    console.log("'/results' request received:");
    console.log(wellsJSON);

    var adj = adjustPending(wellsPending);

    // Send the response
    var response = formatResponse(adj.wellsToReturn, adj.wellsPending);
    res.send(JSON.stringify(response));

}


function cancelRequestHandler(req, res, next) {

    // Get the list of pending wells from the client
    var wellsPending = req.body;

    // Print the pending state out to the console
    var wellsJSON = JSON.stringify(wellsPending);
    console.log("'/cancel' request received:");
    console.log(wellsJSON);


    setTimeout(function() {

        // Get the latest run state
        var adj = adjustPending(wellsPending);

        // Update the global pending wells list (in case it's needed later)
        _wellsPending = wellsPending;

        // Stop the simulator
        stopRunSimulator();

        // Send the response
        var response = formatResponse(adj.wellsToRun, adj.wellsPending);
        res.send(JSON.stringify(response));
    }, _cancelDelay);

    // Should have this error if another request is sent in this timeframe...
}


function ejectRequestHandler(req, res, next) {

    // Ignore the body
    console.log("'/eject' request received.");

    // Simulate a delay in moving the carrier out
    var delay = (_carrierIn) ? _ejectDelay : 0;

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


function startServer(port, fileServerUrl) {

    // Set up CORS
    app.use( cors({
        origin : function(origin, callback) {
            // Only allow requests from the file server
            var originUrl = url.parse(origin);
            var allowedUrl = url.parse(fileServerUrl);

            // I'd prefer the following to be more strict...  === ?
            if (originUrl.origin == allowedUrl.origin) {
                // Good to go!
                callback(null, true);
            } else {
                // Block access to this request
                callback(new Error("Access denied by CORS."));
            }
        }
    }));

    // Extract the JSON content from the body of the request
    app.use(BodyParser.json());

    // Set up the routes
    app.post('/run', runRequestHandler);
    app.post('/results', resultsRequestHandler);
    app.post('/cancel', cancelRequestHandler);
    app.post('/eject', ejectRequestHandler);

    // Now start up the server
    app.listen(port, function() {
        _serverRunning = true;
    });

}


function run(port, fileServerUrl, datafile, runDelay, cancelDelay, ejectDelay, readInterval) {

    // These values should be globally-accessible
    _runDelay = runDelay;
    _cancelDelay = cancelDelay;
    _ejectDelay = ejectDelay;
    _readInterval = readInterval;

    // Load the results
    // Don't start the server until the file has loaded (for simplicity)
    loadResults(datafile, function() {
        startServer(port, fileServerUrl);
    });

}



// ----- Exports -----

module.exports = {
    run : run
};
