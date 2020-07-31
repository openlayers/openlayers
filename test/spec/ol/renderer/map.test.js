import Disposable from '../../../../src/ol/Disposable.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import MapRenderer from '../../../../src/ol/renderer/Map.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Point} from '../../../../src/ol/geom.js';
import {Projection} from '../../../../src/ol/proj.js';

describe('ol.renderer.Map', function () {
  describe('constructor', function () {
    it('createst an instance', function () {
      const map = new Map({});
      const renderer = new MapRenderer(null, map);
      expect(renderer).to.be.a(MapRenderer);
      expect(renderer).to.be.a(Disposable);
      renderer.dispose();
      map.dispose();
    });
  });

  describe('#forEachFeatureAtCoordinate', function () {
    let map;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      const projection = new Projection({
        code: 'EPSG:21781',
        units: 'm',
      });
      map = new Map({
        target: target,
        layers: [
          new VectorLayer({
            source: new VectorSource({
              projection: projection,
              features: [new Feature(new Point([660000, 190000]))],
            }),
          }),
        ],
        view: new View({
          projection: projection,
          center: [660000, 190000],
          zoom: 9,
        }),
      });
      map.renderSync();
    });

    afterEach(function () {
      const target = map.getTargetElement();
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('works with custom projection', function () {
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features.length).to.be(1);
    });
  });
});
