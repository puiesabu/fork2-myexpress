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
    var f = function(request, response, next) {
      if (request.method.toLowerCase() == _verb) {
        _handler(request, response, next);
      } else {
        next();
      }
    };

    var action = {verb: _verb, handler: _handler};
    route.stack.push(action);
    
    return f;
  };

  return route;
};
