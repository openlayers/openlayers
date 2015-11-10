goog.provide('ol.test.rendering.layer.Tile');

describe('ol.rendering.layer.Tile', function() {

  var target, map;

  function createMap(renderer, opt_center) {
    target = createMapDiv(50, 50);

    map = new ol.Map({
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

    sources.forEach(function(source) {
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
      goog.object.extend(options, layerOptions);
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

});

goog.require('goog.object');
goog.require('ol.proj');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileImage');
goog.require('ol.source.XYZ');
goog.require('ol.tilegrid.TileGrid');
