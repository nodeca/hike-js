"use strict";


// 3rd-party
var _ = require('underscore');


var NormalizedArray = module.exports = function () {
  var self = this, arr = [];


  this.toArray = function () {
    return arr.slice();
  };


  this.prepend = function () {
    arr = _.union(normalize_all(arguments), arr);
  };


  this.append = function () {
    arr = _.union(arr, normalize_all(arguments));
  };


  this.remove = function (el) {
    arr = _.without(arr, self.normalize(el));
  };


  function normalize_all(els) {
    return _.flatten(els).map(function (el) {
      return self.normalize(el);
    });
  }
};
