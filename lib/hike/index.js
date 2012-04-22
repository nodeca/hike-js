"use strict";


// stdlib
var fs = require('fs');
var path = require('path');


// 3rd-party
var _ = require('underscore');


// internal
var prop = require('./common').prop;


// HELPERS /////////////////////////////////////////////////////////////////////


function regexp_escape(str) {
  return str.replace(/([.?*+{}()\[\]])/g, '\\$1');
}


function is_relative(pathname) {
  return (/^\.{1,2}\//).test(pathname);
}


// PRIVATE /////////////////////////////////////////////////////////////////////


function find_aliases_for(self, extension) {
  var aliases = [];

  _.each(self.aliases, function (value, key) {
    if (value === extension) {
      aliases.push(key);
    }
  });

  return aliases;
}


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


function find_in_base_path (self, logical_path, base_path, fn) {
  var candidate = path.resolve(base_path, logical_path),
      dirname   = path.dirname(candidate),
      basename  = path.basename(candidate);

  if (self.containsPath(dirname)) {
    return match(self, dirname, basename, fn);
  }
}


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


var Index = module.exports = function (root, paths, extensions, aliases) {
  prop(this, 'root',          root);

  // Freeze is used here so an error is throw if a mutator method
  // is called on the array. Mutating `paths`, `extensions`, or
  // `aliases` would have unpredictable results.
  prop(this, 'paths',         Object.freeze(paths.toArray()));
  prop(this, 'extensions',    Object.freeze(extensions.toArray()));
  prop(this, 'aliases',       Object.freeze(_.clone(aliases)));

  prop(this, '__entries__',   {});
  prop(this, '__patterns__',  {});
  prop(this, '__stats__',     {});
};


Object.defineProperty(Index.prototype, 'index', {
  get: function () {
    return this;
  }
});


Index.prototype.find = function (logical_paths, options, fn) {
  var pathname, base_path, logical_path;

  if (!fn) {
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



// A cached version of `fs.readdirSync` that filters out `.` files and
// `~` swap files. Returns an empty `Array` if the directory does
// not exist.
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


// Cached version of path.statsSync(). Retuns null if file does not exists.
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


// Returns true if `dirname` is a subdirectory of any of the `paths`
Index.prototype.containsPath = function (dirname) {
  return _.any(this.paths, function (path) {
    return path === dirname.substr(0, path.length);
  });
};
