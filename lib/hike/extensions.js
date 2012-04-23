/** internal
 *  class Extensions
 *
 *  Subclass of [[NormalizedArray]].
 *  Internal collection for tracking extension names.
 *  Each element is a valid filename extension (with leading dot).
 *
 *      var exts = new Extensions();
 *
 *      exts.append('js');
 *      exts.append('.css');
 *
 *      exts.toArray();
 *      // -> [".js", ".css"]
 **/


"use strict";


var NormalizedArray = require('./normalized_array');


/**
 *  new Extensions()
 **/
var Extensions = module.exports = function Extensions() {
  NormalizedArray.call(this);
};


/**
 *  Extensions#toArray() -> Array
 *
 *  See: [[NormalizedArray#append]]
 **/

/**
 *  Extensions#prepend(*els) -> Void
 *
 *  See: [[NormalizedArray#append]]
 **/

/**
 *  Extensions#append(*els) -> Void
 *
 *  See: [[NormalizedArray#append]]
 **/

/**
 *  Extensions#remove(el) -> Void
 *
 *  See: [[NormalizedArray#append]]
 **/

require('util').inherits(Extensions, NormalizedArray);


/** alias of: Extensions.normalize
 *  Extensions#normalize(extension) -> String
 **/

/**
 *  Extensions.normalize(extension) -> String
 *  - extension (String): extension to normalize
 *
 *  Normalize extension with a leading `.`.
 *
 *      Extensions.normalize("js");
 *      // -> ".js"
 *
 *      Extensions.normalize(".css");
 *      // -> ".css"
 **/
Extensions.normalize = Extensions.prototype.normalize = function (extension) {
  if ('.' === extension[0]) {
    return extension;
  }

  return '.' + extension;
};
