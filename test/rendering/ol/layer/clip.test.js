import Map from '../../../../src/ol/Map.js';
import View from '../../../../src/ol/View.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import XYZ from '../../../../src/ol/source/XYZ.js';
import Stroke from '../../../../src/ol/style/Stroke.js';
import Style from '../../../../src/ol/style/Style.js';


describe('layer clipping', function() {

  function onLoad(source, callback) {
    let loading = 0;
    let loaded = 0;
    let called = false;

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

    let map = null;
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

      const source = new XYZ({
        url: 'rendering/ol/data/tiles/osm/{z}/{x}/{y}.png',
        transition: 0
      });

      const layer = new TileLayer({
        source: source
      });

      const geometry = new MultiPolygon([
        [[[-80, -40], [-40, 0], [-80, 40], [-120, 0], [-80, -40]]],
        [[[80, -40], [120, 0], [80, 40], [40, 0], [80, -40]]]
      ]).transform('EPSG:4326', 'EPSG:3857');

      const style = new Style({
        stroke: new Stroke({
          width: 2,
          color: 'blue'
        })
      });

      layer.on('precompose', function(event) {
        const context = event.context;
        context.save();

        const vectorContext = event.vectorContext;
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(geometry);

        context.clip();
      });

      layer.on('postcompose', function(event) {
        const context = event.context;
        context.restore();

        const vectorContext = event.vectorContext;
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
