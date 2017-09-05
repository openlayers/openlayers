

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_format_MVT_ from '../../../../src/ol/format/mvt';
import _ol_layer_VectorTile_ from '../../../../src/ol/layer/vectortile';
import _ol_obj_ from '../../../../src/ol/obj';
import _ol_source_VectorTile_ from '../../../../src/ol/source/vectortile';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';


describe('ol.rendering.layer.VectorTile', function() {

  var map;

  function createMap(renderer, opt_pixelRatio) {
    map = new _ol_Map_({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      view: new _ol_View_({
        center: [1825927.7316762917, 6143091.089223046],
        zoom: 14
      })
    });
  }

  afterEach(function() {
    disposeMap(map);
    map = null;
  });

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
    _ol_obj_.assign(options, layerOptions);
    map.addLayer(new _ol_layer_VectorTile_(options));
  }

  describe('vector tile layer', function() {
    var source;

    beforeEach(function() {
      source = new _ol_source_VectorTile_({
        format: new _ol_format_MVT_(),
        tileGrid: _ol_tilegrid_.createXYZ(),
        tilePixelRatio: 16,
        url: 'rendering/ol/data/tiles/mvt/{z}-{x}-{y}.vector.pbf'
      });
    });

    it('renders correctly with the canvas renderer', function(done) {
      createMap('canvas');
      waitForTiles(source, {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/vectortile-canvas.png',
            22, done);
      });
    });

    it('renders rotated view correctly with the canvas renderer', function(done) {
      createMap('canvas');
      map.getView().setRotation(Math.PI / 4);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/vectortile-canvas-rotated.png',
            14, done);
      });
    });

    it('renders correctly with the canvas renderer (HiDPI)', function(done) {
      createMap('canvas', 2);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/vectortile-canvas-hidpi.png',
            11.3, done);
      });
    });

    it('renders rotated view correctly with the canvas renderer (HiDPI)', function(done) {
      createMap('canvas', 2);
      map.getView().setRotation(Math.PI / 4);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/vectortile-canvas-rotated-hidpi.png',
            14.8, done);
      });
    });

  });

});
