module.exports = Layer = function(path, middleware) {
  var layer = function() {};

  layer.handle = middleware;

  layer.match = function(_path) {
    if (path == _path || (path != "/" && path == _path.substr(0, path.length))) {
      return {"path": path};
    }
    return undefined; 
  }

  return layer;
}
