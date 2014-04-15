var Layer = require("./lib/layer");
var makeRoute = require("./lib/route.js");
var methods = require("methods");
var request = require("./lib/request");
var response = require("./lib/response");

module.exports = express = function() {
  var next;
  var parentNext;

  var myexpress = function(req, res, _parentNext) {
    parentNext = _parentNext;

    myexpress.monkey_patch(req, res);
    getNext(req, res, 0);
    next();
  };

  var getNext = function(req, res, n) {
    var originalUrl = null;

    next = function(error) {
      if (n < myexpress.stack.length) {
        if (originalUrl != null) {
          // restore req.url
          req.url = originalUrl;
          originalUrl = null;
        }

        var layer = myexpress.stack[n++];
        if (layer.method && layer.method != req.method.toLowerCase()) {
          next(error);
        }

        var match = layer.match(req.url);
        if (match === undefined) {
          next(error);
        } else {
          req.params = match.params;
        }

        if (error && layer.path != req.url && req.url != "/") {
          next(error);
        }

        var f = layer.handle;

        if(typeof f.handle === "function") {
          originalUrl = req.url
          req.url = req.url.substr(layer.path .length);
        }

        try {
          if (!error && f.length < 4) {
            f(req, res, next);
          } else if (error && f.length == 4) {
            f(error, req, res, next);
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
          res.statusCode = error? 500 : 404;
          res.end();
        }
      }
    }
  }

  myexpress.monkey_patch = function(req, res) {
    req.__proto__ = request;
    res.__proto__ = response;
  }

  myexpress.listen = function(port, done) {
    var server = require("http").createServer(this);
    server.listen(port, done);
    return server;
  };

  myexpress.routes = {};
  myexpress.route = function(path) {
    var route = myexpress.routes[path];
    if (!route) {
      route = makeRoute();
      myexpress.routes[path] = route;

      var layer = new Layer(path, route, true);
      myexpress.stack.push(layer);
    }
    return route;
  }

  myexpress.stack = new Array();
  myexpress.use = function(argv1, argv2) {
    var path = argv2? argv1 : "/";
    var f = argv2? argv2 : argv1;

    var layer = new Layer(path, f);

    myexpress.stack.push(layer);
  };

  methods.concat("all").forEach(function(method) {
    myexpress[method] = function(path, f) {
      var route = myexpress.route(path);
      route.use(method, f);
      return myexpress;
    }
  });

  myexpress.handle = myexpress;

  return myexpress;
}
