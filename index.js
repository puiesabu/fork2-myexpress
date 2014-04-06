module.exports = express = function() {
  var next;

  var myexpress = function(request, response) {
    getNext(request, response, 0);
    next();
  };

  var getNext = function(request, response, n) {
    next = function(error) {
      if (n < myexpress.stack.length) {
        var f = myexpress.stack[n++];

        try {
          if (!error && f.length < 4) {
            f(request, response, next);
          } else if (error && f.length == 4) {
            f(error, request, response, next);
          } else {
            next(error);
          }
        } catch (err) {
          next(err);
        }
      } else {
        response.statusCode = error? 500 : 404;
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
