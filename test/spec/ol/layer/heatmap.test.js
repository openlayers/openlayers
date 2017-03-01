goog.provide('ol.test.layer.Heatmap');

goog.require('ol.layer.Heatmap');


describe('ol.layer.Heatmap', function() {

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var instance = new ol.layer.Heatmap();
      expect(instance).to.be.an(ol.layer.Heatmap);
    });

  });

});
