import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import {getSize} from '../../../../src/ol/extent.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {assign} from '../../../../src/ol/obj.js';
import {transform} from '../../../../src/ol/proj.js';
import TileImage from '../../../../src/ol/source/TileImage.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';


describe('ol.rendering.layer.Tile', function() {

  let map;

  function createMap(renderer, opt_center, opt_size, opt_pixelRatio, opt_resolutions) {
    const size = opt_size !== undefined ? opt_size : [50, 50];

    map = new Map({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(size[0], size[1]),
      renderer: renderer,
      view: new View({
        center: opt_center !== undefined ? opt_center : transform(
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
    let tilesLoading = 0;
    let tileLoaded = 0;

    const update = function() {
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

      const options = {
        source: source
      };
      assign(options, layerOptions[i] || layerOptions);
      map.addLayer(new TileLayer(options));
    });
  }

  describe('with tile transition', function() {
    it('renders correctly after the transition', function(done) {
      createMap('canvas');
      const source = new XYZ({
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
    let source;

    beforeEach(function() {
      source = new XYZ({
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
    let source1, source2;

    beforeEach(function() {
      source1 = new XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });
      source2 = new XYZ({
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
      const c = map.getView().calculateExtent(map.getSize());
      const qw = getSize(c)[0] / 4;
      const qh = getSize(c)[1] / 4;
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
    let source;

    beforeEach(function() {
      source = new XYZ({
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
      return new TileImage({
        url: 'rendering/ol/data/tiles/' + tileSize + '/{z}/{x}/{y}.png',
        tileGrid: createXYZ({
          tileSize: tileSize.split('x')
        }),
        transition: 0
      });
    }

    it('512x256 renders correcly using the canvas renderer', function(done) {
      const source = createSource('512x256');
      createMap('canvas', [-10997148, 4569099]);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/512x256-canvas.png',
          IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('512x256 renders correcly using the webgl renderer', function(done) {
      assertWebGL();
      const source = createSource('512x256');
      createMap('webgl', [-10997148, 4569099]);
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/512x256-webgl.png',
          IMAGE_TOLERANCE, done);
      });
    });

    it('192x256 renders correcly using the canvas renderer', function(done) {
      const source = createSource('192x256');
      createMap('canvas', [-11271098, 3747248], [100, 100], undefined,
        source.getTileGrid().getResolutions());
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/192x256-canvas.png',
          IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('192x256 renders correcly using the webgl renderer', function(done) {
      assertWebGL();
      const source = createSource('192x256');
      createMap('webgl', [-11271098, 3747248], [100, 100], undefined,
        source.getTileGrid().getResolutions());
      waitForTiles([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/192x256-webgl.png',
          IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('tile layer with render listener', function() {
    let source, onAddLayer;

    beforeEach(function() {
      source = new XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });
      onAddLayer = function(evt) {
        evt.element.on('render', function(e) {
          e.vectorContext.setImageStyle(new CircleStyle({
            radius: 5,
            fill: new Fill({color: 'yellow'}),
            stroke: new Stroke({color: 'red', width: 1})
          }));
          e.vectorContext.drawPoint(new Point(
            transform([-123, 38], 'EPSG:4326', 'EPSG:3857')));
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
