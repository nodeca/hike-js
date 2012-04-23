/**
 *  class Trail
 *
 *  Public container class for holding paths and extensions.
 **/


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


// internal helper that makes function proxies to index methods
function index_proxy(proto, func) {
  proto[func] = function () {
    var index = this.index;
    return index[func].apply(index, arguments);
  };
}

/**
 *  new Trail(root = '.')
 *
 *  A Trail accepts an optional root path that defaults to your
 *  current working directory. Any relative paths added to
 *  [[Trail#paths]] will expanded relative to the root.
 **/
var Trail = module.exports = function Trail(root) {
  /** internal, read-only
   *  Trail#root -> String
   *
   *  Root path. This attribute is immutable.
   **/
  prop(this, 'root', path.resolve(root || '.'));

  /**
   *  Trail#paths -> Paths
   *
   *  Mutable [[Paths]] collection.
   *
   *      trail = new Trail();
   *      trail.paths.append("~/Projects/hike/lib", "~/Projects/hike/test");
   *
   *  The order of the paths is significant. Paths in the beginning of
   *  the collection will be checked first. In the example above,
   *  `~/Projects/hike/lib/hike.rb` would shadow the existent of
   *  `~/Projects/hike/test/hike.rb`.
   *
   *  ##### See Also
   *
   *  - [[Trail#prependPaths]]
   *  - [[Trail#appendPaths]]
   *  - [[Trail#removePath]]
   **/
  prop(this, 'paths', new Paths(this.root));

  /**
   *  Trail#extensions -> Extensions
   *
   *  Mutable [[Extensions]] collection.
   *
   *      trail = new Trail();
   *      trail.paths.append("~/Projects/hike/lib");
   *      trail.extensions.append(".rb");
   *
   *  Extensions allow you to find files by just their name omitting
   *  their extension. Is similar to Ruby's require mechanism that
   *  allows you to require files with specifiying `foo.rb`.
   *
   *  ##### See Also
   *
   *  - [[Trail#prependExtensions]]
   *  - [[Trail#appendExtensions]]
   *  - [[Trail#removeExtension]]
   **/
  prop(this, 'extensions', new Extensions());

  /**
   *  Trail#aliases -> Object
   *
   *  Mutable mapping of an extension aliases.
   *
   *      trail = new Trail();
   *      trail.paths.append("~/Projects/hike/site");
   *      trail.aliases['.htm']   = 'html';
   *      trail.aliases['.xhtml'] = 'html';
   *      trail.aliases['.php']   = 'html';
   *
   *  Aliases provide a fallback when the primary extension is not
   *  matched. In the example above, a lookup for "foo.html" will
   *  check for the existence of "foo.htm", "foo.xhtml", or "foo.php".
   *
   *  ##### See Also
   *
   *  - [[Trail#aliasExtension]]
   *  - [[Trail#unaliasExtension]]
   **/
  prop(this, 'aliases',    {});
};


/**
 *  Trail#index -> Index
 *
 *  `Trail#index` returns an `Index` object that has the same
 *  interface as `Trail`. An `Index` is a cached `Trail` object that
 *  does not update when the file system changes. If you are
 *  confident that you are not making changes the paths you are
 *  searching, `index` will avoid excess system calls.
 *
 *      index = trail.index;
 *      index.find("hike/trail");
 *      index.find("test_trail");
 **/
Object.defineProperty(Trail.prototype, 'index', {
  get: function () {
    return new Index(this.root, this.paths, this.extensions, this.aliases);
  }
});


/**
 *  Trail#prependPaths(*paths) -> Void
 *  - paths (String|Array): String or an array of paths
 *
 *  Prepend `paths` to the [[Trail#paths]] collection.
 *  Proxy to [[Paths#prepend]].
 **/
Trail.prototype.prependPaths = function () {
  this.paths.prepend(_.flatten(arguments));
};


/**
 *  Trail#appendPaths(*paths) -> Void
 *  - paths (String|Array): String or an array of paths
 *
 *  Append `paths` to the [[Trail#paths]] collection.
 *  Proxy to [[Paths#append]].
 **/
Trail.prototype.appendPaths = function () {
  this.paths.append(_.flatten(arguments));
};


/**
 *  Trail#removePath(path) -> Void
 *  - path (String): Pathname to be removed.
 *
 *  Remove `path` from [[Trail#paths]] collection.
 **/
Trail.prototype.removePath = function (path) {
  this.paths.remove(path);
};


/**
 *  Trail#prependExtensions(*extensions) -> Void
 *  - extensions (String|Array): String or an array of extensions
 *
 *  Prepend `extensions` to the [[Trail#extensions]] collection.
 *  Proxy to [[Extensions#prepend]].
 **/
Trail.prototype.prependExtensions = function () {
  this.extensions.prepend(_.flatten(arguments));
};


/**
 *  Trail#appendExtensions(*extensions) -> Void
 *  - extensions (String|Array): String or an array of extensions
 *
 *  Append `extensions` to the [[Trail#extensions]] collection.
 *  Proxy to [[Extensions#append]].
 **/
Trail.prototype.appendExtensions = function () {
  this.extensions.append(_.flatten(arguments));
};


/**
 *  Trail#removeExtension(extension) -> Void
 *  - extension (String): Extension to be removed.
 *
 *  Remove `extension` from [[Trail#extensions]] collection.
 **/
Trail.prototype.removeExtension = function (extension) {
  this.extensions.remove(extension);
};


/**
 *  Trail#aliasExtension(new_extension, old_extension) -> Void
 *  - new_extension (String): Alias
 *  - old_extension (String): Aliased extension
 *
 *  Register `new_extension` as an lias of `old_extension`.
 **/
Trail.prototype.aliasExtension = function (new_extension, old_extension) {
  new_extension = Extensions.normalize(new_extension);
  old_extension = Extensions.normalize(old_extension);

  this.aliases[new_extension] = old_extension;
};


/**
 *  Trail#unaliasExtension(extension) -> Void
 *  - extension (String): Alias
 *
 *  Remove alias extension.
 **/
Trail.prototype.unaliasExtension = function (extension) {
  delete this.aliases[Extensions.normalize(extension)];
};


/**
 *  Trail#find(logical_paths[, options][, fn]) -> String
 *  - logical_paths (String|Array): One or many (fallbacks) logical paths.
 *  - options (Object): Options hash. See description below.
 *  - fn (Function): Block to execute on each matching path. See description below.
 *
 *  Returns the expanded path for a logical path in the path collection.
 *
 *      trail = new Trail("~/Projects/hike-js");
 *
 *      trail.extensions.append(".js");
 *      trail.paths.append("lib", "test");
 *
 *      trail.find("hike/trail");
 *      // -> "~/Projects/hike-js/lib/hike/trail.js"
 *
 *      trail.find("test_trail");
 *      // -> "~/Projects/hike/test/test_trail.js"
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
 *  - **base_path** (String): You can specify "alternative" _base_path_ to be
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
index_proxy(Trail.prototype, 'find');


/**
 *  Trail#entries(pathname) -> Array
 *
 *  Wrapper over [[Index#entries]] using one-time instance of [[Trail#index]].
 **/
index_proxy(Trail.prototype, 'entries');


/**
 *  Trail#stat(pathname) -> Stats|Null
 *
 *  Wrapper over [[Index#stat]] using one-time instance of [[Trail#index]].
 **/
index_proxy(Trail.prototype, 'stat');
