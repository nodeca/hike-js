/**
 *  class Trail
 *
 *  Public container class for holding paths and extensions.
 **/

'use strict';

var fs          = require('fs');
var Path        = require('path');
var NormArray   = require('./normalized_array');
var CachedTrail = require('./cached_trail');
var find        = require('./find');

function normalize_extension(extension) {
  return '.' === extension[0] ? extension : '.' + extension;
}

/**
 *  new Trail(root = '.')
 *
 *  A Trail accepts an optional root path that defaults to your
 *  current working directory. Any relative paths added to
 *  [[Trail#paths]] will expanded relative to the root.
 **/
module.exports = function Trail(root) {
  if (!(this instanceof Trail)) {
    return new Trail(root);
  }

  /** internal
   *  Trail#root -> String
   *
   *  Root path.
   **/
  this.root = root = Path.resolve(root);

  /** internal
   *  Trail#extensions -> NormalizedArray
   *
   *      trail = new Trail();
   *      trail.append_path("/home/ixti/Projects/hike/lib");
   *      trail.append_extension(".rb");
   *
   *  Extensions allow you to find files by just their name omitting
   *  their extension. Is similar to Ruby's require mechanism that
   *  allows you to require files with specifiying `foo.rb`.
   **/
  this.extensions = new NormArray(normalize_extension);

  /** internal
   *  Trail#paths -> NormalizedArray
   *
   *      trail = new Trail();
   *      trail.append_path("/home/ixti/Projects/hike/lib",
   *                        "/home/ixti/Projects/hike/test");
   *
   *  The order of the paths is significant. Paths in the beginning of
   *  the collection will be checked first. In the example above,
   *  `/home/ixti/Projects/hike/lib/hike.rb` would shadow the existent of
   *  `/home/ixti/Projects/hike/test/hike.rb`.
   **/
  this.paths = new NormArray(function(p) {
    return Path.resolve(root, p);
  });

  /**
   *  Trail#reverse_aliases -> Object
   *
   *  Mutable mapping of an extension aliases.
   *
   *      trail = new Trail();
   *      trail.append_path("/home/ixti/Projects/hike/site");
   *      trail.alias_extension('htm', 'html');
   *      trail.alias_extension('xhtml', 'html');
   *      trail.alias_extension('php', 'html');
   *
   *  Aliases provide a fallback when the primary extension is not
   *  matched. In the example above, a lookup for "foo.html" will
   *  check for the existence of "foo.htm", "foo.xhtml", or "foo.php".
   **/
  // "aliases" is String -> String (i.e. {"php": "html", "htm": "html"})
  //
  // "reverse_aliases" is String -> [String]
  // (i.e. {"html": ["php", "htm"]}
  //
  // ruby maintains both, but it's faster to just have this one
  this.reverse_aliases = {};

  // cache for filename regexps
  this._patterns = {};
};

var T = module.exports.prototype;

/**
 *  Trail#find(logical_paths[, options, fn]) -> String|Undefined
 *  - logical_paths (String|Array): One or many (fallbacks) logical paths.
 *  - options (Object): Options hash. See description below.
 *  - fn (Function): Block to execute on each matching path. See description below.
 *
 *  Returns the expanded path for a logical path in the path collection.
 *
 *      trail = new Trail("/home/ixti/Projects/hike-js");
 *
 *      trail.extensions.append(".js");
 *      trail.paths.append("lib", "test");
 *
 *      trail.find("hike/trail");
 *      // -> "/home/ixti/Projects/hike-js/lib/hike/trail.js"
 *
 *      trail.find("test_trail");
 *      // -> "/home/ixti/Projects/hike/test/test_trail.js"
 *
 *  `find` accepts multiple fallback logical paths that returns the
 *  first match.
 *
 *      trail.find(["hike", "hike/index"]);
 *
 *  is equivalent to
 *
 *      trail.find("hike") || trail.find("hike/index");
 *
 *  Though `find` always returns the first match, it is possible
 *  to iterate over all shadowed matches and fallbacks by supplying
 *  a _block_ function (`fn`).
 *
 *      trail.find(["hike", "hike/index"], function (path) {
 *        console.warn(path);
 *      });
 *
 *  This allows you to filter your matches by any condition.
 *
 *      trail.find("application", function (path) {
 *        if ("text/css" == mime_type_for(path)) {
 *          return path;
 *        }
 *      });
 *
 *
 *  ##### Options
 *
 *  - **basePath** (String): You can specify "alternative" _base path_ to be
 *    used upon searching. Default: [[Trail#root]].
 *
 *  ##### Block function
 *
 *  Some kind of iterator that is called on each matching pathname. Once this
 *  function returns anything but `undefned` - iteration is stopped and the
 *  value of this function returned.
 *
 *  Default:
 *
 *      function (path) { return path; }
 **/
