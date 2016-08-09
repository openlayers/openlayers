goog.provide('ol.test.control.FullScreen');

goog.require('ol.control.FullScreen');

describe('ol.control.FullScreen', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.control.FullScreen();
      expect(instance).to.be.an(ol.control.FullScreen);
    });

  });

});
