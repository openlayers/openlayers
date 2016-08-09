goog.provide('ol.test.interaction.DragRotateAndZoom');

goog.require('ol.interaction.DragRotateAndZoom');

describe('ol.interaction.DragRotateAndZoom', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.DragRotateAndZoom();
      expect(instance).to.be.an(ol.interaction.DragRotateAndZoom);
    });

  });

});
