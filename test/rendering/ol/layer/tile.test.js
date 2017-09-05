

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_extent_ from '../../../../src/ol/extent';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_layer_Tile_ from '../../../../src/ol/layer/tile';
import _ol_obj_ from '../../../../src/ol/obj';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_source_TileImage_ from '../../../../src/ol/source/tileimage';
import _ol_source_XYZ_ from '../../../../src/ol/source/xyz';
import _ol_style_Circle_ from '../../../../src/ol/style/circle';
import _ol_style_Fill_ from '../../../../src/ol/style/fill';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';


describe('ol.rendering.layer.Tile', function() {

  var map;

  function createMap(renderer, opt_center, opt_size, opt_pixelRatio, opt_resolutions) {
    var size = opt_size !== undefined ? opt_size : [50, 50];

    map = new _ol_Map_({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(size[0], size[1]),
      renderer: renderer,
      view: new _ol_View_({
        center: opt_center !== undefined ? opt_center : _ol_proj_.transform(
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
      _ol_obj_.assign(options, layerOptions[i] || layerOptions);
      map.addLayer(new _ol_layer_Tile_(options));
    });
  }

  describe('single tile layer', function() {
    var source;

    beforeEach(function() {
      source = new _ol_source_XYZ_({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
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
      source1 = new _ol_source_XYZ_({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
      source2 = new _ol_source_XYZ_({
        url: 'rendering/ol/data/tiles/stamen-labels/{z}/{x}/{y}.png'
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
      var qw = _ol_extent_.getSize(c)[0] / 4;
      var qh = _ol_extent_.getSize(c)[1] / 4;
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
      source = new _ol_source_XYZ_({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
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
      return new _ol_source_TileImage_({
        url: 'rendering/ol/data/tiles/' + tileSize + '/{z}/{x}/{y}.png',
        tileGrid: _ol_tilegrid_.createXYZ({
          tileSize: tileSize.split('x')
        })
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
      source = new _ol_source_XYZ_({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });
      onAddLayer = function(evt) {
        evt.element.on('render', function(e) {
          e.vectorContext.setImageStyle(new _ol_style_Circle_({
            radius: 5,
            snapToPixel: false,
            fill: new _ol_style_Fill_({color: 'yellow'}),
            stroke: new _ol_style_Stroke_({color: 'red', width: 1})
          }));
          e.vectorContext.drawPoint(new _ol_geom_Point_(
              _ol_proj_.transform([-123, 38], 'EPSG:4326', 'EPSG:3857')));
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
