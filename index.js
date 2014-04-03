module.exports = express = function() {
  var myexpress = function(request, response) {
    getNext(request, response, 0);
    next();
  };

  var getNext = function(request, response, n) {
    module.exports = next = function() {
      if (n < myexpress.stack.length) {
        myexpress.stack[n++](request, response, next);
      } else {
        response.statusCode = 404;
        response.end();
      }
    }
  }

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
