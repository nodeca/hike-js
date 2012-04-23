'use strict';


// provides shortcut to define data property
module.exports.prop = function (obj, name, val) {
  Object.defineProperty(obj, name, {value: val});
};


// helper that stubs `obj` with methods throwing error when they are called
// (used to keep interfacte of Index
// and Trail identical, but do not allow call some of mutators
// on Index
module.exports.stub = function (obj, methods, msg) {
  msg = !!msg ? (": " + msg) : "";

  methods.forEach(function (func) {
    obj[func] = function () {
      throw new Error("Can't call `" + func + "()`" + msg);
    };
  });
};
