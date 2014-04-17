var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
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
};
proto.type = function(_type) {
  this.setHeader("Content-Type", mime.lookup(_type));
};
proto.default_type = function(_type) {
  if (!this.getHeader("Content-Type")) {
    this.setHeader("Content-Type", mime.lookup(_type));
  }
}
proto.format = function(_formats) {
  var _keys = Object.keys(_formats);
  if (_keys.length == 0) {
    this.statusCode = 406;
    this.end();
  }

  var accept = accepts(this.req);
  var _type = accept.types(_keys);
  this.type(_type);
  return _formats[_type]();
}
proto.send = function() {
  var _body = arguments[0];

  if (typeof _body == "string") {
    this.default_type("text/html");
  } else if (Buffer.isBuffer(_body)) {
    this.default_type("application/octet-stream");
  } else {
    this.default_type(_body);
  }

  this.setHeader("Content-Length", Buffer.isBuffer(_body) ? _body.length : Buffer.byteLength(_body));
  this.end(_body);
};
module.exports = proto;
