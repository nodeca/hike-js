"use strict";


var NormalizedArray = require('./normalized_array');


var Extensions = module.exports = function Extensions() {
  NormalizedArray.call(this);
};


require('util').inherits(Extensions, NormalizedArray);


Extensions.normalize = Extensions.prototype.normalize = function (extension) {
  if ('.' === extension[0]) {
    return extension;
  }

  return '.' + extension;
};
