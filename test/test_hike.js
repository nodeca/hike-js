/*global describe, it, beforeEach*/

'use strict';

// stdlib
var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');

// TODO: Remove once Node.JS < 0.8 support is dropped
fs.existsSync = fs.existsSync || path.existsSync;

// internal
var Hike          = require('..');
var FIXTURE_ROOT  = path.join(__dirname, 'fixtures');

function fixturePath (relPath) {
  return path.join(FIXTURE_ROOT, relPath);
}

describe('Hike', function () {
  var trail;

  beforeEach(function () {
    trail = new Hike(FIXTURE_ROOT);
    trail.appendPaths([ 'app/views', 'vendor/plugins/signal_id/app/views', '.' ]);
    trail.appendExtensions([ 'builder', 'coffee', 'str', '.erb' ]);
    trail.aliasExtension('html', [ 'htm', 'xhtml', 'php' ]);
    trail.aliasExtension('js', 'coffee');
    trail.aliasExtension('css', 'styl');
  });

  it('test trail root', function () {
    assert.equal(FIXTURE_ROOT, trail.root);
  });

  it('test trail paths', function () {
    var expectedPaths = [
      fixturePath('app/views'),
      fixturePath('vendor/plugins/signal_id/app/views'),
      fixturePath('.')
    ];

    assert.deepEqual(expectedPaths, trail.paths);
  });

  it('test trail extensions', function () {
    var expectedExtensions = [ '.builder', '.coffee', '.str', '.erb' ];

    assert.deepEqual(expectedExtensions, trail.extensions);
  });

  it('test trail index', function () {
    // assert_kind_of Hike::Index, trail.index
    // what's the js equivalent?
    assert.equal(trail.root, trail.cached.root);
    assert.deepEqual({}, trail.cached.__entries__);
    assert.equal(undefined, trail.__entries__);
  });

  it('test nonexistent file', function () {
    assert.equal(undefined, trail.find('people/show.html'));
  });

  it('test find without an extension', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('projects/index.html'));
  });

  it('test find with an extension', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('projects/index.html.erb'));
  });

  it('test find with leading slash', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('/projects/index.html'));
  });

  it('test find respects path order', function () {
    assert.equal( fixturePath('app/views/layouts/interstitial.html.erb'),
      trail.find('layouts/interstitial.html'));
    // trail = new_trail { |t| t.paths.replace t.paths.reverse }
    trail.prependPaths('vendor/plugins/signal_id/app/views');
    assert.equal( fixturePath('vendor/plugins/signal_id/app/views/layouts/interstitial.html.erb'),
      trail.find('layouts/interstitial.html'));
  });

  it('test find respects extension order', function () {
    assert.equal( fixturePath('app/views/recordings/index.atom.builder'),
      trail.find('recordings/index.atom'));
    // trail = new_trail { |t| t.paths.replace t.paths.reverse }
    trail.prependExtensions('erb');
    assert.equal( fixturePath('app/views/recordings/index.atom.erb'),
      trail.find('recordings/index.atom'));
  });

  it('test find with multiple logical paths returns first match', function () {
    assert.equal(fixturePath('app/views/recordings/index.html.erb'),
      trail.find([ 'recordings/index.txt', 'recordings/index.html', 'recordings/index.atom' ]));
  // no recordings/index.txt.*
  });

  it('test find file in path root returns expanded path', function () {
    assert.equal(fixturePath('app/views/index.html.erb'),
      trail.find('index.html'));
  });

  it('test find extensionless file', function () {
    assert.equal(fixturePath('README'), trail.find('README'));
  });

  it('test find file with multiple extensions', function () {
    assert.equal(
      fixturePath('app/views/projects/project.js.coffee.erb'),
      trail.find('projects/project.js'));
  });

  it('test find file with multiple extensions respects extension order', function () {
    assert.equal(
      fixturePath('app/views/application.js.coffee.str'),
      trail.find('application.js'));
    // trail = new_trail { |t| t.paths.replace t.paths.reverse }
    trail.prependExtensions('erb');
    assert.equal( fixturePath('app/views/application.js.coffee.erb'),
      trail.find('application.js'));
  });

  it('test find file by aliased extension', function () {
    assert.equal(
      fixturePath('app/views/people.coffee'),
      trail.find('people.coffee'));
    assert.equal(
      fixturePath('app/views/people.coffee'),
      trail.find('people.js'));
    assert.equal(
      fixturePath('app/views/people.htm'),
      trail.find('people.htm'));
    assert.equal(
      fixturePath('app/views/people.htm'),
      trail.find('people.html'));
  });

  it('test find file with aliases prefers primary extension', function () {
    assert.equal(fixturePath('app/views/index.html.erb'),
      trail.find('index.html'));
    assert.equal(fixturePath('app/views/index.php'),
      trail.find('index.php'));
  });

  it('test find with base path option and relative logical path', function () {
    assert.equal(fixturePath('app/views/projects/index.html.erb'),
      trail.find('./index.html', { 'basePath': fixturePath('app/views/projects') }));
  });

  it('test find ignores base path option when logical path is not relative', function () {
    assert.equal(fixturePath('app/views/index.html.erb'),
      trail.find('index.html', { 'basePath': fixturePath('app/views/projects') }));
  });

  it('test base path option must be expanded', function () {
    assert.equal(undefined,
      trail.find('./index.html', { 'basePath': 'app/views/projects' }));
  });

  it('test relative files must exist in the path', function () {
    assert.doesNotThrow(function () {
      require('fs').statSync(path.join(FIXTURE_ROOT, '../test_hike.js'));
    });

    assert.equal(undefined,
      trail.find('../test_hike.js', { 'basePath': FIXTURE_ROOT }));
  });

  it('test find all respects path order', function () {
    var results = [];
    trail.find('layouts/interstitial.html', function (apath){
      results.push(apath);
    });
    assert.deepEqual([
      fixturePath('app/views/layouts/interstitial.html.erb'),
      fixturePath('vendor/plugins/signal_id/app/views/layouts/interstitial.html.erb')
    ], results);
  });

  it('test find all with multiple extensions respects extension order', function () {
    var results = [];
    trail.find('application.js', function (apath){
      results.push(apath);
    });
    assert.deepEqual([
      fixturePath('app/views/application.js.coffee.str'),
      fixturePath('app/views/application.js.coffee.erb')
    ], results);
  });

  it('test find filename instead directory', function () {
    assert.equal(fixturePath('app/views/projects.erb'),
      trail.find('projects'));
  });

  it('test ignores directories', function () {
    assert.equal(undefined, trail.find('recordings'));
  });

  it('test entries', function () {
    var entries = trail.entries(fixturePath('app/views')).sort();
    var expected = [
      'application.js.coffee.erb',
      'application.js.coffee.str',
      'index.html.erb',
      'index.php',
      'layouts',
      'people.coffee',
      'people.htm',
      'projects',
      'projects.erb',
      'recordings'
    ];
    assert.deepEqual(entries, expected);
  });

  it('test stat', function () {
    assert(trail.stat(fixturePath('app/views/index.html.erb')));
    assert(trail.stat(fixturePath('app/views')));
    assert.equal(undefined, trail.stat(fixturePath('app/views/missing.html')));
  });

  it('test find reflects changes in the file system', function () {
    var tempfile = fixturePath('dashboard.html');
    assert.equal(undefined, trail.find('dashboard.html'));
    try {
      fs.writeFileSync(tempfile, '');
      assert.equal(fixturePath('dashboard.html'), trail.find('dashboard.html'));
    } finally {
      fs.unlinkSync(tempfile);
      assert(!fs.existsSync(tempfile));
    }
  });

  it('should find pathname respecting extension aliases', function () {
    trail.appendPaths('assets/css');
    assert.ok(trail.find('app.css'), 'Asset found');
  });
});

