goog.provide('ol.test.interaction.Snap');

describe('ol.interaction.Snap', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.Snap();
      expect(instance).to.be.an(ol.interaction.Snap);
    });

  });

});

goog.require('ol.interaction.Snap');
