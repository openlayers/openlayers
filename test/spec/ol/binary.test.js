goog.provide('ol.test.buffer');

describe('ol.binary.Buffer', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.binary.Buffer();
      expect(instance).to.be.an(ol.binary.Buffer);
    });

  });

});

goog.require('ol.binary.Buffer');
