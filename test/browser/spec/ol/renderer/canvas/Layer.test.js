import Feature from '../../../../../../src/ol/Feature.js';
import Map from '../../../../../../src/ol/Map.js';
import View from '../../../../../../src/ol/View.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import TileLayer from '../../../../../../src/ol/layer/Tile.js';
import VectorLayer from '../../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../../src/ol/source/Vector.js';
import XYZ from '../../../../../../src/ol/source/XYZ.js';

describe('ol/renderer/canvas/Layer', function () {
  let map;
  beforeEach(function (done) {
    map = new Map({
      target: createMapDiv(100, 100),
      pixelRatio: 1.7999999999999998,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'spec/ol/data/osm-{z}-{x}-{y}.png',
          }),
        }),
        new VectorLayer({
          source: new VectorSource({
            features: [
              new Feature({
                geometry: new Point([0, 0]),
              }),
            ],
          }),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 0,
        rotation: 1e-8,
        constrainRotation: false,
      }),
    });
    map.once('rendercomplete', () => done());
  });
  afterEach(function () {
    disposeMap(map);
  });

  it('reuses container', function () {
    expect(map.getTargetElement().querySelectorAll('canvas').length).to.be(1);
  });
});
