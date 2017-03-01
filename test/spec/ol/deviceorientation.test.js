goog.provide('ol.test.DeviceOrientation');

goog.require('ol.DeviceOrientation');


describe('ol.DeviceOrientation', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.DeviceOrientation();
      expect(instance).to.be.an(ol.DeviceOrientation);
    });

  });

});
