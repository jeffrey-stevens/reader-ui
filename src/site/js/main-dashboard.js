// ----- Imports -----


var path = require('path');

global.jQuery = require('jquery');  // For bootstrap
$ = jQuery;
var bootstrap = require('bootstrap');

// Local includes
//var Dash = require('./dashboard.js');
var Util = require('util.js');
var Wells = require('./wells-selection.js');
var PlotUI = require('./plot-ui-chartjs.js');
var Progress = require('./progress.js');


// ----- Constants -----

var PLATE_SVG_FILE = "plate.svg";
var PLATE_CONTAINER_ID = "plate-svg-container";

var PROGRESS_SVG_FILE = "progress-plate.svg";
var PROGRESS_SVG_ID = "progress-svg-container";

var SUBMIT_RUN_BTN_ID = 'submit-run-btn';
var SEQUENCER_RUN_URL = "http://localhost:5000/run";
var SEQUENCER_RESULTS_URL = "http://localhost:5000/results";
var SEQUENCER_CANCEL_URL = "http://localhost:5000/cancel";
var SEQUENCER_EJECT_URL = "http://localhost:5000/eject";

var RUN_TIMEOUT = 30 * 1000;
var POLL_INTERVAL = 3 * 1000; // milliseconds
var POLL_TIMEOUT = POLL_INTERVAL * 3;

// Hard-code this, for simplicity
var DEFAULT_ANALYTES = "ABCDEFGHIJKLM".split("");

// ----- Globals -----

var _pendingWells;
var _currentWell;
var _results;
var _pollTimer;
var _cancel;

var _plotui;


// ----- Initialization -----

document.addEventListener("DOMContentLoaded", initialize);


function initialize(){

    // Initialize the variables again, for consistency
    initVars();

    // Initialize the window
    //var winWidth = $(window).width();
    //var winHeight = $(window).height();
    //$("body").width(winWidth);
    //$("body").height(winHeight);

    // Initialize the panes
    initIntroPane();
    initWellsPane();
    initResultsPane();

}


// Initialize the global variables
function initVars() {
    _pendingWells = [];
    _results = [];
    _pollTimer = null;
    _cancel = false;
}


function initIntroPane() {

    // Handle the "Let's begin" button in the intro
    var loadNewPlateButton = document.getElementById('load-new-plate-btn');
    loadNewPlateButton.addEventListener('click', loadNewPlateHandler);

    var rerunPlateButton = document.getElementById('rerun-plate-btn');
    rerunPlateButton.addEventListener('click', switchToWellsPane);
    var loadDoneButton = document.getElementById('load-done-btn');
    loadDoneButton.addEventListener('click', switchToWellsPane);
}


function switchToWellsPane() {

    $('#load-done-btn').tab('show');

    // Update the pills
    enablePill('#wells-pill');
    disablePill('#intro-pill');
    disablePill('#results-pill');
}


function initWellsPane() {

    // Set up the "Ready!" button on the wells selection page
    $('#ready-button')
        .click(readyButtonHandler)
        .prop('disabled', true);

    var container = document.getElementById(PLATE_CONTAINER_ID);
    Wells.initialize(PLATE_SVG_FILE, container);

    // Enable the "Ready!" button if wells have been selected
    document.addEventListener('selection-done', function(e) {
        // Get the selection
        var selection = Wells.getSelectedWells();
        if (selection.length === 0) {
            $('#ready-button').prop('disabled', true)
                .removeClass('btn-primary')
                .addClass('btn-default');
        } else if (selection.length > 0) {
            $('#ready-button').prop('disabled', false)
                .removeClass('btn-default')
                .addClass('btn-primary');
        }
        else {
            throw Error("Improper selection object.");
        }
    });


    // Init the run submission button
    var runButton = document.getElementById(SUBMIT_RUN_BTN_ID);
    runButton.addEventListener('click', submitRunHandler);

}


