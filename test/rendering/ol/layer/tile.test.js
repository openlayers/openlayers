

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
goog.require('ol.tilegrid');


describe('ol.rendering.layer.Tile', function() {

  var map;

  function createMap(renderer, opt_center, opt_size, opt_pixelRatio, opt_resolutions) {
    var size = opt_size !== undefined ? opt_size : [50, 50];

    map = new ol.Map({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(size[0], size[1]),
      renderer: renderer,
      view: new ol.View({
        center: opt_center !== undefined ? opt_center : ol.proj.transform(
            [-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857'),
        resolutions: opt_resolutions,
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

  describe('with tile transition', function() {
    it('renders correctly after the transition', function(done) {
      createMap('canvas');
      var source = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
      waitForTiles([source], {}, function() {
        setTimeout(function() {
          expectResemble(map, 'rendering/ol/layer/expected/osm-canvas.png',
              IMAGE_TOLERANCE, done);
        }, 500);
      });
    });
  });

  describe('single tile layer', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });
    });

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/osm-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/osm-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('two tile layers', function() {
    var source1, source2;

    beforeEach(function() {
      source1 = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });
      source2 = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/stamen-labels/{z}/{x}/{y}.png',
        transition: 0
      });
    });

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      waitForTiles([source1, source2], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/2-layers-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      waitForTiles([source1, source2], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/2-layers-webgl.png',
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
      createMap('canvas');
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'rendering/ol/layer/expected/2-layers-canvas-extent.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests canvas layer extent clipping with rotation', function(done) {
      createMap('canvas');
      map.getView().setRotation(Math.PI / 2);
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'rendering/ol/layer/expected/2-layers-canvas-extent-rotate.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests canvas layer extent clipping (HiDPI)', function(done) {
      createMap('canvas', undefined, undefined, 2);
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'rendering/ol/layer/expected/2-layers-canvas-extent-hidpi.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests canvas layer extent clipping with rotation (HiDPI)', function(done) {
      createMap('canvas', undefined, undefined, 2);
      map.getView().setRotation(Math.PI / 2);
      waitForTiles([source1, source2], [{}, {extent: centerExtent(map)}], function() {
        expectResemble(map, 'rendering/ol/layer/expected/2-layers-canvas-extent-rotate-hidpi.png',
            IMAGE_TOLERANCE, done);
      });
    });

  });

  describe('tile layer with opacity', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });
    });

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      waitForTiles([source], {opacity: 0.2}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/opacity-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      waitForTiles([source], {opacity: 0.2}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/opacity-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('tile layer with non-square tiles', function() {

    function createSource(tileSize) {
      return new ol.source.TileImage({
        url: 'rendering/ol/data/tiles/' + tileSize + '/{z}/{x}/{y}.png',
        tileGrid: ol.tilegrid.createXYZ({
          tileSize: tileSize.split('x')
        }),
        transition: 0
      });
    }

    it('512x256 renders correcly using the canvas renderer', function(done) {
      var source = createSource('512x256');
      createMap('canvas', [-10997148, 4569099]);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/512x256-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('512x256 renders correcly using the webgl renderer', function(done) {
      assertWebGL();
      var source = createSource('512x256');
      createMap('webgl', [-10997148, 4569099]);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/512x256-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('192x256 renders correcly using the canvas renderer', function(done) {
      var source = createSource('192x256');
      createMap('canvas', [-11271098, 3747248], [100, 100], undefined,
          source.getTileGrid().getResolutions());
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/192x256-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('192x256 renders correcly using the webgl renderer', function(done) {
      assertWebGL();
      var source = createSource('192x256');
      createMap('webgl', [-11271098, 3747248], [100, 100], undefined,
          source.getTileGrid().getResolutions());
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/192x256-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('tile layer with render listener', function() {
    var source, onAddLayer;

    beforeEach(function() {
      source = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
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

    it('works with the canvas renderer', function(done) {
      createMap('canvas', undefined, [100, 100]);
      map.getLayers().on('add', onAddLayer);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/render-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });
});
