"use strict";


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');


// internal
var Index = require('./index');
var Paths = require('./paths');
var Extensions = require('./extensions');
var prop = require('./common').prop;


function index_proxy(proto, func) {
  proto[func] = function () {
    var index = this.index;
    return index[func].apply(index, arguments);
  };
}


var Trail = module.exports = function Trail(root) {
  prop(this, 'root',       path.normalize(root || '.'));
  prop(this, 'paths',      new Paths(this.root));
  prop(this, 'extensions', new Extensions());
  prop(this, 'aliases',    {});
};


Object.defineProperty(Trail.prototype, 'index', {
  get: function () {
    return new Index(this.root, this.paths, this.extensions, this.aliases);
  }
});


Trail.prototype.prependPaths = function () {
  this.paths.prepend(arguments);
};


Trail.prototype.appendPaths = function () {
  this.paths.append(arguments);
};


Trail.prototype.removePath = function (path) {
  this.paths.remove(path);
};


Trail.prototype.prependExtensions = function () {
  this.extensions.prepend(arguments);
};


Trail.prototype.appendExtensions = function () {
  this.extensions.append(arguments);
};


Trail.prototype.removeExtension = function (extension) {
  this.extensions.remove(extension);
};


Trail.prototype.aliasExtension = function (new_extension, old_extension) {
  new_extension = Extensions.normalize(new_extension);
  old_extension = Extensions.normalize(old_extension);

  this.aliases[new_extension] = old_extension;
};


Trail.prototype.unaliasExtension = function (extension) {
  delete this.aliases[extension];
};


index_proxy(Trail.prototype, 'find');
index_proxy(Trail.prototype, 'entries');
index_proxy(Trail.prototype, 'stat');
