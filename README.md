hike
====

[![Build Status](https://travis-ci.org/nodeca/hike-js.png?branch=master)](https://travis-ci.org/nodeca/hike-js)

Javascript port of [Hike (Ruby)][hike] - a library for finding files in a set
of paths. Use it to implement search paths, load paths, and the like.

See [API docs][apidoc] for details on methods.


Examples
--------

Find JavaScript files in this project:

```js
trail = new hike.Trail("/home/ixti/Projects/hike-js");
trail.append_extension(".js");
trail.append_paths("lib", "test");

trail.find("hike/trail");
// => "/home/ixti/Projects/hike-js/lib/hike/trail.js"

trail.find("test_trail");
// => "/home/ixti/Projects/hike-js/test/test_trail.js"
```

Explore your shell path:

```js
trail = new hike.Trail("/");
trail.append_paths(process.env.PATH.split(":"));

trail.find("ls");
// => "/bin/ls"

trail.find("gem");
// => "/home/ixti/.rvm/rubies/ruby-1.9.2-p290/bin/gem"
```


Installation
------------

```sh
$ npm install hike
```

Migration from 0.1.x
--------------------

`Trail.paths` and `Trail.extensions` collections are now private, you should modify them with methods in the `Trail` class:

```js
// was:
trail.paths.prepend(path1, path2, ...)
trail.paths.append(path1, path2, ...)
trail.paths.remove(path)

// will be:
trail.prepend_paths(path1, path2, ...)
trail.append_paths(path1, path2, ...)
trail.remove_path(path)
```

```js
// was:
trail.extensions.prepend(ext1, ext2, ...)
trail.extensions.append(ext1, ext2, ...)
trail.extensions.remove(ext)

// will be:
trail.prepend_extensions(ext1, ext2, ...)
trail.append_extensions(ext1, ext2, ...)
trail.remove_extension(ext)
```

`Trail.aliases` collection is now private, you should modify it with methods in the `Trail` class. Note that those methods do not accept multiple arguments, so you should add extensions one by one:

```js
// was:
trail.aliases.append(old_ext, ext1, ext2, ext3)
trail.aliases.remove(ext)

// will be:
trail.alias_extension(ext1, old_ext)
trail.alias_extension(ext2, old_ext)
trail.alias_extension(ext3, old_ext)
trail.unalias_extension(ext)
```

`Trail.index` renamed to `Trail.cached()`. It's now function instead of a getter.

```js
// was:
trail.index.find(path)

// will be:
trail.cache().find(path)
```

License
-------

Copyright (c) 2012 Vitaly Puzrin

Released under the MIT license. See [LICENSE][license] for details.


[hike]:     https://github.com/sstephenson/hike/
[apidoc]:   http://nodeca.github.com/hike-js/
[license]:  https://raw.github.com/nodeca/hike-js/master/LICENSE
