goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.format.MVT');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.layer.VectorTile');
goog.require('ol.obj');
goog.require('ol.source.Vector');
goog.require('ol.source.VectorTile');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('ol.tilegrid');


describe('ol.rendering.layer.VectorTile', function() {

  var map;

  function createMap(renderer, opt_pixelRatio, opt_size) {
    var size = opt_size || 50;
    map = new ol.Map({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(size, size),
      renderer: renderer,
      view: new ol.View({
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
    ol.obj.assign(options, layerOptions);
    map.addLayer(new ol.layer.VectorTile(options));
  }

  describe('vector tile layer', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.VectorTile({
        format: new ol.format.MVT(),
        tileGrid: ol.tilegrid.createXYZ(),
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
      var vectorSource = new ol.source.Vector({
        features: [
          new ol.Feature(new ol.geom.Point([1825727.7316762917, 6143091.089223046]))
        ]
      });
      map.addLayer(new ol.layer.Vector({
        zIndex: 1,
        source: vectorSource,
        style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Fill({
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
          return new ol.style.Style({
            image: new ol.style.Circle({
              radius: 7,
              fill: new ol.style.Fill({
                color: 'red'
              })
            }),
            text: new ol.style.Text({
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
