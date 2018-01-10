import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import _ol_style_Stroke_ from '../../../../src/ol/style/Stroke.js';
import _ol_style_Style_ from '../../../../src/ol/style/Style.js';


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
      map = new Map({
        pixelRatio: 1,
        target: createMapDiv(256, 256),
        view: new View({
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

      var source = new XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });

      var layer = new TileLayer({
        source: source
      });

      var geometry = new MultiPolygon([
        [[[-80, -40], [-40, 0], [-80, 40], [-120, 0], [-80, -40]]],
        [[[80, -40], [120, 0], [80, 40], [40, 0], [80, -40]]]
      ]).transform('EPSG:4326', 'EPSG:3857');

      var style = new _ol_style_Style_({
        stroke: new _ol_style_Stroke_({
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
        expectResemble(map, 'rendering/ol/layer/expected/multipolygon-clip.png', IMAGE_TOLERANCE, done);
      });

      map.addLayer(layer);

    });
  });
});
