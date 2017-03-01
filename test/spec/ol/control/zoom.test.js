goog.provide('ol.test.control.Zoom');

goog.require('ol.control.Zoom');

describe('ol.control.Zoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.Zoom();
      expect(instance).to.be.an(ol.control.Zoom);
    });

  });

});
