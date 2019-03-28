// util.js
//
// Various data-handling utility functions


// ----- Dependencies -----

var fs = require('fs');
var path = require('path');
var d3 = require('d3');  // For parsing csv files


// ----- Constants -----

var DATA_START_ROW = 13;



// ----- Generic utility functions -----


// Get the well name from the well row and column numbers
function getWellName(row, col) {
    var rowname = 'ABCDEFGH'[parseInt(row) - 1];
    var colname = parseInt(col).toString();  // parseInt to remove any leading 0's
    var wellname = rowname + colname;

    return wellname;
}


// Get the row and column of a given well name
function getWellRowCol(well) {
    var mch = well.trim().match(/^([A-H])(([1-9])|(10)|(11)|(12))$/);

    if (mch == null) {
        throw Error("'" + well + "'" + " isn't a valid well name.");
    }

    var rowName = mch[1];
    var row = rowName.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    var col = parseInt(mch[2]);

    return {row : row, col : col};
}


// Wells sort
function sortWells(wells) {

    wells.sort(function(well1,well2) {
        // Trim whitespace
        well1 = well1.trim();
        well2 = well2.trim();

        // Extract the row letter and column number
        var row1, row2;
        var col1, col2;
        var re = /^([A-H])([0-9]|10|11|12)$/ ;
        var mch1, mch2;

        mch1 = well1.match(re);
        // Should guard against non-matches here...
        row1 = mch1[1].toUpperCase();
        col1 = parseInt(mch1[2]);

        mch2 = well2.match(re);
        row2 = mch2[1].toUpperCase();
        col2 = parseInt(mch2[2]);

        // First, sort by row
        var result;
        if (row1 < row2) {
            result = -1;
        } else if (row1 == row2) {
            if (col1 < col2) {
                result = -1;
            } else if (col1 == col2) {
                result = 0;
            } else if (col1 > col2) {
                result = 1;
            }
        } else if (row1 > row2) {
            result = 1;
        }

        return result;
    });

    return wells;
}


function sortAnalytes(analytes) {
    // Just do a plain numeric or ASCII sort
    return analytes.sort();
}


// Extract a (sorted) list of unique analytes from a data set
function getAnalytes(data) {
    // data:  {well, analyte, reading}

    // Get the analytes
    var analytes = data.map(function(row) { return row.analyte; });
    analytes = Array.from(new Set(analytes));
    analytes = sortAnalytes(analytes);

    return analytes;
}


// Extract a (sorted) list of unique wells from a data set
function getWells(data) {
    // data:  {well, analyte, reading}

    var wells = data.map(function(row) { return row.well; });
    wells = Array.from(new Set(wells));
    wells = sortWells(wells);

    return wells;
}


// Calculate the medians
function calcMedians(data) {
   // data: {well, analyte, reading}
   
   var summary = d3.nest()
           .key(function(d) {return d.well;})
           .key(function(d) {return d.analyte;})
           .rollup(function(leaves) {
               var med = d3.median(leaves, function(d) {return d.reading;});
               var count = leaves.length;
               return {count : count, median : med};
           })
           .entries(data);
    // Now unpack
    var summary2 = [];
    summary.forEach(function(d) {
        var well = d.key;
        d.values.forEach(function(dd) {
            var analyte = dd.key;
            // There should only be one value here
            var count = dd.values.count;
            var median = dd.values.median;
            var row = {
                well : well,
                analyte : analyte,
                count : count,
                median : median
            };

            summary2.push(row);
        });
    });

    return summary2;
}



// ----- Reader-related functions -----


// This will only work on the server side...
function loadFile(file, callback) {
    fs.readFile(file, 'utf8', function(err, text) {
        if (err) throw err;

        callback(text);
    });
}


// A helper function for loading different data files
// on the client side
function loadReaderFile(file, parser, dataHandler) {
    // parser: Function of one argument (the read file, as a string)

    var reader = new FileReader();

    // Get the data from the file
    reader.onload = function(e) {
        // Get the file contents from the FileReader
        var contents = reader.result;

        // Parse the data
        var data = parser(contents);

        // Now pass the data off for further processing
        dataHandler(data);  // Closure may be an issue...
    };

    // Load the data
    reader.readAsText(file);

    // Return the reader for status checks, etc.
    return reader;
}



// Save the file *synchronously*
function saveJSONSync(file, data) {
    var dataJSON = JSON.stringify(data);
    fs.writeFileSync(file, dataJSON);
}


// Parse the sample data CSV file
function parseData(text) {

    var data = d3.csv.parseRows(text, function(row, index) {
        var result;
        if (index < DATA_START_ROW) {
            // Skip any initial metadata rows
            result = null;  // "null" tells the parser to skip this row
        } else if (index == DATA_START_ROW) {
            // This is the header row
            // Again, skip this for now
            result = null;
        } else {
            var well = row[0];
            var analyte = row[1];
            var reading = parseFloat(row[2]);

            result = {
                well : well,
                analyte : analyte,
                reading : reading
            };
        }

        return result;
    });

    return data;
}


// ----- Exports -----

module.exports = {
    getWellName : getWellName,
    getWellRowCol : getWellRowCol,
    sortAnalytes : sortAnalytes,
    sortWells : sortWells,
    getAnalytes : getAnalytes,
    getWells : getWells,
    calcMedians : calcMedians,
    loadFile : loadFile,
    loadReaderFile : loadReaderFile,
    parseData : parseData,
    saveJSONSync : saveJSONSync
};
