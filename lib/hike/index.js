/** internal
 *  class Index
 *
 *  Cached variant of `Trail`. It assumes the file system does not change
 *  between `find` calls. All `stat` and `entries` calls are cached for the
 *  lifetime of the `Index` object.
 **/


"use strict";


// stdlib
var fs = require('fs');
var path = require('path');


// 3rd-party
var _ = require('underscore');


// internal
var prop = require('./common').prop;


// HELPERS /////////////////////////////////////////////////////////////////////


// escape special chars.
// so the string could be safely used as literal in the RegExp.
function regexp_escape(str) {
  return str.replace(/([.?*+{}()\[\]])/g, '\\$1');
}


// tells whenever pathname seems like a relative path or not
function is_relative(pathname) {
  return (/^\.{1,2}\//).test(pathname);
}


// helper that stubs `proto` object with stub methods throwing
// error when they are called (used to keep interfacte of Index
// and Trail identical, but do not allow call some of mutators
// on Index
function stub(proto, funcs, msg) {
  funcs.forEach(function (fn) {
    proto[fn] = function () {
      throw new Error("Can't call " + fn + "(): " + msg);
    };
  });
}


// PRIVATE /////////////////////////////////////////////////////////////////////


// returns list of registered aliases for given extensions, e.g.:
//     find_aliases_for(self, '.js') -> ['.coffee']
function find_aliases_for(self, extension) {
  var aliases = [];

  _.each(self.aliases, function (value, key) {
    if (value === extension) {
      aliases.push(key);
    }
  });

  return aliases;
}


// Sorts candidate matches by their extension priority.
// Extensions in the front of the `extensions` carry more weight.
function sort_matches(self, matches, basename) {
  var aliases = find_aliases_for(self, path.extname(basename));

  return _.sortBy(matches, function (match) {
    var extnames = match.replace(basename, '').split(/\./);
    return extnames.reduce(function (sum, ext) {
      ext = '.' + ext;

      if (0 <= self.extensions.indexOf(ext)) {
        return sum + self.extensions.indexOf(ext) + 1;
      } else if (0 <= aliases.indexOf(ext)) {
        return sum + aliases.indexOf(ext) + 11;
      } else {
        return sum;
      }
    }, 0);
  });
}


// Returns a `Regexp` that matches the allowed extensions.
//
//     pattern_for(self, "index.html");
//     // -> /^index(.html|.htm)(.builder|.erb)*$/
function pattern_for(self, basename) {
  var aliases, extname, pattern;

  if (!self.__patterns__[basename]) {
    extname = path.extname(basename);
    aliases = find_aliases_for(self, extname);

    if (0 === aliases.length) {
      pattern = regexp_escape(basename);
    } else {
      basename = path.basename(basename, extname);
      aliases  = [extname].concat(aliases);
      pattern  = regexp_escape(basename) +
                 '(?:' + _.map(aliases, regexp_escape).join('|') + ')';
    }

    pattern += '(?:' + _.map(self.extensions.slice(), regexp_escape).join('|') + ')*';
    self.__patterns__[basename] = new RegExp('^' + pattern + '$');
  }

  return self.__patterns__[basename];
}


// Checks if the path is actually on the file system and performs
// any syscalls if necessary.
function match(self, dirname, basename, fn) {
  var ret, pathname, stats, pattern, matches = self.entries(dirname);

  pattern = pattern_for(self, basename);
  matches = matches.filter(function (m) { return pattern.test(m); });
  matches = sort_matches(self, matches, basename);

  while (matches.length && undefined === ret) {
    pathname = path.join(dirname, matches.shift());
    stats    = self.stat(pathname);

    if (stats && stats.isFile()) {
      ret = fn(pathname);
    }
  }

  return ret;
}


// Returns true if `dirname` is a subdirectory of any of the `paths`
function contains_path(self, dirname) {
  return _.any(self.paths, function (path) {
    return path === dirname.substr(0, path.length);
  });
}


// Finds relative logical path, `../test/test_trail`. Requires a
// `base_path` for reference.
function find_in_base_path (self, logical_path, base_path, fn) {
  var candidate = path.resolve(base_path, logical_path),
      dirname   = path.dirname(candidate),
      basename  = path.basename(candidate);

  if (contains_path(self, dirname)) {
    return match(self, dirname, basename, fn);
  }
}


// Finds logical path across all `paths`
function find_in_paths(self, logical_path, fn) {
  var dirname   = path.dirname(logical_path),
      basename  = path.basename(logical_path),
      paths     = self.paths.slice(),
      pathname;

  while (paths.length && undefined === pathname) {
    pathname = match(self, path.resolve(paths.shift(), dirname), basename, fn);
  }

  return pathname;
}


// PUBLIC //////////////////////////////////////////////////////////////////////


/**
 *  new Index(root, paths, extensions, aliases)
 **/
var Index = module.exports = function (root, paths, extensions, aliases) {
  /** internal, read-only
   *  Index#root -> String
   *
   *  Root path. This attribute is immutable.
   **/
  prop(this, 'root', root);

  // Freeze is used here so an error is throw if a mutator method
  // is called on the array. Mutating `paths`, `extensions`, or
  // `aliases` would have unpredictable results.

  /** read-only
   *  Index#paths -> Array
   *
   *  Immutable array representation of [[Paths]] collection.
   **/
  prop(this, 'paths', Object.freeze(paths.toArray()));

  /** read-only
   *  Index#extensions -> Array
   *
   *  Immutable array representation of [[Extensions]] collection.
   **/
  prop(this, 'extensions', Object.freeze(extensions.toArray()));

  /** read-only
   *  Index#aliases -> Object
   *
   *  Immutable map of aliases.
   **/
  prop(this, 'aliases', Object.freeze(_.clone(aliases)));

  // internal cache

  prop(this, '__entries__',   {});
  prop(this, '__patterns__',  {});
  prop(this, '__stats__',     {});
};


/**
 *  Index#index -> Index
 *
 *  Self-reference to be compatable with the `Trail` interface.
 **/
Object.defineProperty(Index.prototype, 'index', {
  get: function () {
    return this;
  }
});


// not documenting this methods, as they are not supposed to be used on
// Index instance. Methods are kept just to keep same as Trail interface.
stub(Index.prototype,
     ['prependPaths', 'appendPaths', 'removePath'],
     'Index#paths are immutable');
stub(Index.prototype,
     ['prependExtensions', 'appendExtensions', 'removeExtension'],
     'Index#extensions are immutable');
stub(Index.prototype,
     ['aliasExtension', 'unaliasExtension'],
     'Index#aliases are immutable');


/**
 *  Index#find(logical_paths[, options][, fn]) -> String
 *
 *  The real implementation of `find`. [[Trail#find]] generates a one
 *  time index and delegates here.
 *
 *  See [[Trail#find]] for usage.
 **/
Index.prototype.find = function (logical_paths, options, fn) {
  var pathname, base_path, logical_path;

  if (!fn && _.isFunction(options)) {
    fn = options;
    options = {};
  } else if (!fn) {
    return this.find(logical_paths, options, function (p) {
      return p;
    });
  }

  options       = options || {};
  base_path     = options.base_path || this.root;
  logical_paths = _.isArray(logical_paths) ? logical_paths.slice() : [logical_paths];

  while (logical_paths.length && undefined === pathname) {
    logical_path  = logical_paths.pop().replace(/^\//, '');

    if (is_relative(logical_path)) {
      pathname = find_in_base_path(this, logical_path, base_path, fn);
    } else {
      pathname = find_in_paths(this, logical_path, fn);
    }
  }

  return pathname;
};


/**
 *  Index#entries(pathname) -> Array
 *  - pathname(String): Pathname to get files list for.
 *
 *  A cached version of `fs.readdirSync` that filters out `.` files and
 *  `~` swap files. Returns an empty `Array` if the directory does
 *  not exist.
 **/
Index.prototype.entries = function (pathname) {
  if (!this.__entries__[pathname]) {
    try {
      this.__entries__[pathname] = [];
      this.__entries__[pathname] = fs.readdirSync(pathname).filter(function (f) {
        return !/^\.|~$|^\#.*\#$/.test(f);
      }).sort();
    } catch (err) {
      if ('ENOENT' !== err.code) {
        throw err;
      }
    }
  }

  return this.__entries__[pathname];
};


/**
 *  Index#stat(pathname) -> Stats|Null
 *  - pathname(String): Pathname to get stats for.
 *
 *  Cached version of `path.statsSync()`.
 *  Retuns `null` if file does not exists.
 **/
Index.prototype.stat = function (pathname) {
  if (null !== this.__stats__[pathname]) {
    try {
      this.__stats__[pathname] = null;
      this.__stats__[pathname] = fs.statSync(pathname);
    } catch (err) {
      if ('ENOENT' !== err.code) {
        throw err;
      }
    }
  }

  return this.__stats__[pathname];
};
