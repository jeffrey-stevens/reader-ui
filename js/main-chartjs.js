"use strict";

// ----- Imports -----

// Local includes
var PlotUI = require('./plot-ui-chartjs.js');


// ----- Initialization -----

var _plotui;


document.addEventListener("DOMContentLoaded", function(event) {
    // Initialize the module
    PlotUI.initialize();

    var canvas = document.getElementById('plot-canvas');
    var plotModeRadioInputs = Array.from(document.getElementsByName("plot-mode"));
    var selContainer = document.getElementById('selection-container');
    var selList = document.getElementById('selection-list');
    var selLabel = document.getElementById('selection-label');
    var fileChooser = document.getElementById('file-chooser');

    _plotui = new PlotUI.PlotUI(canvas, plotModeRadioInputs, selContainer, selList, selLabel, fileChooser);
});
