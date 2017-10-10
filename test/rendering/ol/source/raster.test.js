goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.layer.Image');
goog.require('ol.source.Raster');
goog.require('ol.source.XYZ');

where('Uint8ClampedArray').describe('ol.rendering.source.Raster', function() {

  function afterRender(source, raster, callback) {
    var loading = 0;

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

  var map;
  function createMap(renderer, pixelRatio) {
    map = new ol.Map({
      target: createMapDiv(200, 200),
      pixelRatio: pixelRatio,
      renderer: renderer,
      view: new ol.View({
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

      var source = new ol.source.XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });

      var raster = new ol.source.Raster({
        sources: [source],
        operation: function(pixels) {
          var pixel = pixels[0];
          // swap blue and red
          var red = pixel[0];
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

      var layer = new ol.layer.Image({source: raster});

      map.addLayer(layer);
    });
  });

});
