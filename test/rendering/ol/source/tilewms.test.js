

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Tile');
goog.require('ol.source.TileWMS');

describe('ol.rendering.source.TileWMS', function() {

  function tilesLoaded(source, callback) {
    var loading = 0;

    source.on('tileloadstart', function(event) {
      loading++;
    });
    source.on('tileloadend', function(event) {
      loading--;
      if (loading == 0) {
        callback();
      }
    });
    source.on('tileloaderror', function(event) {
      expect().fail('Tile failed to load');
    });

  }

  var map;
  function createMap(renderer, pixelRatio) {
    map = new ol.Map({
      target: createMapDiv(200, 200),
      pixelRatio: pixelRatio,
      renderer: renderer,
      view: new ol.View({
        center: [0, 0],
        zoom: 5
      })
    });
  }

  afterEach(function() {
    if (map) {
      disposeMap(map);
    }
    map = null;
  });

  function createSource(gutter) {
    return new ol.source.TileWMS({
      params: {
        'LAYERS': 'layer'
      },
      gutter: gutter,
      url: 'rendering/ol/data/tiles/wms/wms' + gutter + '.png',
      transition: 0
    });
  }


  describe('0px gutter, 1 pixel ratio', function() {
    it('tests the canvas renderer', function(done) {
      createMap('canvas', 1);
      var source = createSource(0);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/0_1.canvas.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl', 1);
      var source = createSource(0);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/0_1.webgl.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });
  });

  describe('0px gutter, 2 pixel ratio', function() {
    it('tests the canvas renderer', function(done) {
      createMap('canvas', 2);
      var source = createSource(0);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/0_2.canvas.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl', 2);
      var source = createSource(0);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/0_2.webgl.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });
  });


  describe('20px gutter, 1 pixel ratio', function() {
    it('tests the canvas renderer', function(done) {
      createMap('canvas', 1);
      var source = createSource(20);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/20_1.canvas.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl', 1);
      var source = createSource(20);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/20_1.webgl.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });
  });

  describe('20px gutter, 2 pixel ratio', function() {
    it('tests the canvas renderer', function(done) {
      createMap('canvas', 2);
      var source = createSource(20);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/20_2.canvas.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl', 2);
      var source = createSource(20);
      tilesLoaded(source, function() {
        expectResemble(map, 'rendering/ol/source/expected/20_2.webgl.png', IMAGE_TOLERANCE, done);
      });
      map.addLayer(new ol.layer.Tile({
        source: source
      }));
    });
  });

});
