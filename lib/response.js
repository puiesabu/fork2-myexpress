var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
var crc32 = require('buffer-crc32');
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
  if (arguments.length > 1) {
    this.statusCode = arguments[0];
  }

  var _body = arguments.length == 1 ? arguments[0] : arguments[1];

  switch (typeof _body) {
    case "number":
      this.statusCode = _body;
      this.default_type("text/plain");
      _body = http.STATUS_CODES[_body];
      break;
    case "string":
      this.default_type("text/html");
      break;
    default:
      if (Buffer.isBuffer(_body)) {
        this.default_type("application/octet-stream");
      } else {
        this.default_type("application/json");
        this.end(JSON.stringify(_body));
        return;
      }
      break;
  }

  var len = 0;
  this.setHeader("Content-Length", len = Buffer.isBuffer(_body) ? _body.length : Buffer.byteLength(_body));

  var reqEtag = this.req.headers["if-none-match"];
  if (reqEtag && this.getHeader("ETag") == reqEtag) {
    this.statusCode = 304;
  }

  var reqSince = this.req.headers["if-modified-since"];
  var lastModified = this.getHeader("Last-Modified");
  if (reqSince && new Date(lastModified) <= new Date(reqSince)) {
    this.statusCode = 304;
  }

  if (!this.getHeader("ETag") && len && this.req.method == "GET") {
    this.setHeader("ETag", '"' + crc32.signed(_body) + '"');
  }

  this.end(_body);
};
proto.stream = function(stream) {
  var self = this;
  stream.on("data",function(chunk) {
    self.send(chunk);
  });
}
module.exports = proto;
