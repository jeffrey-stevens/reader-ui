
var Express = require('express');

app = Express();

function run(dir, port) {

    // This can be very dangerous!
    app.use('/', Express.static(dir));
    app.listen(port);
}


module.exports = {
    run : run
};