// ----- Imports -----

var d3 = require('d3');

var Util = require('./util.js');


// ----- Constants -----

var PLATE_SVG = "progress-plate-svg";
var PLATE_CONTAINER = "progress-plate";
var PLATE_BACKGROUND = "progress-plate-background";
var PLATE_BASE = "progress-plate-base";
var WELLS_ID = "progress-wells";
var WELL_BASE = "progress-well-";
var COL_LABELS = "progress-col-labels";
var ROW_LABELS = "progress-row-labels";

var WELL_CLASS = "well";

var SELECTION_RECT_ID = "selection-rect";



// ----- Globals -----

var _container;
var _loaded = false;

var _currentWell;


// ----- Initialization -----


// Load the SVG plate image
function initialize(svgfile, container) {

    // Load the SVG plate, and run any startup scripts
    _container = container;
    loadSVGImage(svgfile, container);
}


// Load and insert an SVG image
function loadSVGImage(file, container) {
    d3.xml(file).
        mimeType("image/svg+xml").
        get(function(error, xml) {
            if (error) throw error;

            var element = xml.documentElement;

            // Insert the image
            container.appendChild(element);

            // Set the width and height within the SVG element
            // to allow it to expand to the size of its parent
            element.style.width = "100%";
            element.style.height = "100%";

            // Clear all states
            clearAllStates();

            _loaded = true;  // Probably not the best place for this...
        });
}



function start(selection, firstWell) {

    // Set the pending wells
    selection.forEach(function(well) {
        changeWellState(well, 'progress-pending');
    });

    // Set the first well
    if (firstWell != null) {
        _currentWell = firstWell;
        changeWellState(firstWell, 'progress-current');
    }
}


function update(runWells, blankWells, currentWell) {
    // Update the read wells
    runWells.forEach(function(well) {
        // It's okay that this momentarilly changes blank wells as well
        changeWellState(well, 'progress-read');
    });

    // Update any blank wells
    blankWells.forEach(function(well) {
        changeWellState(well, 'progress-blank');
    });

    // Update the current well
    if (currentWell != null) {
        // Hopefully this will cascade in the right way
        changeWellState(currentWell, 'progress-current');
    }

    _currentWell = currentWell;
}


// Abort a run
function abort() {
    var elements = document.querySelectorAll("#" + WELLS_ID + " .well");

    // Assume that all flashing wells are unread
    elements.forEach(function(element) {
        if (element.classList.contains('progress-current')) {
            element.classList.remove('progress-current');
            element.classList.add('progress-pending');
        }
    });
}


// Mark an error well
function updateError(well) {
    changeWellState(well, 'progress-error');
}


function changeWellState(well, newState) {
    // newState = 'progress-read', 'progress-pending', 'progress-current',
    // 'progress-exclude', 'progress-error'
    var id = getWellId(well);
    var element = document.getElementById(id);

    // Remove all the states
    element.classList.remove('progress-read');
    element.classList.remove('progress-pending');
    element.classList.remove('progress-current');
    element.classList.remove('progress-excluded');
    element.classList.remove('progress-blank');
    element.classList.remove('progress-error');

    // Now set the class
    element.classList.add(newState);

}


// Clear the state of all wells
function clearAllStates() {
    var elements = document.querySelectorAll("#" + WELLS_ID + " .well");

    // Mark all wells as "excluded"
    elements.forEach(function(element) {
        // Remove all the states
        element.classList.remove('progress-read');
        element.classList.remove('progress-pending');
        element.classList.remove('progress-current');
        element.classList.remove('progress-blank');
        element.classList.remove('progress-error');

        // Set all wells to 'excluded' by default
        element.classList.add('progress-excluded');
    });
}


function getWellId(well) {
    var coords = Util.getWellRowCol(well);
    var id = WELL_BASE + coords.row.toString() + '-' + coords.col.toString();

    return id;
}



module.exports = {
    initialize : initialize,
    start : start,
    update : update,
    abort : abort,
    updateError : updateError,
    clearAllStates : clearAllStates
};
