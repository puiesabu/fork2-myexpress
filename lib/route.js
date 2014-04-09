module.exports = makeRoute = function(verb, handler) {
  switch(verb) {
    case "get":
      return function(request, response, next) {
        if (request.method.toLowerCase() == "get") {
          handler(request, response, next);
        }
      };
    default:
      return undefined;
  } 
};
