goog.provide('ol.test.rendering.layer.VectorTile');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.layer.VectorTile');
goog.require('ol.obj');
goog.require('ol.source.VectorTile');
goog.require('ol.tilegrid');


describe('ol.rendering.layer.VectorTile', function() {

  var target, map;

  function createMap(renderer, opt_pixelRatio) {
    target = createMapDiv(50, 50);

    map = new ol.Map({
      pixelRatio: opt_pixelRatio,
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
    ol.obj.assign(options, layerOptions);
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

    it('renders rotated view correctly with the canvas renderer', function(done) {
      map = createMap('canvas');
      map.getView().setRotation(Math.PI / 4);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/vectortile-canvas-rotated.png',
            13.4, done);
      });
    });

    it('renders correctly with the canvas renderer (HiDPI)', function(done) {
      map = createMap('canvas', 2);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/vectortile-canvas-hidpi.png',
            11.3, done);
      });
    });

    it('renders rotated view correctly with the canvas renderer (HiDPI)', function(done) {
      map = createMap('canvas', 2);
      map.getView().setRotation(Math.PI / 4);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/vectortile-canvas-rotated-hidpi.png',
            14.8, done);
      });
    });

  });

});
