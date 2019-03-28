// ----- Imports -----

var path = require('path');
var Express = require('express');


// ----- Constants -----

// Hard-coding this here to prevent mistakes that could cause huge security issues...
var DIST_DIR = path.join(__dirname, '..', 'dist');
var PORT = "4000";


// ----- Globals -----

app = Express();


// ----- Functions -----

function run() {

    app.use('/', Express.static(DIST_DIR));
    app.listen(PORT);
}


// ----- Exports -----

module.exports = {
    run : run
};