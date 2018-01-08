import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MVT from '../../../../src/ol/format/MVT.js';
import Point from '../../../../src/ol/geom/Point.js';
import _ol_layer_Vector_ from '../../../../src/ol/layer/Vector.js';
import _ol_layer_VectorTile_ from '../../../../src/ol/layer/VectorTile.js';
import _ol_obj_ from '../../../../src/ol/obj.js';
import _ol_source_Vector_ from '../../../../src/ol/source/Vector.js';
import _ol_source_VectorTile_ from '../../../../src/ol/source/VectorTile.js';
import _ol_style_Circle_ from '../../../../src/ol/style/Circle.js';
import _ol_style_Fill_ from '../../../../src/ol/style/Fill.js';
import _ol_style_Style_ from '../../../../src/ol/style/Style.js';
import _ol_style_Text_ from '../../../../src/ol/style/Text.js';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid.js';


describe('ol.rendering.layer.VectorTile', function() {

  var map;

  function createMap(renderer, opt_pixelRatio, opt_size) {
    var size = opt_size || 50;
    map = new Map({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(size, size),
      renderer: renderer,
      view: new View({
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
        format: new MVT(),
        tileGrid: _ol_tilegrid_.createXYZ(),
        url: 'rendering/ol/data/tiles/mvt/{z}-{x}-{y}.vector.pbf',
        transition: 0
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

    it('renders rotated view correctly with vector layer on top', function(done) {
      createMap('canvas');
      var vectorSource = new _ol_source_Vector_({
        features: [
          new Feature(new Point([1825727.7316762917, 6143091.089223046]))
        ]
      });
      map.addLayer(new _ol_layer_Vector_({
        zIndex: 1,
        source: vectorSource,
        style: new _ol_style_Style_({
          image: new _ol_style_Circle_({
            radius: 10,
            fill: new _ol_style_Fill_({
              color: 'red'
            })
          })
        })
      }));
      map.getView().setRotation(Math.PI / 4);
      waitForTiles(source, {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/vectortile-vector-rotated.png',
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

    it('declutters text and images', function(done) {
      createMap('canvas', 1, 100);
      map.getView().setZoom(13.8);
      var style = function(feature, resolution) {
        var geom = feature.getGeometry();
        if (geom.getType() == 'Point') {
          return new _ol_style_Style_({
            image: new _ol_style_Circle_({
              radius: 7,
              fill: new _ol_style_Fill_({
                color: 'red'
              })
            }),
            text: new _ol_style_Text_({
              text: feature.get('name_en'),
              font: '12px sans-serif',
              textBaseline: 'bottom',
              offsetY: -7
            })
          });
        }
      };
      waitForTiles(source, {declutter: true, style: style}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/vectortile-canvas-declutter.png',
            8.5, done);
      });
    });

  });

});
