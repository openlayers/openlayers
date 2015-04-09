goog.provide('ol.test.rendering.layer.Tile');

describe('ol.rendering.layer.Tile', function() {

  var target, map;

  function createMap(renderer) {
    target = createMapDiv(50, 50);

    map = new ol.Map({
      target: target,
      renderer: renderer,
      view: new ol.View({
        center: ol.proj.transform(
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

    goog.array.forEach(sources, function(source) {
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
});

goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.proj');
goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');
