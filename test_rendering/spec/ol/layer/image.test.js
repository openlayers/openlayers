goog.provide('ol.test.rendering.layer.Image');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.obj');
goog.require('ol.proj');
goog.require('ol.source.ImageStatic');
goog.require('ol.tilegrid');


describe('ol.rendering.layer.Image', function() {

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
      ol.obj.assign(options, layerOptions);
      map.addLayer(new ol.layer.Image(options));
    });
  }

  describe('single image layer', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.ImageStatic({
        url: 'spec/ol/data/tiles/osm/5/5/12.png',
        imageExtent: ol.tilegrid.createXYZ().getTileCoordExtent(
            [5, 5, -12 - 1]),
        projection: ol.proj.get('EPSG:3857')
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('tests the canvas renderer', function(done) {
      map = createMap('canvas');
      waitForImages([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/image-canvas.png',
            IMAGE_TOLERANCE, done);
      });
    });

    it('tests the WebGL renderer', function(done) {
      assertWebGL();
      map = createMap('webgl');
      waitForImages([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/image-webgl.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

  describe('single image layer - scaled', function() {
    var source;

    beforeEach(function() {
      source = new ol.source.ImageStatic({
        url: 'spec/ol/data/tiles/osm/5/5/12.png',
        imageExtent: ol.proj.transformExtent(
            [-123, 37, -122, 38], 'EPSG:4326', 'EPSG:3857')
      });
    });

    afterEach(function() {
      disposeMap(map);
    });

    it('renders correctly', function(done) {
      map = createMap('canvas');
      waitForImages([source], {}, function() {
        expectResemble(map, 'spec/ol/layer/expected/image-scaled.png',
            IMAGE_TOLERANCE, done);
      });
    });
  });

});
