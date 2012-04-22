"use strict";


var resolvePath   = require('path').resolve;
var normalizePath = require('path').normalize;


var NormalizedArray = require('./normalized_array');


// `Paths` is an internal collection for tracking path strings.
//
var Paths = module.exports = function Paths(root) {
  NormalizedArray.call(this);

  Object.defineProperty(this, '__root__', {value: root});
};


require('util').inherits(Paths, NormalizedArray);


// Relative paths added to this array are expanded relative to `root`.
//
// paths = new Paths("/usr/local")
// paths.push("tmp")
// paths.push("/tmp")
//
// paths.toArray() // -> ["/usr/local/tmp", "/tmp"]
//
Paths.prototype.normalize = function (path) {
  if ('/' !== path[0]) {
    path = resolvePath(this.__root__, path);
  }

  return normalizePath(path);
};
