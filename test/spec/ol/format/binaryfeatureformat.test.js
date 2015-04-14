goog.provide('ol.test.format.BinaryFeature');

describe('ol.format.BinaryFeature', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.format.BinaryFeature();
      expect(instance).to.be.an(ol.format.BinaryFeature);
    });

  });

});

goog.require('ol.format.BinaryFeature');