describe('Trail#cached', function () {
  var originalTrail;
  var trail;
  var asset;

  beforeEach(function () {
    trail = new Hike(FIXTURE_ROOT);
    trail.appendPaths([ 'app/views', 'vendor/plugins/signal_id/app/views', '.' ]);
    trail.appendExtensions([ 'builder', 'coffee', 'str', '.erb' ]);
    trail.aliasExtension('html', [ 'htm', 'xhtml', 'php' ]);
    trail.aliasExtension('js', 'coffee');
    originalTrail = trail;
    trail = trail.cached;
  });

  // rb reruns most of previous tests using this trail.index
  // pick one at random
  it('test find file with multiple extensions', function () {
    assert.equal(
      fixturePath('app/views/projects/project.js.coffee.erb'),
      trail.find('projects/project.js'));
  });

  it('test changing trail path doesnt affect index', function () {
    trail = new Hike(FIXTURE_ROOT);
    trail.appendPaths('.');
    var index = trail.cached;
    assert.deepEqual([ fixturePath('.') ], trail.paths);
    assert.deepEqual([ fixturePath('.') ], index.paths);
    trail.appendPaths('app/views');
    assert.deepEqual([ fixturePath('.'), fixturePath('app/views') ], trail.paths);
    assert.deepEqual([ fixturePath('.') ], index.paths);
  });


  it('test changing trail extensions doesnt affect index', function () {
    trail = new Hike(FIXTURE_ROOT);
    trail.appendExtensions('builder');
    var index = trail.cached;
    assert.deepEqual([ '.builder' ], trail.extensions);
    assert.deepEqual([ '.builder' ], index.extensions);
    trail.appendExtensions('str');
    assert.deepEqual([ '.builder', '.str' ], trail.extensions);
    assert.deepEqual([ '.builder' ], index.extensions);
  });


  it('test index find does not reflect changes in the file system', function () {
    // trail here is its index
    var tempfile = fixturePath('dashboard.html');
    assert(!fs.existsSync(tempfile));
    assert.equal(undefined, trail.find('dashboard.html'));
    try {
      fs.writeFileSync(tempfile, '');
      asset = trail.find('dashboard.html');
      assert.equal(undefined, asset);
    } finally {
      fs.unlinkSync(tempfile);
      assert(!fs.existsSync(tempfile));
    }
  });

  it('test index stat does not reflect changes in the file system', function () {
    var tempfile = fixturePath('dashboard.html');
    var firstStat;
    var secondStat;
    try {
      firstStat = trail.stat(tempfile);
      fs.writeFileSync(tempfile, '');
      secondStat = trail.stat(tempfile);
      assert.equal(null, firstStat);
      assert.equal(null, secondStat);

      var index = originalTrail.cached;
      firstStat = index.stat(tempfile);
      // write to file to change mtime
      fs.writeFileSync(tempfile, '');
      secondStat = index.stat(tempfile);
      assert.equal(firstStat.mtime, secondStat.mtime);
    } finally {
      fs.unlinkSync(tempfile);
      assert(!fs.existsSync(tempfile));
    }
  });
});
