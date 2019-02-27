var fs = require('fs');
var path = require('path');

var Util = require('../js/util.js');

var SAMPLE_DATA = path.join('..', 'data', 'Sample data.csv');

Util.loadFile(SAMPLE_DATA, function(text) {
  
  data = Util.parseData(text);
  console.log(data);
  
  summary = Util.calcMedians(data);
  console.log(summary);
  
  wells = Util.getWells(data);
  console.log(wells);
  
  analytes = Util.getAnalytes(data);
  console.log(analytes);
  
  console.log(Util.sortWells(wells));
  console.log(Util.sortAnalytes(analytes));
});