"use strict";


// 3rd-party
var _ = require('underscore');


var NormalizedArray = module.exports = function () {
  var self = this, arr = [];


  this.toArray = function () {
    return arr.slice();
  };


  this.prepend = function (els) {
    arr = _.union(normalize_all(els), arr);
  };


  this.append = function (els) {
    arr = _.union(arr, normalize_all(els));
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
