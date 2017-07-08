
var AWS = require('aws-sdk');

const bucketRegion = 'ap-southeast-2';
const bucketName =  'my-bucket';

AWS.config.update({
    region: bucketRegion
});

var s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});


// returns the promise to data
exports.listFiles = function () {

    var continuationToken = null;
    var result = [];
    var truncated = true;

    var nextPromise = function () {

        if (!truncated) {
            console.log("completed listing elements: "+result.length);
            return result;
        }

        var params = {
            Bucket: bucketName,
            MaxKeys: 500
        };

        if (continuationToken) {
            Object.assign(params, {ContinuationToken: continuationToken});
        }

        console.log(JSON.stringify(params)+": start listing");

        return s3.listObjectsV2(params).promise().then(function(reslt) {

            reslt.Contents.reduce(function (acc, item) {
                return result.push(item.Key);
            }, result);

            continuationToken = reslt.NextContinuationToken;
            truncated = reslt.IsTruncated;

            console.log(JSON.stringify(params)+": finished listing");

            return nextPromise();
        });
    };

    return Promise.resolve().then(nextPromise);
};


// takes a file name and returns the promise to a file
exports.readFile = function (fileName) {
    var params = {
        Bucket: bucketName,
        Key: fileName
    };

    return new Promise(function(resolve, reject) {
        console.log(fileName+": reading file");
        s3.getObject(params, function (err, data) {
            if (err) {
                console.error(err.toString());
                reject(err);
            }
            console.log(fileName+": completed reading file");
            resolve(JSON.parse(data.Body.toString('utf-8')));
        });
    });
};

exports.readFileStream = function(fileName) {
    console.log(fileName+": reading stream");
    const  params = { Bucket: bucketName, Key: fileName };
    return Promise.resolve(s3.getObject(params).createReadStream());
};

// takes data and a file name and writes out the file
exports.writeFile = function (data, fileName) {
    console.log(fileName+" : writing file");
    var params = {
        Body: JSON.stringify(data),
        Bucket: bucketName,
        Key: fileName,
        ContentType: 'application/json'
    };
    return s3.putObject(params).promise()
        .then(function(data) {
            console.log(fileName+": write ok");
            return "ok";
        });
};

// deletes the requested file
exports.deleteFile = function (fileName) {
    var params = {
        Bucket: bucketName,
        Key: fileName
    };
    return s3.deleteObject(params).promise();
};
