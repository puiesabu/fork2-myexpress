module.exports = makeRoute = function(verb, handler) {
  return function(request, response, next) {
    if (request.method.toLowerCase() == verb) {
      handler(request, response, next);
    }
  };
};
