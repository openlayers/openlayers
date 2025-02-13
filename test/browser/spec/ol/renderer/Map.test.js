import {spy as sinonSpy} from 'sinon';
import Disposable from '../../../../../src/ol/Disposable.js';
import Feature from '../../../../../src/ol/Feature.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import CircleGeometry from '../../../../../src/ol/geom/Circle.js';
import GeometryCollection from '../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon, {fromExtent} from '../../../../../src/ol/geom/Polygon.js';
import VectorLayer from '../../../../../src/ol/layer/Vector.js';
import Projection from '../../../../../src/ol/proj/Projection.js';
import MapRenderer from '../../../../../src/ol/renderer/Map.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';
import Circle from '../../../../../src/ol/style/Circle.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Style from '../../../../../src/ol/style/Style.js';

describe('ol/renderer/Map.js', function () {
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

  [1, 2].forEach((pixelRatio) => {
    describe('#forEachFeatureAtPixel', function () {
      let map;
      beforeEach(function () {
        const target = document.createElement('div');
        target.style.width = '100px';
        target.style.height = '100px';
        document.body.appendChild(target);
        map = new Map({
          target: target,
          pixelRatio,
          view: new View({
            center: [0, 0],
            zoom: 2,
          }),
        });
      });

      afterEach(function () {
        disposeMap(map);
      });

      it('calls callback with feature, layer and geometry', function () {
        let hit;
        const point = new Point([0, 0]);
        const polygon = fromExtent([0, -1e6, 1e6, 1e6]);
        const geometryCollection = new Feature(
          new GeometryCollection([polygon, point]),
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
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit.feature).to.be(geometryCollection);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(point);
        hit = map.forEachFeatureAtPixel(
          [75, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit.feature).to.be(geometryCollection);
        expect(hit.geometry).to.be(polygon);
        hit = map.forEachFeatureAtPixel(
          [25, 25],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit.feature).to.be(multiGeometry);
        expect(hit.geometry).to.be(multiPoint);
      });

      it('hits Polygon, Circle geometry, Circle style stroke and transparent fill', function () {
        const target = map.getTargetElement();
        target.style.width = '300px';
        target.style.height = '300px';
        map.updateSize();
        map.setView(
          new View({
            center: [4.5, 7],
            resolution: 0.05,
          }),
        );

        const styles = {
          transparent: new Style({
            stroke: new Stroke({
              color: 'blue',
              width: 3,
            }),
            fill: new Fill({
              color: 'transparent',
            }),
            image: new Circle({
              radius: 30,
              stroke: new Stroke({
                color: 'blue',
                width: 3,
              }),
              fill: new Fill({
                color: 'transparent',
              }),
            }),
          }),
          none: new Style({
            stroke: new Stroke({
              color: 'blue',
              width: 3,
            }),
            image: new Circle({
              radius: 30,
              stroke: new Stroke({
                color: 'blue',
                width: 3,
              }),
            }),
          }),
        };

        const source = new VectorSource({
          features: [
            new Feature({
              geometry: fromExtent([0, 10, 3, 13]),
              fillType: 'none',
            }),
            new Feature({
              geometry: fromExtent([1, 11, 4, 14]),
              fillType: 'none',
            }),
            new Feature({
              geometry: fromExtent([5, 10, 8, 13]),
              fillType: 'transparent',
            }),
            new Feature({
              geometry: fromExtent([6, 11, 9, 14]),
              fillType: 'transparent',
            }),
            new Feature({
              geometry: new CircleGeometry([1.5, 6.5], 1.5),
              fillType: 'none',
            }),
            new Feature({
              geometry: new CircleGeometry([2.5, 7.5], 1.5),
              fillType: 'none',
            }),
            new Feature({
              geometry: new CircleGeometry([6.5, 6.5], 1.5),
              fillType: 'transparent',
            }),
            new Feature({
              geometry: new CircleGeometry([7.5, 7.5], 1.5),
              fillType: 'transparent',
            }),
            new Feature({
              geometry: new Point([1.5, 1.5]),
              fillType: 'none',
            }),
            new Feature({
              geometry: new Point([2.5, 2.5]),
              fillType: 'none',
            }),
            new Feature({
              geometry: new Point([6.5, 1.5]),
              fillType: 'transparent',
            }),
            new Feature({
              geometry: new Point([7.5, 2.5]),
              fillType: 'transparent',
            }),
          ],
        });
        const layer = new VectorLayer({
          source: source,
          style: function (feature, resolution) {
            return styles[feature.get('fillType')];
          },
        });
        map.addLayer(layer);
        map.renderSync();

        function hitTest(coordinate) {
          const features = map.getFeaturesAtPixel(
            map.getPixelFromCoordinate(coordinate),
          );
          const result = {count: 0};
          if (features && features.length > 0) {
            result.count = features.length;
            result.extent = features[0].getGeometry().getExtent();
          }
          return result;
        }
        let res;

        res = hitTest([0, 12]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(0);
        res = hitTest([1, 12]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(1);
        res = hitTest([2, 12]);
        expect(res.count).to.be(0);
        res = hitTest([3, 12]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(0);
        res = hitTest([4, 12]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(1);
        res = hitTest([5, 12]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(5);
        res = hitTest([6, 12]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(6);
        res = hitTest([7, 12]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(6);
        res = hitTest([8, 12]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(6);
        res = hitTest([9, 12]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(6);

        res = hitTest([0, 6.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(0);
        res = hitTest([1, 7.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(1);
        res = hitTest([2, 7.0]);
        expect(res.count).to.be(0);
        res = hitTest([3, 6.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(0);
        res = hitTest([4, 7.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(1);
        res = hitTest([5, 6.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(5);
        res = hitTest([6, 7.5]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(6);
        res = hitTest([7, 7.0]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(6);
        res = hitTest([8, 6.5]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(6);
        res = hitTest([9, 7.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(6);

        res = hitTest([0, 1.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(1.5);
        res = hitTest([1, 2.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(2.5);
        res = hitTest([2, 2.0]);
        expect(res.count).to.be(0);
        res = hitTest([3, 1.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(1.5);
        res = hitTest([4, 2.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(2.5);
        res = hitTest([5, 1.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(6.5);
        res = hitTest([6, 2.5]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(7.5);
        res = hitTest([7, 2.0]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(7.5);
        res = hitTest([8, 1.5]);
        expect(res.count).to.be(2);
        expect(res.extent[0]).to.be(7.5);
        res = hitTest([9, 2.5]);
        expect(res.count).to.be(1);
        expect(res.extent[0]).to.be(7.5);
      });

      it('hits lines even if they are dashed', function () {
        map.getView().setResolution(1);
        let geometry, hit;
        const feature = new Feature();
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

        geometry = new LineString([
          [-20, 0],
          [20, 0],
        ]);
        feature.setGeometry(geometry);
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);

        geometry = new MultiLineString([
          [
            [-20, 0],
            [20, 0],
          ],
        ]);
        feature.setGeometry(geometry);
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);

        geometry = new Polygon([
          [
            [-20, 0],
            [20, 0],
            [20, -20],
            [-20, -20],
            [-20, 0],
          ],
        ]);
        feature.setGeometry(geometry);
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);

        geometry = new MultiPolygon([
          [
            [
              [-20, 0],
              [20, 0],
              [20, -20],
              [-20, -20],
              [-20, 0],
            ],
          ],
        ]);
        feature.setGeometry(geometry);
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);

        geometry = new CircleGeometry([0, -40 / Math.PI], 40 / Math.PI);
        feature.setGeometry(geometry);
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);
      });

      it('hits Text stroke, transparent fill and background fill', function () {
        let hit;
        const geometry = new Point([0, 0]);
        const feature = new Feature(geometry);
        const layer = new VectorLayer({
          source: new VectorSource({
            features: [feature],
          }),
        });
        map.addLayer(layer);

        layer.setStyle({
          'text-value': 'X',
          'text-font': 'bold 100px sans-serif',
          'text-baseline': 'top',
          'text-offset-y': -50,
          'text-stroke-width': 20,
          'text-stroke-color': 'black',
          'text-fill-color': 'none',
        });
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);

        layer.setStyle({
          'text-value': 'X',
          'text-font': 'bold 100px sans-serif',
          'text-baseline': 'top',
          'text-offset-y': -50,
          'text-stroke-width': 1,
          'text-stroke-color': 'black',
          'text-fill-color': 'none',
        });
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be(undefined);

        layer.setStyle({
          'text-value': 'X',
          'text-font': 'bold 100px sans-serif',
          'text-baseline': 'top',
          'text-offset-y': -50,
          'text-stroke-width': 1,
          'text-stroke-color': 'black',
          'text-fill-color': 'transparent',
        });
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);

        layer.setStyle({
          'text-value': 'X',
          'text-font': 'bold 100px sans-serif',
          'text-baseline': 'top',
          'text-offset-y': -50,
          'text-stroke-width': 1,
          'text-stroke-color': 'black',
          'text-fill-color': 'none',
          'text-background-fill-color': 'transparent',
        });
        map.renderSync();
        hit = map.forEachFeatureAtPixel(
          [50, 50],
          (feature, layer, geometry) => ({
            feature,
            layer,
            geometry,
          }),
        );
        expect(hit).to.be.ok();
        expect(hit.feature).to.be(feature);
        expect(hit.layer).to.be(layer);
        expect(hit.geometry).to.be(geometry);
      });

      describe('Line placement text', function () {
        let layer, feature, geometry;
        beforeEach(function () {
          geometry = new LineString([
            [-1e6, 0],
            [1e6, 0],
          ]);
          feature = new Feature(geometry);
          layer = new VectorLayer({
            source: new VectorSource({
              features: [feature],
            }),
          });
          map.addLayer(layer);
        });

        this.afterEach(function () {
          map.removeLayer(layer);
        });

        it('with wide stroke', function (done) {
          layer.setStyle({
            'text-value': 'X',
            'text-font': 'bold 100px sans-serif',
            'text-baseline': 'top',
            'text-offset-y': -50,
            'text-stroke-width': 20,
            'text-stroke-color': 'black',
            'text-fill-color': 'none',
            'text-placement': 'line',
            'text-overflow': true,
          });
          map.once('rendercomplete', () => {
            try {
              const hit = map.forEachFeatureAtPixel(
                [50, 50],
                (feature, layer, geometry) => ({
                  feature,
                  layer,
                  geometry,
                }),
              );
              expect(hit).to.be.ok();
              expect(hit.feature).to.be(feature);
              expect(hit.layer).to.be(layer);
              expect(hit.geometry).to.be(geometry);
              done();
            } catch (e) {
              done(e);
            }
          });
        });

        it('with no fill', function (done) {
          layer.setStyle({
            'text-value': 'X',
            'text-font': 'bold 100px sans-serif',
            'text-baseline': 'top',
            'text-offset-y': -50,
            'text-stroke-width': 1,
            'text-stroke-color': 'black',
            'text-fill-color': 'none',
            'text-placement': 'line',
            'text-overflow': true,
          });
          map.once('rendercomplete', () => {
            try {
              const hit = map.forEachFeatureAtPixel(
                [50, 50],
                (feature, layer, geometry) => ({
                  feature,
                  layer,
                  geometry,
                }),
              );
              expect(hit).to.be(undefined);
              done();
            } catch (e) {
              done(e);
            }
          });
        });

        it('with transparent fill', function (done) {
          layer.setStyle({
            'text-value': 'X',
            'text-font': 'bold 100px sans-serif',
            'text-baseline': 'top',
            'text-offset-y': -50,
            'text-stroke-width': 1,
            'text-stroke-color': 'black',
            'text-fill-color': 'transparent',
            'text-placement': 'line',
            'text-overflow': true,
          });
          map.once('rendercomplete', () => {
            try {
              const hit = map.forEachFeatureAtPixel(
                [50, 50],
                (feature, layer, geometry) => ({
                  feature,
                  layer,
                  geometry,
                }),
              );
              expect(hit).to.be.ok();
              expect(hit.feature).to.be(feature);
              expect(hit.layer).to.be(layer);
              expect(hit.geometry).to.be(geometry);
              done();
            } catch (e) {
              done(e);
            }
          });
        });

        it('with transparent fill', function (done) {
          layer.setStyle({
            'text-value': 'X',
            'text-font': 'bold 100px sans-serif',
            'text-baseline': 'top',
            'text-offset-y': -50,
            'text-stroke-width': 1,
            'text-stroke-color': 'black',
            'text-fill-color': 'transparent',
            'text-placement': 'line',
            'text-overflow': true,
          });
          map.once('rendercomplete', () => {
            try {
              const hit = map.forEachFeatureAtPixel(
                [50, 50],
                (feature, layer, geometry) => ({
                  feature,
                  layer,
                  geometry,
                }),
              );
              expect(hit).to.be.ok();
              expect(hit.feature).to.be(feature);
              expect(hit.layer).to.be(layer);
              expect(hit.geometry).to.be(geometry);
              done();
            } catch (e) {
              done(e);
            }
          });
        });
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
          }),
        );
        map.renderSync();

        let feature = map.forEachFeatureAtPixel(
          map.getPixelFromCoordinate([8, 6]),
          (feature) => feature,
          {hitTolerance: 20},
        );
        expect(feature.getGeometry().getCoordinates()).to.eql([10, 0]);

        feature = map.forEachFeatureAtPixel(
          map.getPixelFromCoordinate([6, -8]),
          (feature) => feature,
          {hitTolerance: 20},
        );
        expect(feature.getGeometry().getCoordinates()).to.eql([0, -10]);

        feature = map.forEachFeatureAtPixel(
          map.getPixelFromCoordinate([-6, -4]),
          (feature) => feature,
          {hitTolerance: 20},
        );
        expect(feature.getGeometry().getCoordinates()).to.eql([0, 0]);

        feature = map.forEachFeatureAtPixel(
          map.getPixelFromCoordinate([-6, 7]),
          (feature) => feature,
          {hitTolerance: 20},
        );
        expect(feature.getGeometry().getCoordinates()).to.eql([0, 10]);
      });
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
      disposeMap(map);
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

    it('works with zero opacity image', function () {
      style.getImage().setOpacity(0);
      map.renderSync();
      const features = map.getFeaturesAtPixel([50, 50]);
      expect(features.length).to.be(1);
    });

    it('only draws features that intersect the hit detection viewport', function () {
      const resolution = map.getView().getResolution();
      source.addFeature(
        new Feature(new Point([660000 + resolution * 6, 190000])),
      );
      source.addFeature(
        new Feature(new Point([660000 - resolution * 12, 190000])),
      );
      map.renderSync();
      const spy = sinonSpy(CanvasRenderingContext2D.prototype, 'drawImage');
      const features = map.getFeaturesAtPixel([50, 44]);
      expect(features.length).to.be(1);
      expect(spy.callCount).to.be(2);
      spy.restore();
    });
  });
});
