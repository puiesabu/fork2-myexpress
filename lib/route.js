module.exports = makeRoute = function() {
  var route = function(){};

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
