// plot-ui-chart.js

// TODO
// 
// * Test PlotUI.chooseFileHandler (not critical)



"use strict";

// ----- Imports -----


// Local includes
var Util = require('util.js');
var Plot = require('./plot-chartjs.js');


// ----- Constants -----

// HTML input element IDs
var PLOT_CANVAS_ID = "plot-canvas";
var FILE_CHOOSER_ID = "file-chooser";
var SELECTION_CONTAINER_ID = "selection-container";
var SELECTION_LIST_ID = "selection-list";
var SELECTION_LABEL_ID = "selection-label";


// ----- Globals -----


// ----- Initialization -----

document.addEventListener("DOMContentLoaded", initialize);


function initialize() {
    Plot.initialize();

}


// ----- The Plot UI -----


function PlotUI(canvas, byWellRadio, byAnalyteRadio, selContainer, selList, selLabel,
                fileChooser) {
    // canvas, etc.:  DOM objects

    var self = this;  // Since "this" is redefined in nested functions...

    this.canvas = canvas;
    this.byWellRadio = byWellRadio;
    this.byAnalyteRadio = byAnalyteRadio;
    this.selContainer = selContainer;
    this.selList = selList;
    this.selLabel = selLabel;
    this.fileChooser = fileChooser;

    this.plot = null;
    this.oldmode = null; // The last plot mode
    this.data = [];
    // "wells" and "analytes" are for the x-axis of the plot; the dropdown
    // list will pull what it needs from the data;
    this.wells = [];
    this.analytes = [];

    // Bind events

    // The file chooser is optional;
    // It's mostly for self-contained tests of this class
    if (this.fileChooser != null) {
        this.fileChooser.onchange = this.chooseFileHandler.bind(this);
    }
    // The "plot mode" radio buttons
    this.byWellRadio.addEventListener('click',
                                      self.modeClickHandler.bind(self) );
    this.byAnalyteRadio.addEventListener('click',
                                         self.modeClickHandler.bind(self) );

    // Set the initial dropdown label
    this.changeDropdown();
}


// Call this when first starting out
PlotUI.prototype.initialize = function(data, wells, analytes) {
    if (data != null) {
        this.data = data;
    } else {
        this.data = [];
    }

    if (wells != null) {
        this.wells = wells;
    } else {
        this.wells = [];
    }

    if (analytes != null) {
        this.analytes = analytes;
    } else {
        this.analytes = [];
    }

    // Set up the UI
    this.updateDropdown();

    // Render the initial plot, if necessary
    if (this.data.length !== 0) {
        this.renderPlot();
    }
};


PlotUI.prototype.getPlotMode = function() {
    var mode = getRadioChecked([this.byWellRadio, this.byAnalyteRadio]);

    return mode;
};

PlotUI.prototype.getSelection = function() {
    return this.selList.value;
};


PlotUI.prototype.bindData = function(data) {
    this.data = data;
};


// Update the data and any data-related hooks
PlotUI.prototype.updateData = function(newdata) {
    // The data should be formatted as {well, analyte, reading}
    this.bindData(newdata);

    // Update the UI elements
    this.updateDropdown();

    // Render or update this plot
    if (this.plot == null) {
        this.renderPlot();
    } else {
        this.plot.update(newdata);
    }
};


// Change the subplot with a analyte, well, or plot mode change
PlotUI.prototype.renderPlot = function() {
    // analytes: A list of expected analytes (optional)
    // wells: A list of expected wells (optional)

    // Get the plot mode ("by-analyte" or "by-well") and the choice
    var mode = this.getPlotMode();
    var value = this.getSelection();
    if (value == "" || value == null) {
        // Don't do anything
        return;
    }

    // Build the plot
    // Don't overwrite this.plot until the canvas has been cleared...
    var plot;
    var staggerx = false;
    if (mode == "by-analyte") {
        // Stagger the x tick labels if there are too many wells
        if (this.wells.length > 80) {
            // Should set this relative to the canvas size, and the size of the labels
            staggerx = true;
        }
        plot = new Plot.ByAnalytePlot(this.data, value,
                                      this.wells, this.analytes,
                                      "Individual reading",  // May not be descriptive enough...
                                      staggerx);
    } else if (mode == "by-well") {
        // Stagger the x tick labels if there are too many analytes
        if (this.analytes.length > 80) {
            // Should set this relative to the canvas size, and the size of the labels
            staggerx = true;
        }

        plot = new Plot.ByWellPlot(this.data, value,
                                   this.wells, this.analytes,
                                   "Individual reading",
                                   staggerx);
    }

    // Now render it in the canvas
    this.clearCanvas();

    this.plot = plot;
    this.plot.render(this.canvas);
};


// "Clear" the canvas
PlotUI.prototype.clearCanvas = function() {
    if (this.plot !== null) {
        this.plot.destroy();
    }
};


// Handle changes in the plot mode
PlotUI.prototype.modeClickHandler = function() {
    var mode = this.getPlotMode();

    if (mode == null || mode == this.oldmode) {
        // No change
    } else {
        this.changeDropdown();
        this.renderPlot();
    }

    return;
};


