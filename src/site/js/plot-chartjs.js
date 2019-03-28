"use strict";


// ----- Includes -----
var Chartjs = require("chart.js");
var d3 = require("d3");

var Util = require("util.js");


// ----- Constants -----

var POINTS_DS_LABEL = "Reading";
var POINTS_STYLE = 'point';
var POINTS_RADIUS = 3;  // 3 is the default
var POINTS_BG_COLOR = "rgba(0, 0, 127, 0.5)";
var POINTS_BORDER_WIDTH = 1;  // 1 is the default
var POINTS_BORDER_COLOR = "rgba(0, 0, 0, 0.5)";
var POINTS_HIT_RADIUS = 3;
var POINTS_HOVER_RADIUS = 3;  // 1 is the default
var POINTS_HOVER_WIDTH = 2;

var MEDIANS_DS_LABEL = "Median reading";
var MEDIANS_STYLE = 'rect';
var MEDIANS_BG_COLOR = "rgba(0, 0, 0, 0.0)";
var MEDIANS_RADIUS = 7;
var MEDIANS_BORDER_WIDTH = 2;
var MEDIANS_BORDER_COLOR = "rgba(255, 0, 0, 0.9)";
var MEDIANS_HIT_RADIUS = 8;
var MEDIANS_HOVER_RADIUS = 8;
var MEDIANS_HOVER_WIDTH = 8;

var MEDIANS_DS_INDEX = 0;
var POINTS_DS_INDEX = 1;



// ----- Globals -----

var gData = null;


// ----- Initialization -----

function initialize() {

    // Set some defaults
    Chartjs.defaults.global.tooltips.enabled = true;
    Chartjs.defaults.global.defaultFontColor = 'black';

    return;
}



// ----- Classes -----


// ByAnalytePlot class
function ByAnalytePlot(data, analyte, wells, analytes, dslabel, staggerx) {
    // The wells will be known prior to the run; the analytes may not
    this.data = data;
    this.analyte = analyte;
    this.wells = wells;
    this.analytes = analytes;
    this.dslabel = dslabel;
    this.staggerx = staggerx;

    this.plot = null;
    this.canvas = null;
}


ByAnalytePlot.prototype.render = function(canvas) {
    this.canvas = canvas;
    this.plot = renderPlotByAnalyte(this.data, this.analyte, this.wells,
                                    this.canvas, null, this.dslabel, this.staggerx);
};


ByAnalytePlot.prototype.update = function(newdata) {
    // For simplicity, just copy the entire dataset, rather than updating it
    // Update the stored dataset
    this.data = newdata;

    // Reshape the data set
    var pointsData = prepareByAnalyteData(this.data, this.analyte);
    var mediansData = prepareByAnalyteMedians(this.data, this.analyte);

    // Update the plot
    if (this.plot !== null) {
        // The individual-bead series
        this.plot.data.datasets[0].data = mediansData;
        this.plot.data.datasets[1].data = pointsData;

        this.plot.update();
    }
};


ByAnalytePlot.prototype.destroy = function() {
    this.canvas = null;
    this.plot.destroy();
};


// ByWellPlot class
function ByWellPlot(data, well, wells, analytes, dslabel, staggerx) {
    // The wells will be known prior to the run; the analytes may not
    this.data = data;
    this.well = well;
    this.wells = wells;
    this.analytes = analytes;
    this.dslabel = dslabel;
    this.staggerx = staggerx;

    this.plot = null;
    this.canvas = null;

}


ByWellPlot.prototype.render = function(canvas) {
    this.canvas = canvas;
    this.plot = renderPlotByWell(this.data, this.well, this.analytes,
                                 this.canvas, null, this.dslabel, this.staggerx);
};


// Actually, this may never be needed...
ByWellPlot.prototype.update = function(newdata) {
    // For simplicity, just copy the entire dataset, rather than updating it
    // Update the stored dataset
    this.data = newdata;

    // Reshape the data set
    var pointsData = prepareByWellData(this.data, this.well);
    var mediansData = prepareByWellMedians(this.data, this.well);

    // Update the plot
    if (this.plot !== null) {
        this.plot.data.datasets[0].data = mediansData;
        this.plot.data.datasets[1].data = pointsData;

        this.plot.update();
    }
};


ByWellPlot.prototype.destroy = function() {
    this.canvas = null;
    this.plot.destroy();
};



