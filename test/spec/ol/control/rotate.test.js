goog.provide('ol.test.control.Rotate');

goog.require('ol.control.Rotate');

describe('ol.control.Rotate', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.Rotate();
      expect(instance).to.be.an(ol.control.Rotate);
    });

  });

});
