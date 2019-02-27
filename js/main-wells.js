var Wells = require("./wells-selection.js");

var PLATE_SVG_FILE = "plate.svg";
var PLATE_CONTAINER_ID = "plate-svg-container";

document.addEventListener("DOMContentLoaded", function(event) {
    var container = document.getElementById(PLATE_CONTAINER_ID);
    Wells.initialize(PLATE_SVG_FILE, container);
});
