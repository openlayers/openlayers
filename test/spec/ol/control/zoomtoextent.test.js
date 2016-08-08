goog.provide('ol.test.control.ZoomToExtent');

goog.require('ol.control.ZoomToExtent');

describe('ol.control.ZoomToExtent', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.ZoomToExtent();
      expect(instance).to.be.an(ol.control.ZoomToExtent);
    });

  });

});
