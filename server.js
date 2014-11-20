var express = require('express');
var path = require('path');
var app = express();
app.use(express.static(path.join(__dirname, '.')));
var port = process.env.PORT || 1111;
app.listen(port, function() {
  // debug('Express server listening on port ' + server.address().port);
  console.log('Express server listening on port ' + port);
});