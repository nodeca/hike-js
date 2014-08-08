'use strict';

var Path = require('path');

// escape special chars.
// so the string could be safely used as literal in the RegExp.
function regexp_escape(str) {
  return str.replace(/([.?*+{}()\[\]])/g, '\\$1');
}

// tells whenever pathname seems like a relative path or not
function is_relative(pathname) {
  return /^\.\.?\//.test(pathname);
}

// Returns true if `dirname` is a subdirectory of any of the `paths`
function contains_path(self, dirname) {
  // path.dirname() in node doesn't have trailing slash like in ruby
  // thus, /usr/lib/node_modules will "contain" /usr/lib/node
  // TODO: needs tests
  dirname += '/';
  return self.paths.some(function(path) {
    path += '/';
    return path === dirname.substr(0, path.length);
  });
}

// Returns a `Regexp` that matches the allowed extensions.
//
//     pattern_for(self, "index.html");
//     // -> /^index(.html|.htm)(.builder|.erb)*$/
function pattern_for(self, basename) {
  if (!self._patterns[basename]) {
    var extname = Path.extname(basename);
    var aliases = self.reverse_aliases[extname];
    var pattern;

    if (!aliases || !aliases.length) {
      pattern = regexp_escape(basename);
    } else {
      basename = Path.basename(basename, extname);
      pattern = regexp_escape(basename) +
                '(?:' +
                [extname].concat(aliases).map(regexp_escape).join('|') +
                ')';
    }

    pattern += '(?:' + self.extensions.map(regexp_escape).join('|') + ')*';
    self._patterns[basename] = new RegExp('^' + pattern + '$');
  }

  return self._patterns[basename];
}

// Sorts candidate matches by their extension priority.
// Extensions in the front of the `extensions` carry more weight.
function sort_matches(self, matches, basename) {
  var aliases = self.reverse_aliases[Path.extname(basename)] || [];
  var weights = {};

  matches.forEach(function(match) {
    // XXX: this doesn't work well with aliases
    // i.e. entry=index.php, extnames=index.html
    var extnames = match.replace(basename, '').split('.');
    weights[match] = extnames.reduce(function(sum, ext) {
      if (!ext) {
        return sum;
      }

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

  return matches.sort(function(a, b) {
    return weights[a] > weights[b] ? 1 : -1;
  });
}

// Checks if the path is actually on the file system and performs
// any syscalls if necessary.
function match(self, dirname, basename, fn) {
  var matches = self.entries(dirname);
  var pattern = pattern_for(self, basename);
  matches = matches.filter(function(m) { return pattern.test(m); });
  matches = sort_matches(self, matches, basename);

  matches.forEach(function(filename) {
    filename = Path.join(dirname, filename);
    var stats = self.stat(filename);

    if (stats && stats.isFile()) {
      fn(filename);
    }
  });
}

// Finds relative logical path, `../test/test_trail`. Requires a
// `base_path` for reference.
function find_in_base_path(self, logical_path, base_path, fn) {
  var candidate = Path.resolve(base_path, logical_path);
  var dirname   = Path.dirname(candidate);
  var basename  = Path.basename(candidate);

  if (contains_path(self, dirname)) {
    match(self, dirname, basename, fn);
  }
}

// Finds logical path across all `paths`
function find_in_paths(self, logical_path, fn) {
  var dirname  = Path.dirname(logical_path);
  var basename = Path.basename(logical_path);

  self.paths.forEach(function(path) {
    match(self, Path.resolve(path, dirname), basename, fn);
  });
}

module.exports = function find(self, logical_paths, options, fn) {
  var result = [];

  if (!fn) {
    if (typeof(options) === 'function') {
      fn = options;
      options = {};
    }
  }

  if (!options) {
    options = {};
  }

  if (!Array.isArray(logical_paths)) {
    logical_paths = [logical_paths];
  }

  var base_path = options.basePath || self.root;

  var iterator = function(p) {
    result.push(fn ? fn(p) : p);
  };

  logical_paths.forEach(function(logical_path) {
    logical_path = logical_path.replace(/^\//, '');

    if (is_relative(logical_path)) {
      find_in_base_path(self, logical_path, base_path, iterator);
    } else {
      find_in_paths(self, logical_path, iterator);
    }
  });

  return result;
};

