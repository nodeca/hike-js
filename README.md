hike
====

[![Build Status](https://travis-ci.org/nodeca/hike-js.png?branch=master)](https://travis-ci.org/nodeca/hike-js)

Inspired by [Hike (Ruby)][hike-rb] - a library for finding files in a set
of paths. Use it to implement search paths, load paths, and the like.

See [API docs][apidoc] for details on methods.


Examples
--------

Find JavaScript files in this project:

    trail = new Hike("/home/ixti/Projects/hike-js");
    trail.appendExtensions([".js"]);
    trail.appendPaths(["lib", "test"]);

    trail.find("hike");
    # => "/home/ixti/Projects/hike-js/lib/hike.js"

    trail.find("test_hike");
    # => "/home/ixti/Projects/hike-js/test/test_hike.rb"

Explore your shell path:

    trail = new Hike("/");
    trail.appendPaths(process.env.PATH.split(":"));

    trail.find("ls");
    # => "/bin/ls"

    trail.find("gem");
    # => "/home/ixti/.rvm/rubies/ruby-1.9.2-p290/bin/gem"


Installation
------------

    $ npm install hike


License
-------

Copyright (c) 2012 Vitaly Puzrin

Released under the MIT license. See [LICENSE][license] for details.


[hike-rb]:  https://github.com/sstephenson/hike/
[apidoc]:   http://nodeca.github.com/hike-js/
[license]:  https://raw.github.com/nodeca/hike-js/master/LICENSE
