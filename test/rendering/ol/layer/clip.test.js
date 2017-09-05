

import _ol_Map_ from '../../../../src/ol/map';
import _ol_View_ from '../../../../src/ol/view';
import _ol_geom_MultiPolygon_ from '../../../../src/ol/geom/multipolygon';
import _ol_layer_Tile_ from '../../../../src/ol/layer/tile';
import _ol_source_XYZ_ from '../../../../src/ol/source/xyz';
import _ol_style_Stroke_ from '../../../../src/ol/style/stroke';
import _ol_style_Style_ from '../../../../src/ol/style/style';


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
      map = new _ol_Map_({
        pixelRatio: 1,
        target: createMapDiv(256, 256),
        view: new _ol_View_({
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

      var source = new _ol_source_XYZ_({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png'
      });

      var layer = new _ol_layer_Tile_({
        source: source
      });

      var geometry = new _ol_geom_MultiPolygon_([
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
