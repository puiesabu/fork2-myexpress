var Layer = require("./lib/layer");
var makeRoute = require("./lib/route.js");
var methods = require("methods");

module.exports = express = function() {
  var next;
  var parentNext;

  var myexpress = function(request, response, _parentNext) {
    parentNext = _parentNext;

    getNext(request, response, 0);
    next();
  };

  var getNext = function(request, response, n) {
    var originalUrl = null;

    next = function(error) {
      if (n < myexpress.stack.length) {
        if (originalUrl != null) {
          // restore request.url
          request.url = originalUrl;
          originalUrl = null;
        }

        var layer = myexpress.stack[n++];
        if (layer.method) {
          if (layer.method != request.method.toLowerCase() || layer.path != request.url)
          next(error);
        }

        var match = layer.match(request.url);
        if (match === undefined) {
          next(error);
        } else {
          request.params = match.params;
        }

        if (error && layer.path != request.url) {
          next(error);
        }

        var f = layer.handle;

        if(typeof f.handle === "function") {
          originalUrl = request.url
          request.url = request.url.substr(layer.path .length);
        }

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

  var addLayer = function(path, f, method) {
    var layer = new Layer(path, makeRoute(method, f));
    layer.method = method;

    myexpress.stack.push(layer);
  }

  myexpress.get = function(path, f) {
    addLayer(path, f, "get");
  }

  methods.forEach(function(method) {
    myexpress[method] = function(path, f) {
      addLayer(path, f, method);
    }
  });

  myexpress.handle = myexpress;

  return myexpress;
}
