'use strict';


// provides shortcut to define data property
module.exports.prop = function (obj, name, val) {
  Object.defineProperty(obj, name, {value: val});
};
