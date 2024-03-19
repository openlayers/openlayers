import Map from '../../../../../../src/ol/Map.js';
import TileLayer from '../../../../../../src/ol/layer/Tile.js';
import View from '../../../../../../src/ol/View.js';
import XYZ from '../../../../../../src/ol/source/XYZ.js';
import {fromLonLat} from '../../../../../../src/ol/proj.js';

describe('ol/renderer/canvas/TileLayer', function () {
  describe('#renderFrame', function () {
    let map, layer;
    beforeEach(function () {
      layer = new TileLayer({
        source: new XYZ({
          cacheSize: 1,
          url: 'bogus-url/{z}/{x}/{y}.png',
        }),
      });
      map = new Map({
        target: createMapDiv(100, 100),
        layers: [layer],
        view: new View({
          center: fromLonLat([-122.416667, 37.783333]),
          zoom: 5,
        }),
      });
    });
    afterEach(function () {
      disposeMap(map);
    });

    it("respects the source's zDirection setting", function (done) {
      layer.getSource().zDirection = 1;
      map.getView().setZoom(5.8); // would lead to z6 tile request with the default zDirection
      map.once('rendercomplete', function () {
        const tileCache = layer.getSource().tileCache;
        const keys = tileCache.getKeys();
        expect(keys.some((key) => key.startsWith('6/'))).to.be(false);
        done();
      });
    });

    it('image smoothing is re-enabled after rendering', function (done) {
      let context;
      layer.on('postrender', function (e) {
        context = e.context;
        context.imageSmoothingEnabled = false;
      });
      map.on('postrender', function () {
        expect(context.imageSmoothingEnabled).to.be(true);
        done();
      });
    });
  });
});