function initResultsPane() {

    // Initialize the plot UI
    initPlotUI();

    // Initialize the progress indicator widget
    var progContainer = document.getElementById(PROGRESS_SVG_ID);
    Progress.initialize(PROGRESS_SVG_FILE, progContainer);

    // Add a handler for the "Cancel run" button
    var cancelButton = document.getElementById('submit-cancel-btn');
    cancelButton.addEventListener('click', cancelRun);

    // Add a handler for the "New run" button
    var newRunButton = document.getElementById('submit-new-run-btn');
    newRunButton.addEventListener('click', newRun);

    // The eject button
    var ejectPlateButton = document.getElementById('eject-plate-btn');
    ejectPlateButton.addEventListener('click', function() {
        ejectPlate(finishEject, handleEjectError);
    });
    // Disable the button...
    disableEjectButton();
}


function initPlotUI() {

    // Init the results UI
    PlotUI.initialize();

    // Set up the real-time plot UI
    var canvas = document.getElementById('plot-canvas');
    var byWellRadio = document.getElementById('by-well-radio');
    var byAnalyteRadio = document.getElementById('by-analyte-radio');
    var selContainer = document.getElementById('selection-container');
    var selList = document.getElementById('selection-list');
    var selLabel = document.getElementById('selection-label');

    _plotui = new PlotUI.PlotUI(canvas, byWellRadio, byAnalyteRadio, selContainer,
                                selList, selLabel, undefined);
}


function deactivatePill(pillsel) {
    $(pillsel).removeClass('active');
}

function disablePill(pillsel) {
    $(pillsel).removeClass('active');
    $(pillsel).addClass('disabled');
}

function enablePill(pillsel) {
    $(pillsel).removeClass('disabled');
    $(pillsel).addClass('active');
}


function loadNewPlateHandler() {
    var unloadDoneHandler = function() {
        // Bring up the "Unload done" modal
        $( '#unload-done-modal' ).modal('show');
    };

    // Eject the plate
    ejectPlate(unloadDoneHandler, handleEjectError);
}


function readyButtonHandler() {
    $( '#ready-modal').modal('show');
}


// Start the run
function submitRunHandler() {

    // Switch to the "Results" pane
    disablePill('#intro-pill');
    disablePill('#wells-pill');
    enablePill('#results-pill');
    $('#submit-run-btn').tab('show');

    sendRunRequest();

}


function sendRunRequest() {

    // Get the selected wells
    var selection = Wells.getSelectedWells();
    _pendingWells = selection;

    // Set up the HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open("POST", SEQUENCER_RUN_URL, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    // Dump the response to the console, for now
    xhr.onreadystatechange = function () {

        // Start the polling process if the request was successfully received
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            // !!! Should check the response text as well!!!

            // Dump the contents to sdtout
            var responseJSON = xhr.responseText;
            console.log("Received '/run' response:");
            console.log(responseJSON);

            // Process the results up-front
            var response = JSON.parse(responseJSON);
            var pendingServer = response.pending;
            // Should check the error state as well...

            // Set up the plot
            _plotui.initialize([], selection, DEFAULT_ANALYTES);

            // Set up the progress widget
            _currentWell = (pendingServer.length > 0) ? pendingServer[0] : null;
            Progress.start(selection, _currentWell);

            // Start the results polling
            setNextResultsPoll();
        }
    };

    // Timeout?  How long does it take to send out a run response?
    xhr.timeout = RUN_TIMEOUT;
    xhr.ontimeout = function(e) {
        console.log("Run request timed out.");
        if (_cancel === false) {
            console.log("Resending the run request.");
            xhr.abort();
            sendRunRequest();
        } else {
            // Don't do anything
        }
    };

    // Send the request
    var body = JSON.stringify(selection);
    xhr.send(body);
}


function setNextResultsPoll() {

    if (_cancel === false) {
        // Poll again
        _pollTimer = setTimeout(sendResultsRequest, POLL_INTERVAL);
    } else {
        // Do nothing.  This effectively prevents the client from polling again.
    }
}



