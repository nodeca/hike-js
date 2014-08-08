/** internal
 *  class CachedTrail
 *
 *  Cached variant of [[Trail]]. It assumes the file system does not change
 *  between `find` calls. All `stat` and `entries` calls are cached for the
 *  lifetime of the [[CachedTrail]] object.
 **/

'use strict';

var find = require('./find');

/**
 *  new CachedTrail(trail)
 **/
module.exports = function CachedTrail(trail) {
  if (!(this instanceof CachedTrail)) {
    return new CachedTrail(trail);
  }

  /** internal
   *  CachedTrail#root -> String
   *
   *  Root path.
   **/
  this.root = trail.root;

  /** internal
   *  CachedTrail#paths -> NormalizedArray
   *
   *  Same as Trail#paths
   **/
  this.extensions = trail.extensions.clone();

  /** internal
   *  CachedTrail#extensions -> NormalizedArray
   *
   *  Same as Trail#extensions
   **/
  this.paths = trail.paths.clone();

  /** internal
   *  CachedTrail#reverse_aliases -> Object
   *
   *  Same as Trail#reverse_aliases
   **/
  this.reverse_aliases = {};
  var ext;
  for (ext in trail.reverse_aliases) {
    this.reverse_aliases[ext] = trail.reverse_aliases[ext].slice(0);
  }

  // we need functions from Trail prototype, but can't get them
  // directly with require('./trail') because of a circular dependency
  this._trail_proto = Object.getPrototypeOf(trail);

  // cache for fs.readFileSync() calls
  this._entries = {};

  // cache for fs.statSync() calls
  this._stats = {};

  // cache for regexps
  this._patterns = {};
};

var T = module.exports.prototype;

/**
 *  CachedTrail#find(logical_paths[, options, fn]) -> String|Undefined
 *
 *  See [[Trail#find]] for usage.
 **/
T.find = function(paths, options, func) {
  return this.find_all(paths, options, func)[0];
};

/**
 *  CachedTrail#find_all(logical_paths[, options, fn]) -> String
 *
 *  See [[Trail#find_all]] for usage.
 **/
T.find_all = function(paths, options, func) {
  return find(this, paths, options, func);
};

/**
 *  CachedTrail#cached -> CachedTrail
 *
 *  Self-reference to be compatable with the [[Trail]] interface.
 **/
T.cached = function() {
  return this;
};

/**
 *  CachedTrail#entries(pathname) -> Array
 *  - pathname(String): Pathname to get files list for.
 *
 *  A cached version of `fs.readdirSync` that filters out `.` files and
 *  `~` swap files. Returns an empty `Array` if the directory does
 *  not exist.
 **/
T.entries = function(pathname) {
  if (!this._entries[pathname]) {
    this._entries[pathname] = this._trail_proto.entries(pathname);
  }

  return this._entries[pathname];
};

/**
 *  CachedTrail#stat(pathname) -> Stats|Null
 *  - pathname(String): Pathname to get stats for.
 *
 *  Cached version of `path.statsSync()`.
 *  Retuns `null` if file does not exists.
 **/
T.stat = function(pathname) {
  if (!this._stats.hasOwnProperty(pathname)) {
    this._stats[pathname] = this._trail_proto.stat(pathname);
  }

  return this._stats[pathname];
};
