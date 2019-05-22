import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import Point from '../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import {assign} from '../../../../src/ol/obj.js';
import {transform} from '../../../../src/ol/proj.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import CircleStyle from '../../../../src/ol/style/Circle.js';
import Fill from '../../../../src/ol/style/Fill.js';
import Stroke from '../../../../src/ol/style/Stroke.js';

describe('ol.rendering.layer.Tile', function() {

  let map;

  function createMap(renderer, opt_center, opt_size, opt_pixelRatio, opt_resolutions) {
    const MapConstructor = Map;
    const size = opt_size !== undefined ? opt_size : [50, 50];

    map = new MapConstructor({
      pixelRatio: opt_pixelRatio || 1,
      target: createMapDiv(size[0], size[1]),
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

  function waitForTiles(renderer, sources, layerOptions, onTileLoaded) {
    const LayerConstructor = TileLayer;
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
      map.addLayer(new LayerConstructor(options));
    });
  }

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
      waitForTiles('canvas', [source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/render-canvas.png',
          IMAGE_TOLERANCE, done);
      });
    });
  });
});
