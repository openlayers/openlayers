goog.provide('ol.test.Overlay');

describe('ol.Overlay', function() {

  describe('constructor', function() {

    it('can be constructed with minimal arguments', function() {
      var instance = new ol.Overlay({});
      expect(instance).to.be.an(ol.Overlay);
    });

  });

});

goog.require('ol.Overlay');
