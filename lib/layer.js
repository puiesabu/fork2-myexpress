var p2re = require("path-to-regexp");

module.exports = Layer = function(path, middleware, _end) {
  var layer = function() {};

  path = stripTrialingSlash(path);

  layer.path = path;
  layer.handle = middleware;
  layer.names = [];

  var re = p2re(path, layer.names, {end: _end});

  layer.match = function(_path) {
    _path = decodeURIComponent(_path);
    _path = stripTrialingSlash(_path);

    if (re.test(_path)) {
      var m = re.exec(_path);

      var params = {};
      for (var index = 1; index <= layer.names.length; index++) {
        key = layer.names[index - 1]['name'];
        params[key] = m[index];
      }

      return {"path": m[0], "params": params};
    }
    return undefined; 
  }

  function stripTrialingSlash(_path) {
    return _path[_path.length - 1] === "/" ? _path.substr(0, _path.length - 1) : _path; 
  }

  return layer;
}