// ---  Plotting functions ---


function buildXAxis(label, stagger) {
    var callback;
    if (stagger) {
        // Offset the tick labels
        callback = function(value, index, values) {
            if (index % 2 == 1) {
                // Get the max string length
                var spaces = values.reduce(function(a,b) {
                    return Math.max(a.toString().length, b.toString().length);
                });
                return value + " ".repeat(2 * spaces + 1);
            } else {
                return value.toString();
            }
        };
    } else {
        // Don't offset
        callback = function(value) {return value.toString();};
    }

    var axis = {
        // This causes some cut-off issues...
        type: 'category',  
        ticks: {
            beginAtZero: false,
            maxRotation: 90,
            minRotation: 90,
            fontSize: 10,
            callback: callback
        },
        scaleLabel : {
            display : true,
            labelString : label
        },
        gridLines : {
            offsetGridLines : true,
            zeroLineColor : 'black'
        }
    };

    return axis;
}


function buildYAxis(ymax) {

    var ticks;
    if (ymax == null) {
        ticks = { beginAtZero: true };
    } else {
        ticks = {
            beginAtZero: true,
            suggestedMax: ymax };
    }
    var axis = {
        ticks: ticks,
        scaleLabel : {
            display : true,
            labelString : "Reading"
        },
        gridLines : {
            zeroLineColor : 'black'
        }
    };

    return axis;
}


function buildOptions(xAxis, yAxis, plotMode, title) {

    var options = {
        legends: {
            display: false
        },
        scales: {
            xAxes : [xAxis],
            yAxes : [yAxis]
        },
        responsive: true,
        title : {
            display : true,
            text : title,
            fontSize: 14
        },
        tooltips: {
            mode: 'nearest',
            displayColors: false,
            callbacks: {
                label : function(toolTipItem, data) {
                    // For some reason Chartjs doesn't return the right values...
                    var dsIndex = toolTipItem.datasetIndex;
                    var datumIndex = toolTipItem.index;
                    var pair = data.datasets[dsIndex].data[datumIndex];
                    var xval = pair.x.toString();
                    var yval = pair.y.toString();

                    var label = [];
                    if (plotMode == 'by-analyte') {
                        label.push("Well:\t" + xval);
                    } else if (plotMode == 'by-well') {
                        label.push("Analyte:\t" + xval);
                    }
                    label.push("Reading: " + yval);
                    if (dsIndex == MEDIANS_DS_INDEX) {
                        var count = pair.count.toString();
                        label.push("Count:\t" + count);
                    }

                    return label;
                }
            }
        }
    };

    return options;
}


function buildDataObj(datasets, tickLabels) {

    var dataObj = {
        xLabels: tickLabels,
        datasets: datasets
    };

    return dataObj;
}


function buildPointsDataset(data) {

    var ds = {
        label: POINTS_DS_LABEL,
        data: data,
        pointStyle : POINTS_STYLE,
        radius : POINTS_RADIUS,
        backgroundColor: POINTS_BG_COLOR,
        borderWidth: POINTS_BORDER_WIDTH,
        borderColor: POINTS_BORDER_COLOR,
        hitRadius : POINTS_HIT_RADIUS,
        hoverRadius: POINTS_HOVER_RADIUS,
        hoverBorderWidth: POINTS_HOVER_WIDTH
    };

    return ds;
}


function buildMediansDataset(data) {

    var ds = {
        label: MEDIANS_DS_LABEL,
        data: data,
        pointStyle : MEDIANS_STYLE,
        radius : MEDIANS_RADIUS,
        backgroundColor: MEDIANS_BG_COLOR,
        borderWidth: MEDIANS_BORDER_WIDTH,
        borderColor: MEDIANS_BORDER_COLOR,
        hitRadius : MEDIANS_HIT_RADIUS,
        hoverRadius: MEDIANS_HOVER_RADIUS,
        hoverBorderWidth: MEDIANS_HOVER_WIDTH
    };

    return ds;
}


function buildSpec(dataObj, options) {
    var spec = {
        type : 'scatter',
        data : dataObj,
        options: options
    };

    return spec;
}


function prepareByAnalyteData(data, analyte) {
    var prepped = data
        .filter(function(d) {
            return d.analyte == analyte;
        })
        // Remap the data for Chart.js
        .map(function(d) {
            return { "x" : d.well, "y" : d.reading };
        });

    return prepped;
}