// A helper function for sending requests on the "/results" channel
function sendResultsRequest() {

    // The number of previously pending wells (according to the server)
    var nPending = 0;

    // Set up the HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open("POST", SEQUENCER_RESULTS_URL, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.onreadystatechange = function() {
        // If the request has been successfully received start the polling process
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

            var responseJSON = xhr.responseText;
            console.log("Received response for the results request:");
            console.log(responseJSON);

            var response = JSON.parse(responseJSON);

            if (response.error != undefined) {
                // Handle the error
            }

            var pendingServer = response.pending;
            // Should check that the client and server are in sync...
            var results = response.results;

            var obj = processResults(results);
            var newResults = obj.new;
            var blankWells = obj.blank;

            // Update the list of pending wells
            var newPending = updatePending(results);

            // If there was a change, update the UI
            if (newResults.length > 0 || blankWells.length > 0 ||
                pendingServer.length < nPending) {

                nPending = pendingServer.length;
                updateDisplay(newResults, blankWells, pendingServer, false);
            }

            // Check if the run is complete
            if (newPending.length === 0 || pendingServer.length === 0) {
                // The run is complete!
                runComplete();
            } else {
                // Start the timer for the next results request
                setNextResultsPoll();
                // Update the UI with the latest results
            }
        }
    };

    xhr.timeout = POLL_TIMEOUT;
    xhr.ontimeout = function(e) {
        console.log("Results request timed out.");
        if (_cancel === false) {
            console.log("Resending the results request.");
            xhr.abort();
            sendResultsRequest();
        } else {
            // Don't do anything
        }
    };

    // Send the request
    var body = JSON.stringify(_pendingWells);
    console.log("Pending wells:  " + _pendingWells);
    xhr.send(body);
}



// Process the results payload
function processResults(results) {
    // results:  An array of {well, data} objects

    // Maintain a list of new results for Chartjs
    var newResults = [];
    // Also report back a list of blank wells
    var blankWells = [];

    // If this is an empty list, then do nothing
    if (results.length === 0) {
        // Do nothing
    } else {
        // Extract each result, add the well, then append to the results lists
        results.forEach(function(wr) {
            var well = wr.well;
            var data = wr.data;

            if (data.length === 0) {
                // The well is blank!
                blankWells.push(well);
            } else {
                data.forEach(function(res) {
                    // Create the new row
                    var result = { "well" : well,
                                   "analyte" : res.analyte,
                                   "reading" : parseFloat(res.reading)
                                 };

                    // Append this to the "new" and global results objects
                    newResults.push(result);
                    _results.push(result);
                });
            }
        });

        // Re-calculate the aggregate
    }

    return { new : newResults, blank : blankWells };
}


function updatePending(results) {

    // Get the wells run with this results list
    var wells = results.map(function(wr) {
        return wr.well;
    });

    // Remove the received wells from the list of pending wells
    var wellSet = new Set(wells);
    var pendingSet = new Set(_pendingWells);
    wellSet.forEach(function(well){
        pendingSet.delete(well);
    });

    // Convert back to an array, sort and save
    var pendingWells = Util.sortWells(Array.from(pendingSet));

    // Store this globally, in case you'll need it in other contexts
    _pendingWells = pendingWells;

    return pendingWells;
}


function updateDisplay(newResults, blankWells, serverPending, cancel) {

    // Update the plot
    _plotui.updateData(_results);  // This is easier than appending to the plot's table

    // Update the progress indicator plate
    var runWells = Util.getWells(_results);  // Easier just to update this globally...
    // Assume that the first well of the server's response is the next well to be run
    if (cancel) {
        _currentWell = null;
    } else {
        _currentWell = (serverPending.length > 0) ? serverPending[0] : null;
    }
    Progress.update(runWells, blankWells, _currentWell);

}


function cancelRun() {
    // Cancel any pending run requests

    // Let the client finish any transaction currently in progress
    _cancel = true;

    // Stop any queued results requests
    if (_pollTimer !== null) {
        clearTimeout(_pollTimer);
    }

    // Spin the cursor and bring up the "Wait" modal
    $(document.body).css({'cursor': 'wait'});
    $('#wait-cancel-modal').modal('show');

    // Send the cancel request
    sendCancelRequest();

    // Other cancellation tasks
    // !!! TODO !!!

    // Similar to runComplete...
    // !!! TODO !!!
}


