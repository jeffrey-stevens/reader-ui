// ----- Imports -----

var Express = require('express');


// ----- Constants -----


// ----- Globals -----

app = Express();


// ----- Functions -----

function run(dir, port) {

    // This can be very dangerous!
    app.use('/', Express.static(dir));
    app.listen(port);
}


// ----- Exports -----

module.exports = {
    run : run
};