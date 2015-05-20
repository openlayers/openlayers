goog.provide('ol.test.interaction.Modify');

describe('ol.interaction.Modify', function() {

  describe('constructor', function() {
    it('adds features to the RTree', function() {
      var feature = new ol.Feature(
          new ol.geom.Point([0, 0]));
      var features = new ol.Collection([feature]);
      var modify = new ol.interaction.Modify({
        features: features
      });
      var rbushEntries = modify.rBush_.getAll();
      expect(rbushEntries.length).to.be(1);
      expect(rbushEntries[0].feature === feature).to.be.ok();
    });
  });

});

goog.require('ol.Feature');
goog.require('ol.Collection');
goog.require('ol.geom.Point');
goog.require('ol.interaction.Modify');