T.find = function(paths, options, func) {
  return this.find_all(paths, options, func)[0];
};

/**
 *  Trail#find_all(logical_paths[, options, fn]) -> Array
 *  - logical_paths (String|Array): One or many (fallbacks) logical paths.
 *  - options (Object): Options hash. See description below.
 *  - fn (Function): Block to execute on each matching path. See description below.
 *
 *  Returns an array of all matching paths including fallbacks and shadow matches.
 *
 *  See [[Trail#find]] for details.
 **/
T.find_all = function(logical_paths, options, func) {
  var result = find(this, logical_paths, options, func);

  // cache for regexps;
  // without it find_all() will create the same regexp
  // in the loop for every directory in paths
  //
  // CachedTrail keeps it forever,
  // Trail invalidates after each find_all call
  this._patterns = {};

  return result;
};

/**
 *  Trail#stat(pathname) -> Stats|Null
 *  - pathname(String): Pathname to get stats for.
 *
 *  Returns `null` if file does not exists.
 **/
T.stat = function(pathname) {
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

/**
 *  Trail#entries(pathname) -> Array
 *  - pathname(String): Pathname to get files list for.
 *
 *  Version of `fs.readdirSync` that filters out `.` files and
 *  `~` swap files. Returns an empty `Array` if the directory 
 *  does not exist.
 **/
T.entries = function(pathname) {
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

/**
 *  Trail#prepend_path(path) -> Undefined
 *  - path(String): Path to add.
 *
 *  Prepend `path` to `Paths` collection
 **/
T.prepend_path = T.prepend_paths = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.paths.unshift.apply(this.paths, args);
};

/**
 *  Trail#append_path(path) -> Undefined
 *  - path(String): Path to add.
 *
 *  Append `path` to `Paths` collection
 **/
T.append_path = T.append_paths = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.paths.push.apply(this.paths, args);
};

/**
 *  Trail#remove_path(path) -> Undefined
 *  - path(String): Path to remove.
 *
 *  Remove `path` from `Paths` collection
 **/
T.remove_path = function(path) {
  var index = this.paths.indexOf(path);
  if (index !== -1) {
    return this.paths.splice(index, 1)[0];
  }
};

/**
 *  Trail#prepend_extension(extension) -> Undefined
 *  - extension(String): Extension to add.
 *
 *  Prepend `extension` to `Extensions` collection
 **/
T.prepend_extension = T.prepend_extensions = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.extensions.unshift.apply(this.extensions, args);
};

/**
 *  Trail#append_extension(extension) -> Undefined
 *  - extension(String): Extension to add.
 *
 *  Append `extension` to `Extensions` collection
 **/
T.append_extension = T.append_extensions = function() {
  var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
  return this.extensions.push.apply(this.extensions, args);
};

/**
 *  Trail#remove_extension(extension) -> Undefined
 *  - extension(String): Extension to remove.
 *
 *  Remove `extension` from `Extensions` collection
 **/
T.remove_extension = function(ext) {
  var index = this.extensions.indexOf(ext);
  if (index !== -1) {
    return this.extensions.splice(index, 1)[0];
  }
};

/**
 *  Trail#alias_extension(new_extension, old_extension) -> Undefined
 *  - new_extension(String): New extension.
 *  - old_extension(String): Extension to alias.
 *
 *  Alias `new_extension` to `old_extension`
 **/
T.alias_extension = function(new_ext, old_ext) {
  new_ext = normalize_extension(new_ext);
  old_ext = normalize_extension(old_ext);
  if (!this.reverse_aliases[old_ext]) {
    this.reverse_aliases[old_ext] = [];
  }
  if (this.reverse_aliases[old_ext].indexOf(new_ext) === -1) {
    this.reverse_aliases[old_ext].push(new_ext);
  }
};

/**
 *  Trail#unalias_extension(extension) -> Undefined
 *  - extension(String): Extension to unalias.
 *
 *  Remove the alias for `extension`
 **/
T.unalias_extension = function(ext) {
  ext = normalize_extension(ext);
  Object.keys(this.reverse_aliases).forEach(function(k) {
    var i = this.reverse_aliases[k].indexOf(ext);
    if (i !== -1) {
      this.reverse_aliases[k].splice(i, 1);
    }
  });
};

/**
 *  Trail#cached -> CachedTrail
 *
 *  Returns a [[CachedTrail]] object that has the same interface as [[Trail]].
 *  A [[CachedTrail]] is a cached [[Trail]] object that does not update when
 *  the file system changes. If you are confident that you are not making
 *  changes the paths you are searching, `cached()` will avoid excess system
 *  calls.
 *
 *      var index = trail.cached();
 *      index.find("hike/trail");
 *      index.find("test_trail");
 **/
T.cached = function() {
  return new CachedTrail(this);
};
