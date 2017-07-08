
var h = require('./sync.js');



h.handler(null, null, function (error, result) {
  if (error) {
      console.error('error: '+JSON.stringify(error));
  } else {
      console.log('result: ' + result);
  }
});