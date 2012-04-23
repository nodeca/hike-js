/** internal
 *  class Paths
 *
 *  Subclass of [[NormalizedArray]].
 *  Internal collection for tracking path strings.
 *  Each element is a valid absolute path.
 *
 *      var paths = new Paths("/usr/local");
 *
 *      paths.append('tmp');
 *      paths.append('/tmp');
 *
 *      paths.toArray();
 *      // -> ["/usr/local/tmp", "/tmp"]
 **/


"use strict";


var resolvePath   = require('path').resolve;
var normalizePath = require('path').normalize;


var NormalizedArray = require('./normalized_array');


/**
 *  new Paths(root = ".")
 **/
var Paths = module.exports = function Paths(root) {
  NormalizedArray.call(this);

  Object.defineProperty(this, '__root__', {value: root});
};


/**
 *  Paths#toArray() -> Array
 *
 *  See: [[NormalizedArray#append]]
 **/

/**
 *  Paths#prepend(*els) -> Void
 *
 *  See: [[NormalizedArray#append]]
 **/

/**
 *  Paths#append(*els) -> Void
 *
 *  See: [[NormalizedArray#append]]
 **/

/**
 *  Paths#remove(el) -> Void
 *
 *  See: [[NormalizedArray#append]]
 **/

require('util').inherits(Paths, NormalizedArray);


/**
 *  Paths#normalize(path) -> String
 *
 *  Relative paths added to this array are expanded relative to `root`.
 *
 *      paths = new Paths("/usr/local");
 *
 *      paths.append("tmp");
 *      paths.append("/tmp");
 *
 *      paths.toArray();
 *      // -> ["/usr/local/tmp", "/tmp"]
 **/
Paths.prototype.normalize = function (path) {
  if ('/' !== path[0]) {
    path = resolvePath(this.__root__, path);
  }

  return normalizePath(path);
};
