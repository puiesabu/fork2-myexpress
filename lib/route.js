var methods = require("methods");

module.exports = makeRoute = function() {
  var route = function(request, response, _parentNext) {
    parentNext = _parentNext;
    getNext(request, response, 0);
    next();
  };

  var getNext = function(request, response, n) {
    next = function(error) {
      if (error == 'route') {
        parentNext();
      }

      if (n < route.stack.length) {
        var action = route.stack[n++];
        if (action.verb != "all" && action.verb != request.method.toLowerCase()) {
          next(error);
        }

        if (!error) {
          action.handler(request, response, next);
        } else {
          next(error);
        }
      } else {
        parentNext(error);
      }
    };
  }

  route.stack = new Array();
  route.use = function(_verb, _handler) {
    var action = {verb: _verb, handler: _handler};
    route.stack.push(action);
    return _handler;
  };

  methods.concat("all").forEach(function(method) {
    route[method] = function(handler) {
      route.use(method, handler);
      return route;
    }
  });

  return route;
};