PlotUI.prototype.updateDropdownLabel = function(text) {
    this.selLabel.innerText = text;
};


PlotUI.prototype.buildAnalyteDropdown = function(selection) {
    if (this.data !== null) {
        // Build the dropdown
        var analytes = Util.getAnalytes(this.data);
        var self = this;
        buildDropdown(analytes, this.selList, function(event) {
            self.renderPlot.bind(self)();
        }, selection);

    } else {
        // Clear the dropdown, or do nothing?
    }
};


PlotUI.prototype.buildWellsDropdown = function(selection) {
    if (this.data !== null) {
        // Build the dropdown
        var wells = Util.getWells(this.data);
        var self = this;
        buildDropdown(wells, this.selList, function(event) {
            self.renderPlot.bind(self)();
        }, selection);
    } else {
        // Clear the dropdown, or do nothing?
    }
};


// Update the dropdown with new data
PlotUI.prototype.updateDropdown = function() {

    // Get the plotting mode (by analyte, or by well)
    var mode = this.getPlotMode();
    var selection = getDropdownSelection(this.selList);

    // First, clear the existing dropdown
    clearDropdown(this.selList);

    // Now update the dropdown list
    // For simplicity, still update even if it isn't necessary...
    if (mode == "by-analyte") {
        // this.buildAnalyteDropdown(parseInt(selection));
        this.buildAnalyteDropdown(selection);

    } else if (mode == "by-well") {
        this.buildWellsDropdown(selection);

    } else if (mode === null) {
        throw Error("No mode checked in the checkbox.");
    }

};


// Change the dropdown on a mode change
PlotUI.prototype.changeDropdown = function() {

    // Get the plotting mode (by analyte, or by well)
    var mode = this.getPlotMode();
    if (mode != this.oldmode) {  // This even handles the case that both are null
        this.oldmode = mode;
        // Build the dropdown

        // First, clear the existing dropdown
        clearDropdown(this.selList);

        // Now build the dropdown list
        if (mode == "by-analyte") {
            this.updateDropdownLabel("Analyte:");
            this.buildAnalyteDropdown();

        } else if (mode == "by-well") {
            this.updateDropdownLabel("Well:");
            this.buildWellsDropdown();

        } else if (mode === null) {
            throw Error("No mode checked in the checkbox.");
        }
    } else {
        // No change; do nothing
    }

};

// Not sure if the code below works...
PlotUI.prototype.chooseFileHandler = function() {
    // Get the file object
    var file = getChosenFile(this.fileChooser);

    // Load the file, parse it and display the data
    var self = this;
    Util.loadFile(file, function(text) {

       data = Util.parseData(text); 

        // Bind the data to the PlotUI object
        self.bindData(data);
        self.updateDropdown();
        self.renderPlot();
    });
};


// Reset the input elements
PlotUI.prototype.resetInputs = function() {

    // Reset the mode
    setRadioChecked([this.byWellRadio, this.byAnalyteRadio], 0);
    this.updateDropdownLabel("Well:");

    // Clear the dropdown
    clearDropdown(this.selList);

    // Remove the event handlers
    var self = this;
    this.byWellRadio.removeEventListener('click',
                                         self.modeClickHandler.bind(self));
    this.byAnalyteRadio.removeEventListener('click',
                                            self.modeClickHandler.bind(self));
};


// Destroy the object
PlotUI.prototype.destroy = function() {

    // Clear the canvas
    this.clearCanvas();

    // Reset the UI inputs
    this.resetInputs();

};



// ----- Utility functions -----


function getChosenFile(input) {
    // input: The file input element
    var files = input.files;

    var file;
    if (files.length === 0) {
        // No files were selected
        file = null;
    } else {
        // Just return the first file
        file = files[0];
    }

    return file;
}


// Get the checked value of a radio button
function getRadioChecked(inputs) {
    // Inputs:  An array of radio input elements

    // Find the one that's checked
    var value = null;
    for (var i = 0; i < inputs.length; i++){
        if (inputs[i].checked) {
            value = inputs[i].value;
            break;
        }
    }

    return value;
}


function setRadioChecked(inputs, index) {

    inputs.forEach(function(input, idx) {
        if (idx == index) {
            input.setAttribute('checked', 'checked');
        } else {
            input.removeAttribute('checked');
        }
    });

}


// Create a dropdown list
function buildDropdown(items, selList, changedHandler, selection) {
    // items:  An array of strings
    // selList:  The selection list (dropdown) element

    var option;

    var item;
    for (var i = 0; i < items.length; i++) {
        item = items[i];
        option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selList.add(option);
    }

    selList.onchange = changedHandler;

    // Set the selection
    if ((new Set(items)).has(selection) ) {
        selList.value = selection;
    } else {
        // Let it set it to the default value
    }

    // Not strictly needed...
    return selList;
}


function clearDropdown(selList) {

    while (selList.firstChild) {
        selList.removeChild(selList.firstChild);
    }
}


// This may not work well...
function getDropdownSelection(selList) {

    var value = selList.value;

    return value;
}


// ----- Exports -----

module.exports = {
    initialize : initialize,
    PlotUI : PlotUI
};
