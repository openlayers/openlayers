

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_layer_Image_ from '../../../../src/ol/layer/image';
import _ol_obj_ from '../../../../src/ol/obj';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_source_ImageStatic_ from '../../../../src/ol/source/imagestatic';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';


describe('ol.rendering.layer.Image', function() {

  var map;

  function createMap(renderer) {
    map = new _ol_Map_({
      pixelRatio: 1,
      target: createMapDiv(50, 50),
      renderer: renderer,
      view: new _ol_View_({
        center: _ol_proj_.transform(
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
    var imagesLoading = 0;
    var imagesLoaded = 0;

    var update = function() {
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

      var options = {
        source: source
      };
      _ol_obj_.assign(options, layerOptions);
      map.addLayer(new _ol_layer_Image_(options));
    });
  }

  describe('single image layer', function() {
    var source;

    beforeEach(function() {
      source = new _ol_source_ImageStatic_({
        url: 'rendering/ol/data/tiles/osm/5/5/12.png',
        imageExtent: _ol_tilegrid_.createXYZ().getTileCoordExtent(
            [5, 5, -12 - 1]),
        projection: _ol_proj_.get('EPSG:3857')
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
    var source;

    beforeEach(function() {
      source = new _ol_source_ImageStatic_({
        url: 'rendering/ol/data/tiles/osm/5/5/12.png',
        imageExtent: _ol_proj_.transformExtent(
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
