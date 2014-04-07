var Layer = require("./lib/layer");

module.exports = express = function() {
  var next;
  var parentNext;

  var myexpress = function(request, response, _parentNext) {
    parentNext = _parentNext;

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
        if (parentNext) {
          parentNext(error); 
        } else {
          response.statusCode = error? 500 : 404;
          response.end();
        }
      }
    }
  }

  myexpress.listen = function(port) {
    var server = require("http").createServer(this);
    server.listen(port);
    return server;
  };

  myexpress.stack = new Array();
  myexpress.use = function(argv1, argv2) {
    var path = argv2? argv1 : "/";
    var f = argv2? argv2 : argv1;

    var layer = new Layer(path, f);
    myexpress.stack.push(layer);
  };

  return myexpress;
}