// Send the Cancel request
function sendCancelRequest() {

    // The number of previously pending wells (according to the server)
    var nPending = 0;

    // Set up the HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open("POST", SEQUENCER_CANCEL_URL, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    xhr.onreadystatechange = function() {
        // If the request has been successfully received start the polling process
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

            var responseJSON = xhr.responseText;
            console.log("Received response for the cancellation request:");
            console.log(responseJSON);

            // Process the results up-front
            var response = JSON.parse(responseJSON);
            var pendingServer = response.pending;
            // Should check that the client and server are in sync...
            var results = response.results;

            var obj = processResults(results);
            var newResults = obj.new;
            var blankWells = obj.blank;

            // Update the list of pending wells
            var newPending = updatePending(results);

            // Get the list of returned wells
            var returnedWells = blankWells.concat(Util.getWells(newResults));
            if (returnedWells.length > 0 || pendingServer.length < nPending) {
                // There was a change; update the display
                nPending = pendingServer.length;
                updateDisplay(newResults, blankWells, pendingServer, true);
            }

            // If there's any current well after this, clear it
            Progress.abort();

            // Now finish the cancellation
            finishCancel();
        }

    };

    // Don't timeout here (for now...)...

    // Send the request
    var body = JSON.stringify(_pendingWells);
    console.log("Cancelling the run...");
    console.log("Pending wells:  " + _pendingWells);
    xhr.send(body);
}


function finishCancel() {

    // Eject plate, etc., like runComplete

    // Change the cursor back
    $(document.body).css({'cursor': 'default'});

    // Dismiss the "Wait" modal and bring up the "Cancelled" modal
    $( '#wait-cancel-modal' ).modal('hide');
    $( '#cancel-done-modal').modal('show');

    // Change the Cancel button to a New Run button
    // It would be more proper to tie this to the OK button,
    // but this shouldn't cause problems...
    $( '#cancel-new-run-btn')
        .removeClass('btn-danger')
        .addClass('btn-success')
        .text("Start a new run")
        .attr('data-target', '#new-run-modal');

    // Enable the "Eject plate" button
    enableEjectButton();
}


function runComplete() {
    console.log("Run complete.");

    // Bring up the "Run done!" modal
    $( '#done-modal').modal('show');

    // Change the Cancel button to a New Run button
    $( '#cancel-new-run-btn')
        .removeClass('btn-danger')
        .addClass('btn-success')
        .text("Start a new run")
        .attr('data-target', '#new-run-modal');

    // Enable the "Eject plate" button
    enableEjectButton();
}


function newRun() {

    // Reloading the browser may be all we need...
    location.reload(true);

}


function ejectPlate(doneHandler, errorHandler) {

    // First, spin the cursor and bring up the "Ejecting..." dialog
    $(document.body).css({'cursor': 'wait'});
    $( '#eject-modal').modal('show');
    // This effectively blocks the flow of control until the eject command
    // receives a response

    // Clean up after the eject
    var cleanup = function() {
        // Change the cursor back
        $(document.body).css({'cursor': 'default'});

        // Dismiss the "Ejecting..." modal
        $( '#eject-modal' ).modal('hide');
    };

    var doneHandlerMod = function() {
        cleanup();
        // Now signal that the event is finished
        doneHandler();
    };

    var errorHandlerMod = function() {
        cleanup();
        errorHandler();
    };


    // Now send the eject command
    sendEjectRequest(doneHandlerMod, errorHandlerMod);

}


function sendEjectRequest(doneHandler, errorHandler) {

    // Set up the HTTP request
    var xhr = new XMLHttpRequest();
    xhr.open("POST", SEQUENCER_EJECT_URL, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    xhr.onreadystatechange = function () {

        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            // !!! Should check the response text as well!!!

            // Dump the contents to sdtout
            var responseJSON = xhr.responseText;
            console.log("Received '/eject' response:");
            console.log(responseJSON);

            var response = JSON.parse(responseJSON);

            // Ignore the response, except if there's an error
            if (response.error == undefined) {
                // Success!
                doneHandler();
            } else {
                // Error!
                console.log("There was an error upon eject:");
                console.log(response.error);
                // Handle the error
                errorHandler(response.error);
            }
        }
    };

    // Don't timeout here...

    // Send the request
    console.log("Sending the '/eject' request.");
    xhr.send(null);
}


function handleEjectError(msg) {
    console.log("There was an error with the \eject command");
    console.log(msg);
}


function finishEject() {

    // Show the "Eject Done" modal
    $( '#eject-done-modal').modal('show');

    // Disable the 'Eject' button
    disableEjectButton();
}


function disableEjectButton() {
    $( '#eject-plate-btn' ).prop('disabled', true);
}

function enableEjectButton() {
    $( '#eject-plate-btn').prop('disabled', false);
}
