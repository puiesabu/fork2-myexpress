var http = require('http');
var mime = require('mime');
var accepts = require('accepts');
var crc32 = require('buffer-crc32');
var fs = require("fs");
var path = require('path');
var rparser = require("range-parser");

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
  stream.pipe(this);
}
proto.sendfile = function(data, options) {
  if (options) {
    data = path.normalize(options.root + "/" + data);
  }

  var self = this;
  if (data.indexOf("..") > -1) {
    self.statusCode = 403;
    self.end();
    return;      
  }

  fs.stat(data, function(err, stat) {
    if (err) {
      self.statusCode = 404;
      self.end();
      return;
    } 

    if (stat.isDirectory()) {
      self.statusCode = 403;
      self.end();
      return;      
    }

    var stream_opts = {};
    var range = self.req.headers["range"];
    if (range) {
      r = rparser(stat.size, range);
      if (r instanceof Array) {
        stream_opts = r[0];
        self.statusCode = 206;
        self.setHeader("Content-Range","bytes " 
          + stream_opts.start + "-" + stream_opts.end + "/" + stat.size);
      } else if (r == -1) {
        self.statusCode = 416;
        self.end();
        return;
      }
    }

    var file = fs.createReadStream(data, stream_opts);
    self.stream(file);        
    self.setHeader("Content-Length", stat.size);
    self.setHeader("Content-Type", "text/plain");
    self.setHeader("Accept-Range", "bytes");
  });
}
module.exports = proto;
