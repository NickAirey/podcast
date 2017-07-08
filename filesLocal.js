
var fs = require('fs');

var fileName = 'listObjectsResult7.json';

exports.listFiles = function() {
    return new Promise(function(resolve, reject) {

        fs.readFile(fileName, function (err, data) {
            if (err) {
                console.error(err.toString());
                return reject(err);
            }

            console.log("completed retrieving json for: " + fileName);
            resolve(JSON.parse(data));
        });
    });
};

exports.readFile = function (fileName) {
    return new Promise(function(resolve, reject) {
        console.log("reading file: "+fileName);
        fs.readFile(fileName, function (err, data) {
            if (err) {
                console.error(err.toString());
                reject(err);
            }
            console.log("completed retrieving json for: "+fileName);
            resolve(JSON.parse(data));
        });
    });
};

exports.readFileStream = function(fileName) {
    return new Promise(function(resolve, reject) {
        console.log("reading file stream: "+fileName);
        resolve(fs.createReadStream(fileName));
    });
};


// takes data and a file name and writes out the file
exports.writeFile = function (data, fileName) {
    return new Promise(function(resolve, reject) {
        console.log("writing file: "+fileName);
        fs.writeFile(fileName, JSON.stringify(data), function (err) {
            if (err) reject(err);

            console.log("completed writing file: "+fileName);
            resolve("file write ok");
        });
    });
};

// simulates deleting file
exports.deleteFile = function (fileName) {
    return new Promise(function(resolve, reject) {

        console.log("requesting file deletion: "+fileName);

        setTimeout(function(){
            console.log("completed file deletion for: "+fileName);
            resolve("ok");
        }, Math.random() * 500);
    });
};

