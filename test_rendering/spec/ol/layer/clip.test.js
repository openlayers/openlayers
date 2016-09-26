goog.provide('layer clipping');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.layer.Tile');
goog.require('ol.source.XYZ');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');


describe('layer clipping', function() {

  function onLoad(source, callback) {
    var loading = 0;
    var loaded = 0;
    var called = false;

    function check() {
      if (!called && loading > 0 && loaded === loading) {
        callback();
      }
    }

    source.on('tileloadstart', function() {
      ++loading;
    });
    source.on('tileloadend', function() {
      ++loaded;
      setTimeout(check, 10);
    });
    source.on('tileloaderror', function() {
      callback(new Error('Tile loading failed'));
      called = true;
    });
  }


  describe('MultiPolygon clipping', function() {

    var map = null;
    beforeEach(function() {
      map = new ol.Map({
        target: createMapDiv(256, 256),
        view: new ol.View({
          center: [0, 0],
          zoom: 0
        })
      });
    });

    afterEach(function() {
      disposeMap(map);
      map = null;
    });

    it('clips to all parts of the MultiPolygon', function(done) {

      var source = new ol.source.XYZ({
        url: 'spec/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });

      var layer = new ol.layer.Tile({
        source: source
      });

      var geometry = new ol.geom.MultiPolygon([
        [[[-80, -40], [-40, 0], [-80, 40], [-120, 0], [-80, -40]]],
        [[[80, -40], [120, 0], [80, 40], [40, 0], [80, -40]]]
      ]).transform('EPSG:4326', 'EPSG:3857');

      var style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          width: 2,
          color: 'blue'
        })
      });

      layer.on('precompose', function(event) {
        var context = event.context;
        context.save();

        var vectorContext = event.vectorContext;
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(geometry);

        context.clip();
      });

      layer.on('postcompose', function(event) {
        var context = event.context;
        context.restore();

        var vectorContext = event.vectorContext;
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(geometry);
      });

      onLoad(source, function(err) {
        if (err) {
          return done(err);
        }
        expectResemble(map, 'spec/ol/layer/expected/multipolygon-clip.png', IMAGE_TOLERANCE, done);
      });

      map.addLayer(layer);

    });
  });
});
