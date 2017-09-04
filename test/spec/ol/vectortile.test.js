

goog.require('ol.Feature');
goog.require('ol.VectorImageTile');
goog.require('ol.VectorTile');
goog.require('ol.events');
goog.require('ol.format.TextFeature');
goog.require('ol.proj');
goog.require('ol.proj.Projection');


describe('ol.VectorTile', function() {

  it('loader sets features on the tile and updates proj units', function(done) {
    // mock format that return a tile-pixels feature
    var format = new ol.format.TextFeature();
    format.readProjection = function(source) {
      return new ol.proj.Projection({
        code: '',
        units: 'tile-pixels'
      });
    };
    format.readFeatures = function(source, options) {
      return [new ol.Feature()];
    };

    var tile = new ol.VectorTile([0, 0, 0], null, null, format);
    var url = 'spec/ol/data/point.json';

    ol.VectorImageTile.defaultLoadFunction(tile, url);
    var loader = tile.loader_;
    ol.events.listen(tile, 'change', function(e) {
      expect(tile.getFeatures().length).to.be.greaterThan(0);
      expect(tile.getProjection().getUnits()).to.be('tile-pixels');
      done();
    });
    loader.call(tile, [], 1, ol.proj.get('EPSG:3857'));
  });

});
