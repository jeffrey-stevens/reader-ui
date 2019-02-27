var Util = require('../js/util.js');


/*
// Load and save a BioCode 2500 raw data file
Util.loadFile("../data/rawdata_single-full-plate-run1_1of1.csv",
              function(text) {
                  var data = Util.parseBioCode2500Raw(text);
                  console.log(data);
              });
*/

Util.convertBioCode2500Raw("../data/rawdata_single-full-plate-run1_1of1.csv");
