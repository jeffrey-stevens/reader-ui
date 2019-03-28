// ----- Imports -----

var path = require('path');
var Express = require('express');


// ----- Constants -----

// Hard-coding this here to prevent mistakes that could cause huge security issues...
var PORT = "4000";


// ----- Globals -----

app = Express();


// ----- Functions -----

function run(dir) {

    // This is very dangerous!
    app.use('/', Express.static(dir));
    app.listen(PORT);
}


// ----- Exports -----

module.exports = {
    run : run
};