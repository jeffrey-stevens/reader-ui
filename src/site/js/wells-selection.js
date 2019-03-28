// ----- Imports -----

var d3 = require('d3');

var Util = require('util.js');


// ----- Constants -----

var PLATE_SVG = "plate-svg";
var PLATE_CONTAINER = "plate";
var PLATE_BACKGROUND = "plate-background";
var PLATE_BASE = "plate-base";

var SELECTION_RECT_ID = "selection-rect";


// ----- Events -----

// Signal when a selection event (click or drag) has completed
var selDoneEvent = new CustomEvent('selection-done');


// ----- Initialization -----


// Load the SVG plate image
function initialize(svgfile, container) {

    // Load the SVG plate, and run any startup scripts
    loadSVGImage(svgfile, container, setupSVGPlate);
}


// Load and insert an SVG image, running a callback function upon load
function loadSVGImage(file, container, loadHandler) {
    d3.xml(file).
        mimeType("image/svg+xml").
        get(function(error, xml) {
            if (error) throw error;
            console.log("Loading SVG file...");
            // Insert the image
            container.appendChild(xml.documentElement);

            // Now do something
            loadHandler();
        });
}


// ----- Utility functions -----


function dist(x, y) {
    return Math.sqrt(x*x + y*y);
}


// Checks if a circle and a rectange intersect
function intersects(cx, cy, r, x0, y0, x1, y1) {
    // A circle intersects a rectangle iff it's center is within
    // the dilation of the rect by the circle.

    // First, find the "edges" of the dilated rectangle,
    // not counting the rounded corners
    var xmin = Math.min(x0, x1);
    var xmax = Math.max(x0, x1);
    var ymin = Math.min(y0, y1);
    var ymax = Math.max(y0, y1);

    var result = false;

    // First, see if the center of the circle is the horizontal or vertical
    // subtended rectangle
    if (cx >= xmin - r && cx <= xmax + r &&
        cy >= ymin && cy <= ymax ) {
        result = true;
    }
    else if (cx >= xmin && cx <= xmax &&
            cy >= ymin - r && cy <= ymax + r) {
        result = true;
    }
    // The only case that remains is at the rounded corners.
    // It's easiest just to check the distance of the center from the corners...
    else if ( dist(xmin - cx, ymin - cy) <= r ||
              dist(xmin - cx, ymax - cy) <= r ||
              dist(xmax - cx, ymin - cy) <= r ||
              dist(xmax - cx, ymax - cy) <= r ) {
        // The circle intersects with at least one corner
        result = true;
    } else {
        // There's no intersection
        result = false;
    }

    return result;
}


// Get the well name from the well ID
function wellIdToWellName(id) {
    // Well IDs are of the form 'well-x-y':
    var split = id.split('-');

    // Check that this is correct
    if (split[0] != 'well') {
        throw Error("Incorrect well ID format.");
    }

    // Get the well name from the row and column
    var row = split[1], col = split[2];
    var well = Util.getWellName(row, col);

    return well;
}


// Return an array of selected wells
function getSelectedWells() {
    // Find all selections
    var wells = document.querySelectorAll('.well.selected');

    // Get the well names
    var selection = [];
    wells.forEach(function(well) {
        // Get the well name from the ID
        var wellname = wellIdToWellName(well.id);

        selection.push(wellname);
    });

    // Sort this
    selection = Util.sortWells(selection);

    return selection;
}


// ----- Widget-related functions -----


// Set up the wells selection scripts
function setupSVGPlate() {

    var doc = d3.select(document);
    var svg = d3.select('#' + PLATE_SVG);
    var bg = d3.select('#' + PLATE_BACKGROUND);
    var plate = d3.select('#' + PLATE_CONTAINER);
    var wells = d3.select('#wells').selectAll('.well');


    // --- Rectangular lasso ---

    // Unfortunately clicking on individual wells needs to be handled separately...
    wells.on("click", function(d,i) {
        var sel = d3.select(this);
        var ctrl = d3.event.ctrlKey;

        // Select or deselect the well under the pointer upon click
        // or the start of the drag
        sel.classed('selected', !ctrl);

        // Signal that the selection has completed
        document.dispatchEvent(selDoneEvent);
    });

    var x0, y0;
    var mousedown = false;

    svg.on('mousedown', function() {

        mousedown = true;

        // Save the mouse coordinates
        var here = d3.mouse(this);
        x0 = here[0];
        y0 = here[1];
        // Note that this will NOT work with CSS transforms!!!

        // Add the selection rectangle
        svg.append("rect")
            .attr("id", SELECTION_RECT_ID)
            .attr("x", x0.toString())
            .attr("y", y0.toString())
            .attr("width", "0")
            .attr("height", "0")
            // Hide for now...
            .style("visibility", "hidden")
            // CSS doesn't seem to be working right...
            .style("fill", "#000000")
            .style("opacity", "0.3");
    });

    // Note that this causes problems if the mouse is moved off the svg area...
    // Unfortunately, binding this to the document changes the mouse coordinates...
    // It should be possible to translate the coordinates, however.
    svg.on('mousemove', function() {

        if (mousedown) {
            // Update the rectangle
            var here = d3.mouse(this);
            var x = here[0];
            var y = here[1];

            var rect = d3.select('#' + SELECTION_RECT_ID);

            // Now resize the rect
            var w = Math.abs(x - x0);
            var h = Math.abs(y - y0);
            // SVG can't handle negative widths and heights
            var x1 = Math.min(x0, x);
            var y1 = Math.min(y0, y);
            rect
                .attr('x', x1.toString())
                .attr('y', y1.toString())
                .attr('width', w.toString())
                .attr('height', h.toString())
                .style('visibility', 'visible');
            // Eventually should include easing...

            // Highlight wells that intersect with the rectangle
            wells.each(function(d,i) {
                var well = d3.select(this);
                var cx = parseFloat(well.attr('cx'));
                var cy = parseFloat(well.attr('cy'));
                var r = parseFloat(well.attr('r'));

                // If the rectangle intersects this well, then tentatively select/unselect it
                var ctrl = d3.event.ctrlKey;
                if (intersects(cx, cy, r, x0, y0, x, y)) {
                    if (ctrl === false && well.classed("selected") === false) {
                        well.classed("selecting", true);
                    }
                    else if (ctrl === true && well.classed("selected") === true) {
                        well.classed("unselecting", true);
                    }
                }
                else {
                    well.classed("selecting", false);
                    well.classed("unselecting", false);
                }
            });

        }  // if

    });

    doc.on('mouseup', function() {
        mousedown = false;

        // Now officially select the selected wells
        wells.each(function(d,i) {
            var well = d3.select(this);

            // If the well is still in the "selecting" state, then select it
            if (well.classed("selecting") === true) {
                well.classed("selected", true);
            }
            // If the well is still in the "unselecting" state, then unselect it
            if (well.classed("unselecting") === true) {
                well.classed("selected", false);
            }
            // Else don't change the selection state...

            // Disable the selecting/unselecting classes
            well.classed("selecting", false);
            well.classed("unselecting", false);

        });

        // Remove the selection rect
        d3.select('#selection-rect') .remove();

        // Signal that the selection is done
        document.dispatchEvent(selDoneEvent);
    });

    return;
}



// ----- Exports -----

module.exports = {
    initialize : initialize,
    getSelectedWells : getSelectedWells
};
