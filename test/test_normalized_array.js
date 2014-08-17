/*global describe, it, beforeEach*/


'use strict';


// stdlib
var assert = require('assert');


// internal
var NormalizedArray = require('../lib/normalized_array');


describe('NormalizedArray', function () {
  var array;


  beforeEach(function () {
    array = new NormalizedArray(function(el) {
      return el.toUpperCase();
    });
  });


  it('should normalize prepended elements', function () {
    array.push('a', 'b', 'c');
    assert.equal('A,B,C', array.join(','));
  });


  it('should insert prepended elements to the head', function () {
    array.unshift('a');
    array.unshift('b');
    array.unshift('c');
    assert.equal('C,B,A', array.join(','));
  });


  it('should push appended elements to the tail', function () {
    array.push('a');
    array.push('b');
    array.push('c');
    assert.equal('A,B,C', array.join(','));
  });


  it('should normalize appended elements', function () {
    array.push('a', 'b', 'c');
    assert.equal('A,B,C', array.join(','));
  });


  it('should allow remove element, respecting normalization', function () {
    array.push('a', 'b', 'c');

    array.splice(array.indexOf('b'), 1);
    array.splice(array.indexOf('C'), 1);

    assert.equal('A', array.join(','));
  });


  it('should allow getting indexOf() element, respecting normalization', function () {
    array.push('foo');

    assert.equal(0, array.indexOf('FOO'));
    assert.equal(0, array.indexOf('foo'));
    assert.equal(-1, array.indexOf('bar'));
  });
});
