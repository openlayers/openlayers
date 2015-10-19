goog.provide('ol.test.interaction.DragAndDrop');

describe('ol.interaction.DragAndDrop', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.interaction.DragAndDrop();
      expect(instance).to.be.an(ol.interaction.DragAndDrop);
    });

  });

});

goog.require('ol.interaction.DragAndDrop');
