'use strict';

// Arrays in javascript can't really be subclassed, but as long
// as we stick to the methods (i.e. no direct arr[1]=x set),
// it should be fine.

function NormalizedArray(norm_fn) {
  this.fn = norm_fn || function(x) { return x; };
}

require('util').inherits(NormalizedArray, Array);

NormalizedArray.prototype.push = function() {
  var i, args = [];

  for (i = 0; i < arguments.length; i++) {
    args.push(this.fn(arguments[i]));
  }

  return Array.prototype.push.apply(this, args);
};

NormalizedArray.prototype.unshift = function() {
  var i, args = [];

  for (i = 0; i < arguments.length; i++) {
    args.push(this.fn(arguments[i]));
  }

  return Array.prototype.unshift.apply(this, args);
};

NormalizedArray.prototype.indexOf = function(el) {
  return Array.prototype.indexOf.call(this, this.fn(el));
};

NormalizedArray.prototype.lastIndexOf = function(el) {
  return Array.prototype.lastIndexOf.call(this, this.fn(el));
};

NormalizedArray.prototype.clone = function() {
  var i, result = new this.constructor(this.fn);

  for (i = 0; i < this.length; i++) {
    result[i] = this[i];
  }
  result.length = this.length;

  return result;
};

module.exports = NormalizedArray;

