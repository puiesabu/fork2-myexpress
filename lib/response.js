var http = require('http');
var proto = {};
proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype;
proto.redirect = function(argv1, argv2) {
  var _statusCode = argv2? argv1 : 302;
  var _path = argv2? argv2 : argv1;

  this.statusCode = _statusCode;
  this.setHeader("Location", _path);
  this.setHeader("Content-Length", 0);
  this.end();
}
module.exports = proto;
