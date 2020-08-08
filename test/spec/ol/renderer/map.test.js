import Disposable from '../../../../src/ol/Disposable.js';
import Feature from '../../../../src/ol/Feature.js';
import Map from '../../../../src/ol/Map.js';
import MapRenderer from '../../../../src/ol/renderer/Map.js';
import VectorLayer from '../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';
import {Circle, Fill, Style} from '../../../../src/ol/style.js';
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
    let map, source, style;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      const projection = new Projection({
        code: 'EPSG:21781',
        units: 'm',
      });
      source = new VectorSource({
        projection: projection,
        features: [new Feature(new Point([660000, 190000]))],
      });
      style = new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: 'fuchsia',
          }),
        }),
      });
      map = new Map({
        target: target,
        layers: [
          new VectorLayer({
            source: source,
            renderBuffer: 12,
            style: style,
          }),
        ],
        view: new View({
          projection: projection,
          center: [660000, 190000],
          zoom: 9,
        }),
      });
    });

    afterEach(function () {
      const target = map.getTargetElement();
      map.setTarget(null);
      document.body.removeChild(target);
    });

    it('works with custom projection', function () {
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features.length).to.be(1);
    });

    it('works with negative image scale', function () {
      style.getImage().setScale([-1, -1]);
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features.length).to.be(1);
    });

    it('only draws features that intersect the hit detection viewport', function () {
      const resolution = map.getView().getResolution();
      source.addFeature(
        new Feature(new Point([660000 + resolution * 6, 190000]))
      );
      source.addFeature(
        new Feature(new Point([660000 - resolution * 12, 190000]))
      );
      map.renderSync();
      const spy = sinon.spy(CanvasRenderingContext2D.prototype, 'drawImage');
      const features = map.getFeaturesAtPixel([50, 44]);
      expect(features.length).to.be(1);
      expect(spy.callCount).to.be(2);
      spy.restore();
    });
  });
});
