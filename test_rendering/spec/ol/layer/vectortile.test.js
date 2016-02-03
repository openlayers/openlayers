goog.provide('ol.test.rendering.layer.VectorTile');

describe('ol.rendering.layer.VectorTile', function() {

  var target, map;

  function createMap(renderer) {
    target = createMapDiv(50, 50);

    map = new ol.Map({
      target: target,
      renderer: renderer,
      view: new ol.View({
        center: [1825927.7316762917, 6143091.089223046],
        zoom: 14
      })
    });
    return map;
  }

  function waitForTiles(source, layerOptions, onTileLoaded) {
    var tilesLoading = 0;
    var tileLoaded = 0;

    var update = function() {
      if (tilesLoading === tileLoaded) {
        onTileLoaded();
      }
    };

    source.on('tileloadstart', function(event) {
      tilesLoading++;
    });
    source.on('tileloadend', function(event) {
      tileLoaded++;
      update();
    });
    source.on('tileloaderror', function(event) {
      expect().fail('Tile failed to load');
    });

    var options = {
      source: source
    };
    ol.object.assign(options, layerOptions);
    map.addLayer(new ol.layer.VectorTile(options));
  }

  describe('vector tile layer', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileGrid: ol.tilegrid.createXYZ(),
        tilePixelRatio: 16,
        url: 'spec/ol/data/tiles/mvt/{z}-{x}-{y}.vector.pbf'
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('renders correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      waitForTiles(source, {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/vectortile-canvas.png',
            11.6, done);
      });
    });

  });

});

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTile');
goog.require('ol.object');
goog.require('ol.source.VectorTile');
