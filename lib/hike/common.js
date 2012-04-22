'use strict';


module.exports.prop = function (obj, name, val) {
  Object.defineProperty(obj, name, {value: val});
};
