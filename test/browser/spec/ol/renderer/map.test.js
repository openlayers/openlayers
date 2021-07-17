import Disposable from '../../../../../src/ol/Disposable.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import MapRenderer from '../../../../../src/ol/renderer/Map.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import View from '../../../../../src/ol/View.js';
import {Circle, Fill, Stroke, Style} from '../../../../../src/ol/style.js';
import {
  GeometryCollection,
  LineString,
  MultiPoint,
  Point,
} from '../../../../../src/ol/geom.js';
import {Projection} from '../../../../../src/ol/proj.js';
import {fromExtent} from '../../../../../src/ol/geom/Polygon.js';

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

  describe('#forEachFeatureAtPixel', function () {
    let map;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      });
    });

    afterEach(function () {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('calls callback with feature, layer and geometry', function () {
      let hit;
      const point = new Point([0, 0]);
      const polygon = fromExtent([0, -1e6, 1e6, 1e6]);
      const geometryCollection = new Feature(
        new GeometryCollection([polygon, point])
      );
      const multiPoint = new MultiPoint([
        [-1e6, -1e6],
        [-1e6, 1e6],
      ]);
      const multiGeometry = new Feature(multiPoint);
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [geometryCollection, multiGeometry],
        }),
      });
      map.addLayer(layer);
      map.renderSync();
      hit = map.forEachFeatureAtPixel([50, 50], (feature, layer, geometry) => ({
        feature,
        layer,
        geometry,
      }));
      expect(hit.feature).to.be(geometryCollection);
      expect(hit.layer).to.be(layer);
      expect(hit.geometry).to.be(point);
      hit = map.forEachFeatureAtPixel([75, 50], (feature, layer, geometry) => ({
        feature,
        layer,
        geometry,
      }));
      expect(hit.feature).to.be(geometryCollection);
      expect(hit.geometry).to.be(polygon);
      hit = map.forEachFeatureAtPixel([25, 25], (feature, layer, geometry) => ({
        feature,
        layer,
        geometry,
      }));
      expect(hit.feature).to.be(multiGeometry);
      expect(hit.geometry).to.be(multiPoint);
    });

    it('hits lines even if they are dashed', function () {
      const geometry = new LineString([
        [-1e6, 0],
        [1e6, 0],
      ]);
      const feature = new Feature(geometry);
      const layer = new VectorLayer({
        source: new VectorSource({
          features: [feature],
        }),
        style: new Style({
          stroke: new Stroke({
            color: 'black',
            width: 8,
            lineDash: [10, 20],
          }),
        }),
      });
      map.addLayer(layer);
      map.renderSync();
      const hit = map.forEachFeatureAtPixel(
        [50, 50],
        (feature, layer, geometry) => ({
          feature,
          layer,
          geometry,
        })
      );

      expect(hit).to.be.ok();
      expect(hit.feature).to.be(feature);
      expect(hit.layer).to.be(layer);
      expect(hit.geometry).to.be(geometry);
    });

    it('prioritizes closer features when no direct hit is found', function () {
      map.getView().setResolution(1);
      map.addLayer(
        new VectorLayer({
          style: new Style({
            image: new Circle({
              radius: 4,
              fill: new Fill({
                color: 'black',
              }),
            }),
          }),
          source: new VectorSource({
            features: [
              [0, -10],
              [0, 0],
              [0, 10],
              [10, 0],
            ].map((coordinate) => new Feature(new Point(coordinate))),
          }),
        })
      );
      map.renderSync();

      let feature = map.forEachFeatureAtPixel(
        map.getPixelFromCoordinate([8, 6]),
        (feature) => feature,
        {hitTolerance: 20}
      );
      expect(feature.getGeometry().getCoordinates()).to.eql([10, 0]);

      feature = map.forEachFeatureAtPixel(
        map.getPixelFromCoordinate([6, -8]),
        (feature) => feature,
        {hitTolerance: 20}
      );
      expect(feature.getGeometry().getCoordinates()).to.eql([0, -10]);

      feature = map.forEachFeatureAtPixel(
        map.getPixelFromCoordinate([-6, -4]),
        (feature) => feature,
        {hitTolerance: 20}
      );
      expect(feature.getGeometry().getCoordinates()).to.eql([0, 0]);

      feature = map.forEachFeatureAtPixel(
        map.getPixelFromCoordinate([-6, 7]),
        (feature) => feature,
        {hitTolerance: 20}
      );
      expect(feature.getGeometry().getCoordinates()).to.eql([0, 10]);
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
