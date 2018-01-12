import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import RasterSource from '../../../../src/ol/source/Raster.js';
import XYZ from '../../../../src/ol/source/XYZ.js';

where('Uint8ClampedArray').describe('ol.rendering.source.Raster', function() {

  function afterRender(source, raster, callback) {
    let loading = 0;

    source.on('tileloadstart', function(event) {
      loading++;
    });
    source.on('tileloadend', function(event) {
      loading--;
      if (loading == 0) {
        raster.once('afteroperations', function() {
          callback();
        });
      }
    });
    source.on('tileloaderror', function(event) {
      callback(new Error('Tile failed to load'));
    });

  }

  let map;
  function createMap(renderer, pixelRatio) {
    map = new Map({
      target: createMapDiv(200, 200),
      pixelRatio: pixelRatio,
      renderer: renderer,
      view: new View({
        center: [0, 0],
        zoom: 0
      })
    });
  }

  afterEach(function() {
    if (map) {
      disposeMap(map);
    }
    map = null;
  });

  describe('raster source rendering', function() {
    it('renders the result of an operation', function(done) {
      createMap('canvas', 1);

      const source = new XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });

      const raster = new RasterSource({
        sources: [source],
        operation: function(pixels) {
          const pixel = pixels[0];
          // swap blue and red
          const red = pixel[0];
          pixel[0] = pixel[2];
          pixel[2] = red;
          return pixel;
        }
      });

      afterRender(source, raster, function(err) {
        if (err) {
          done(err);
          return;
        }
        expectResemble(map, 'rendering/ol/source/expected/raster-1.png', IMAGE_TOLERANCE, done);
      });

      const layer = new ImageLayer({source: raster});

      map.addLayer(layer);
    });
  });

});
