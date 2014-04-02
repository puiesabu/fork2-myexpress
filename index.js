module.exports = express = function() {
  var myexpress = function(request, response) {
    response.statusCode = 404;
    response.end();
  };

  return myexpress;
}
