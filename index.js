module.exports = express = function() {
  var myexpress = function(request, response) {
    response.statusCode = 404;
    response.end();
  };

  myexpress.listen = function(port) {
    var server = require("http").createServer(this);
    server.listen(port);
    return server;
  };

  myexpress.stack = new Array();
  myexpress.use = function(m) {
    myexpress.stack.push(m);
  };

  return myexpress;
}
