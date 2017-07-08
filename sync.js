
var fileContext = require('./filesS3.js');
var mm = require('musicmetadata');

exports.handler = function(event, context, callback) {

    const mp3Extension = ".mp3";
    const jsonExtension = ".json";
    const dataResult = "data"+jsonExtension;

    // takes data in the format [ item, item, ... ]
    // returns an array of keys [ [ leftOnly ], [ common ], [ rightOnly] ]
    function splitList(data) {

        console.log("calculating differences");

        const mp3Files = data.filter(function(item) {
            return item.endsWith(mp3Extension) && item.startsWith("2");
        }).map(function(item) {
            return item.substr(0, item.length - mp3Extension.length)
        });

        const jsonFiles = data.filter(function(item) {
            return item.endsWith(jsonExtension) && item.startsWith("2");
        }).map(function(item) {
            return item.substr(0, item.length - jsonExtension.length)
        });

        console.log("mp3:  "+JSON.stringify(mp3Files));
        console.log("json: "+JSON.stringify(jsonFiles));

        var mp3Only = mp3Files.filter(function(x) {
            return jsonFiles.indexOf(x) === -1
        });

        var jsonOnly = jsonFiles.filter(function(x) {
            return mp3Files.indexOf(x) === -1
        });

        var both = mp3Files.filter(function(x) {
            return jsonFiles.indexOf(x) >= 0
        });

        return [ jsonOnly, both, mp3Only ];
    }


    // takes a file name
    // reads the mp3, extracts tags, writes json
    // returns a promise to a written file
    function createJson(fileName) {
        return fileContext.readFileStream(fileName+mp3Extension)
            .then(function(stream) {
                return parseMetaData(stream, fileName+mp3Extension)
            })
            .then(function(metadata) {
                return fileContext.writeFile(Object.assign({ fileName: fileName+mp3Extension }, metadata ), fileName+jsonExtension)
            });
    }

    // takes an array of keys [ [ leftOnly ], [ common ], [ rightOnly ] ]
    // returns a promise to an array of common files to generate from (can be empty if we're not going to proceed)
    function processDifferences(result) {

        console.log("json missing mp3: "+JSON.stringify(result[0]));
        console.log("common: "+JSON.stringify(result[1]));
        console.log("mp3 missing json: "+JSON.stringify(result[2]));

        // push the deletion actions
        var actions = [];
        result[0].reduce(function(array, item) {
            array.push(fileContext.deleteFile(item+jsonExtension));
            return array;
        }, actions);

        // push the creation actions
        result[2].reduce(function(array, item) {
            array.push(createJson(item));
            return array;
        }, actions);

        // invoke the actions and when all done, return the common results and right side results
        return Promise.all(actions)
            .then(function(data) {
                return result[1].concat(result[2])
            });
    }


    // takes a mp3 input stream
    // returns the metadata json from the mp3
    function parseMetaData(stream, fileName) {
        return new Promise(function(resolve, reject) {
            console.log(fileName+": parsing metadata from stream");

            var result = null;

            stream.on('end', function () {
                console.log(fileName+': stream read complete');
                resolve(result);
            });

            stream.on('error', reject);

            mm(stream, { duration: true }, function(err, metadata) {
                if (err) {
                    // we can't reject the promise here because we're already reading the file, hence the promise is resolved
                    console.error(fileName+": "+err.toString());
                } else {
                    console.log(fileName + ': metadata is available: ' + JSON.stringify(metadata));
                }
                result = metadata;
            });
        });
    }

    // takes an array of files to concatenate and write
    // returns file write result, or ok if no updates
    function generateResult(filesToRead) {

        console.log("generating result from: "+JSON.stringify(filesToRead));

        return Promise.all(filesToRead.map(function(item) {
            return fileContext.readFile(item+jsonExtension);
        }));
    }


    fileContext.listFiles()
        .then(splitList)
        .then(processDifferences)
        .then(generateResult)
        .then(function (data) {
            return fileContext.writeFile(data, dataResult);
        })
        .then(function (result) {
            callback(null, result);
        })
        .catch(callback);
};
