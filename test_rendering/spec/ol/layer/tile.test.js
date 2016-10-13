goog.provide('ol.test.rendering.layer.Tile');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.extent');
goog.require('ol.geom.Point');
goog.require('ol.layer.Tile');
goog.require('ol.obj');
goog.require('ol.proj');
goog.require('ol.source.TileImage');
goog.require('ol.source.XYZ');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.tilegrid.TileGrid');


describe('ol.rendering.layer.Tile', function() {

  var target, map;

  function createMap(renderer, opt_center, opt_size, opt_pixelRatio) {
    var size = opt_size !== undefined ? opt_size : [50, 50];
    target = createMapDiv(size[0], size[1]);

    map = new ol.Map({
      pixelRatio: opt_pixelRatio || 1,
      target: target,
      renderer: renderer,
      view: new ol.View({
        center: opt_center !== undefined ? opt_center : ol.proj.transform(
            [-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857'),
        zoom: 5
      })
    });
    return map;
  }

  function waitForTiles(sources, layerOptions, onTileLoaded) {
    var tilesLoading = 0;
    var tileLoaded = 0;

    var update = function() {
      if (tilesLoading === tileLoaded) {
        onTileLoaded();
      }
    };

    sources.forEach(function(source, i) {
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
      ol.obj.assign(options, layerOptions[i] || layerOptions);
      map.addLayer(new ol.layer.Tile(options));
    });
  }

  describe('single tile layer', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.XYZ({
        url: 'spec/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      waitForTiles([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/osm-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      waitForTiles([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/osm-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('two tile layers', function() {
    var source1, source2;

    beforeEach(function() {
      source1 = new ol.source.XYZ({
        url: 'spec/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
      source2 = new ol.source.XYZ({
        url: 'spec/ol/data/tiles/stamen-labels/{z}/{x}/{y}.png'
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      waitForTiles([source1, source2], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/2-layers-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      waitForTiles([source1, source2], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/2-layers-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });

    function centerExtent(map) {
      var c = map.getView().calculateExtent(map.getSize());
      var qw = ol.extent.getSize(c)[0] / 4;
      var qh = ol.extent.getSize(c)[1] / 4;
      return [c[0] + qw, c[1] + qh, c[2] - qw, c[3] - qh];
    }

    it('tests canvas layer extent clipping', function(done) {
      map = createMap('canvas');
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'spec/ol/layer/expected/2-layers-canvas-extent.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests canvas layer extent clipping with rotation', function(done) {
      map = createMap('canvas');
      map.getView().setRotation(Math.PI / 2);
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'spec/ol/layer/expected/2-layers-canvas-extent-rotate.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests canvas layer extent clipping (HiDPI)', function(done) {
      map = createMap('canvas', undefined, undefined, 2);
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'spec/ol/layer/expected/2-layers-canvas-extent-hidpi.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests canvas layer extent clipping with rotation (HiDPI)', function(done) {
      map = createMap('canvas', undefined, undefined, 2);
      map.getView().setRotation(Math.PI / 2);
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'spec/ol/layer/expected/2-layers-canvas-extent-rotate-hidpi.png',
            IMAGE_TOLERANCE, done);
      });
    });

  });

  describe('tile layer with opacity', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.XYZ({
        url: 'spec/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      waitForTiles([source], {opacity: 0.2}, function() {
        expectResemble(map, 'spec/ol/layer/expected/opacity-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      waitForTiles([source], {opacity: 0.2}, function() {
        expectResemble(map, 'spec/ol/layer/expected/opacity-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('tile layer with non-square tiles', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.TileImage({
        tileUrlFunction: function(tileCoord, ratio, projection) {
          return 'spec/ol/data/tiles/512x256/' + tileCoord[0] + '/' +
              tileCoord[1] + '/' + tileCoord[2] + '.png';
        },
        tileGrid: new ol.tilegrid.TileGrid({
          origin: [-20037508.342789244, -20037508.342789244],
          resolutions: [
            156543.03392804097, 78271.51696402048, 39135.75848201024,
            19567.87924100512, 9783.93962050256, 4891.96981025128
          ],
          tileSize: [512, 256]
        })
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('renders correcly using the canvas renderer', function(done) {
      map = createMap('canvas', [-10997148, 4569099]);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/512x256-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('renders correcly using the webgl renderer', function(done) {
      assertWebGL();
      map = createMap('webgl', [-10997148, 4569099]);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/512x256-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });

  });

  describe('tile layer with render listener', function() {
    var source, onAddLayer;

    beforeEach(function() {
      source = new ol.source.XYZ({
        url: 'spec/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
      onAddLayer = function(evt) {
        evt.element.on('render', function(e) {
          e.vectorContext.setImageStyle(new ol.style.Circle({
            radius: 5,
            snapToPixel: false,
            fill: new ol.style.Fill({color: 'yellow'}),
            stroke: new ol.style.Stroke({color: 'red', width: 1})
          }));
          e.vectorContext.drawPoint(new ol.geom.Point(
              ol.proj.transform([-123, 38], 'EPSG:4326', 'EPSG:3857')));
        });
      };
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('works with the canvas renderer', function(done) {
      map = createMap('canvas', undefined, [100, 100]);
      map.getLayers().on('add', onAddLayer);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/render-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });
});
