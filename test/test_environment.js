/*global describe, it, beforeEach*/


'use strict';


// stdlib
var path    = require('path');
var assert  = require('assert');


// internal
var Trail = require('../').Trail;


describe('Trail', function () {
  var trail;


  beforeEach(function () {
    trail = new Trail(path.join(__dirname, 'fixtures'));
    trail.append_paths('assets/css');
    trail.alias_extension('styl', 'css');
  });


  it('should find pathname respecting extension aliases', function () {
    assert.ok(trail.find('app.css'), 'Asset found');
  });
});