function prepareByAnalyteMedians(data, analyte) {

    // Get results just for this analyte
    var filtered = data.filter(function(d) {
        return d.analyte == analyte;
    });

    // Create the summary
    var summary = Util.calcMedians(filtered);

    // Remap the data for Chart.js
    var chartData = summary.map(function(d) {
        return { "x" : d.well, "y" : d.median, "count" : d.count };
    });

    return chartData;
}


function renderPlotByAnalyte(data, analyte, wells, canvas, ymax, dslabel, staggerx) {
    // canvas:  The canvas element

    // Get the well names
    if (wells == null || wells.length ===0) {
        wells = Util.getWells(data);
    }

    // Filter the data by analyte
    var chartData = prepareByAnalyteData(data, analyte);
    var mediansData = prepareByAnalyteMedians(data, analyte);

    // Fix the y-axis scale for all plots
    if (ymax == null) {
        var vals = data.map(function(d) {return parseInt(d.reading);});
        if (vals.length !== 0) {
            ymax = Math.max.apply(null, vals);
        } else {
            // Leave ymax null; this will build the axis without a suggestedMax
            ymax = null;
        }
    }

    if (dslabel === undefined) {
        dslabel = "Readings";
    }

    // Build the plot spec
    var xAxis = buildXAxis("Well", staggerx);
    var yAxis = buildYAxis(ymax);
    var title = "Analyte " + analyte;
    var options = buildOptions(xAxis, yAxis, 'by-analyte', title);
    var pointsDS = buildPointsDataset(chartData);
    var mediansDS = buildMediansDataset(mediansData);
    var xLabels = wells;
    var dataObj = buildDataObj([mediansDS, pointsDS], xLabels);
    var spec = buildSpec(dataObj, options);

    // Save this, just in case...
    var chart = new Chartjs(canvas, spec);

    return chart;

}


// Cast the data into Chartjs format
function prepareByWellData(data, well) {

    var prepped = data
        .filter(function(d) {
            return d.well == well;
        })
        // Remap the data for Chart.js
        .map(function(d) {
            return { "x" : d.analyte.toString(), "y" : d.reading };
        });

    return prepped;
}


function prepareByWellMedians(data, well) {

    // Get results just for this analyte
    var filtered = data.filter(function(d) {
        return d.well == well;
    });

    // Create the summary
    var summary = Util.calcMedians(filtered);

    // Remap the data for Chart.js
    var chartData = summary.map(function(d) {
        return { "x" : d.analyte.toString(), "y" : d.median , "count" : d.count };
    });

    return chartData;
}


function renderPlotByWell(data, well, analytes, canvas, ymax, dslabel, staggerx) {
    // Get the analytes
    if (analytes == null || analytes.length === 0) {
        analytes = Util.getAnalytes(data);
    }

    // Filter the data by well
    var chartData = prepareByWellData(data, well);
    var mediansData = prepareByWellMedians(data, well);

    if (ymax == null) {
        var vals = data.map(function(d) {return parseInt(d.reading);});
        if (vals.length !== 0) {
            ymax = Math.max.apply(null, vals);
        } else {
            // Leave ymax null; this will build the axis without a suggestedMax
            ymax = null;
        }
    }

    if (dslabel === undefined) {
        dslabel = "Readings";
    }

    // Build the plot spec
    var xAxis = buildXAxis("Analyte", staggerx);
    var yAxis = buildYAxis(ymax);
    var title = "Well " + well;
    var options = buildOptions(xAxis, yAxis, 'by-well', title);
    var pointsDS = buildPointsDataset(chartData);
    var mediansDS = buildMediansDataset(mediansData);
    var xLabels = analytes.map(function(d) {return d.toString();});
    var dataObj = buildDataObj([mediansDS, pointsDS], xLabels);
    var spec = buildSpec(dataObj, options);

    // Save this, just in case...
    var chart = new Chartjs(canvas, spec);

    return chart;

}


// ----- Exports -----

module.exports = {
    initialize : initialize,
    ByAnalytePlot : ByAnalytePlot,
    ByWellPlot : ByWellPlot,
    renderPlotByAnalyte : renderPlotByAnalyte,
    renderPlotByWell : renderPlotByWell
};
