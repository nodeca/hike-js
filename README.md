hike
====

[![Build Status](https://travis-ci.org/nodeca/hike-js.svg?branch=master)](https://travis-ci.org/nodeca/hike-js)
[![NPM version](https://img.shields.io/npm/v/hike.svg)](https://www.npmjs.org/package/hike)

Inspired by [Hike (Ruby)](https://github.com/sstephenson/hike/) - a library for
finding files in a set of paths. It's done specially for
[mincer](https://github.com/nodeca/mincer) to simplify maintenance and not
recommended for direct use in other projects. Please remember, we don't accept
feature requests not related to mincer improvments.

See [API docs](https://nodeca.github.io/hike-js/) for details on methods.


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

Copyright (c) 2014 Vitaly Puzrin, Aleksey V Zapparov

Released under the MIT license. See [LICENSE][license] for details.

[license]:  https://raw.github.com/nodeca/hike-js/master/LICENSE
