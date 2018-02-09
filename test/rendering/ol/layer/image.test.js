import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import ImageLayer from '../../../../src/ol/layer/Image.js';
import {assign} from '../../../../src/ol/obj.js';
import {get as getProjection, transform, transformExtent} from '../../../../src/ol/proj.js';
import Static from '../../../../src/ol/source/ImageStatic.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';


describe('ol.rendering.layer.Image', function() {

  let map;

  function createMap(renderer) {
    map = new Map({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      view: new View({
        center: transform(
          [-122.416667, 37.783333], 'EPSG:4326', 'EPSG:3857'),
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

  function waitForImages(sources, layerOptions, onImagesLoaded) {
    let imagesLoading = 0;
    let imagesLoaded = 0;

    const update = function() {
      if (imagesLoading === imagesLoaded) {
        onImagesLoaded();
      }
    };

    sources.forEach(function(source) {
      source.on('imageloadstart', function(event) {
        imagesLoading++;
      });
      source.on('imageloadend', function(event) {
        imagesLoaded++;
        update();
      });
      source.on('imageloaderror', function(event) {
        expect().fail('Image failed to load');
      });

      const options = {
        source: source
      };
      assign(options, layerOptions);
      map.addLayer(new ImageLayer(options));
    });
  }

  describe('single image layer', function() {
    let source;

    beforeEach(function() {
      source = new Static({
        url: 'rendering/ol/data/tiles/osm/5/5/12.png',
        imageExtent: createXYZ().getTileCoordExtent(
          [5, 5, -12 - 1]),
        projection: getProjection('EPSG:3857')
      });
    });

    it('tests the canvas renderer', function(done) {
      createMap('canvas');
      waitForImages([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/image-canvas.png',
          IMAGE_TOLERANCE, done);
      });
    });

    where('WebGL').it('tests the WebGL renderer', function(done) {
      assertWebGL();
      createMap('webgl');
      waitForImages([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/image-webgl.png',
          IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('single image layer - scaled', function() {
    let source;

    beforeEach(function() {
      source = new Static({
        url: 'rendering/ol/data/tiles/osm/5/5/12.png',
        imageExtent: transformExtent(
          [-123, 37, -122, 38], 'EPSG:4326', 'EPSG:3857')
      });
    });

    it('renders correctly', function(done) {
      createMap('canvas');
      waitForImages([source], {}, function() {
        expectResemble(map, 'rendering/ol/layer/expected/image-scaled.png',
          IMAGE_TOLERANCE, done);
      });
    });
  });

});
