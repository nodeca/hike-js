'use strict';

// stdlib
var fs = require('fs');


// provides shortcut to define data property
module.exports.prop = function (obj, name, val) {
  Object.defineProperty(obj, name, {value: val});
};


// helper that stubs `obj` with methods throwing error when they are called
module.exports.stub = function (obj, methods, msg) {
  msg = !!msg ? (': ' + msg) : '';

  methods.forEach(function (func) {
    obj[func] = function () {
      throw new Error('Can\'t call `' + func + '()`' + msg);
    };
  });
};


// wrapper for `fs.statSync`, returns `null` if file does not exist
module.exports.stat = function (pathname) {
  var result = null;
  try {
    result = fs.statSync(pathname);
  } catch (err) {
    if ('ENOENT' !== err.code) {
      throw err;
    }
  }

  return result;
};


// wrapper for `fs.readdirSync` that filters out `.` files and
// `~` swap files. Returns an empty `Array` if the directory does
// not exist.
module.exports.entries = function (pathname) {
  var result = [];
  try {
    result = fs.readdirSync(pathname || '').filter(function (f) {
      return !/^\.|~$|^\#.*\#$/.test(f);
    }).sort();
  } catch (err) {
    if ('ENOENT' !== err.code) {
      throw err;
    }
  }

  return result;
};
