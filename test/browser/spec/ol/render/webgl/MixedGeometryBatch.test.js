import {assert} from 'chai';
import Feature from '../../../../../../src/ol/Feature.js';
import GeometryCollection from '../../../../../../src/ol/geom/GeometryCollection.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../../../src/ol/geom/LinearRing.js';
import MultiLineString from '../../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import {getTransform} from '../../../../../../src/ol/proj.js';
import RenderFeature from '../../../../../../src/ol/render/Feature.js';
import MixedGeometryBatch from '../../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import {getUid} from '../../../../../../src/ol/util.js';

describe('MixedGeometryBatch', function () {
  /**
   * @type {MixedGeometryBatch}
   */
  let mixedBatch;

  beforeEach(() => {
    mixedBatch = new MixedGeometryBatch();
  });

  describe('#addFeatures', () => {
    let features, spy;
    beforeEach(() => {
      features = [new Feature(), new Feature(), new Feature()];
      spy = vi.spyOn(mixedBatch, 'addFeature');
      mixedBatch.addFeatures(features);
    });
    it('calls addFeature for each feature', () => {
      assert.strictEqual(spy.mock.calls.length, 3);
      assert.strictEqual(spy.mock.calls[0][0], features[0]);
      assert.strictEqual(spy.mock.calls[1][0], features[1]);
      assert.strictEqual(spy.mock.calls[2][0], features[2]);
    });
  });

  describe('features with Point geometries', () => {
    let geometry1, feature1, geometry2, feature2;

    beforeEach(() => {
      geometry1 = new Point([0, 1]);
      feature1 = new Feature({
        geometry: geometry1,
        prop1: 'abcd',
        prop2: 'efgh',
      });
      geometry2 = new Point([2, 3]);
      feature2 = new Feature({
        geometry: geometry2,
        prop3: '1234',
        prop4: '5678',
      });
    });

    describe('#addFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
      });
      it('puts the geometries in the point batch', () => {
        const keys = Object.keys(mixedBatch.pointBatch.entries);
        const uid1 = getUid(feature1);
        const uid2 = getUid(feature2);
        assert.deepEqual(keys, [uid1, uid2]);
        assert.deepEqual(mixedBatch.pointBatch.entries[uid1], {
          feature: feature1,
          ref: 1,
          flatCoordss: [[0, 1]],
        });
        assert.deepEqual(mixedBatch.pointBatch.entries[uid2], {
          feature: feature2,
          ref: 2,
          flatCoordss: [[2, 3]],
        });
      });
      it('computes the geometries count', () => {
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 2);
      });
      it('leaves other batches untouched', () => {
        assert.lengthOf(Object.keys(mixedBatch.polygonBatch.entries), 0);
        assert.lengthOf(Object.keys(mixedBatch.lineStringBatch.entries), 0);
      });
      it('assigns a hit detection ref to the entry', () => {
        assert.strictEqual(mixedBatch.globalCounter_, 2);
        assert.strictEqual(mixedBatch.freeGlobalRef_.length, 0);
        assert.strictEqual(mixedBatch.getFeatureFromRef(1), feature1);
        assert.strictEqual(mixedBatch.getFeatureFromRef(2), feature2);
      });
    });

    describe('#changeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
      });
      describe('modifying geometry and props', () => {
        beforeEach(() => {
          feature1.set('prop1', 'changed');
          geometry1.setCoordinates([100, 101]);
          mixedBatch.changeFeature(feature1);
        });
        it('updates the modified properties and geometry in the point batch', () => {
          const entry = mixedBatch.pointBatch.entries[getUid(feature1)];
          assert.deepEqual(entry.feature.get('prop1'), 'changed');
        });
        it('keeps geometry count the same', () => {
          assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 2);
        });
      });
      describe('changing the geometry', () => {
        let newGeom;
        beforeEach(() => {
          newGeom = new Point([40, 41]);
          feature1.setGeometry(newGeom);
          mixedBatch.changeFeature(feature1);
        });
        it('updates the geometry in the point batch', () => {
          const entry = mixedBatch.pointBatch.entries[getUid(feature1)];
          assert.deepEqual(entry.flatCoordss, [[40, 41]]);
        });
        it('keeps geometry count the same', () => {
          assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 2);
        });
      });
      describe('if called with feature not already present', () => {
        let otherFeature;
        beforeEach(() => {
          const geoms = new GeometryCollection([
            new Point([40, 41]),
            new LineString([
              [0, 1],
              [2, 3],
            ]),
            new Polygon([
              [
                [0, 1],
                [2, 3],
                [4, 5],
              ],
            ]),
          ]);
          otherFeature = new Feature(geoms);
          mixedBatch.changeFeature(otherFeature);
        });
        it('does not add the new feature', () => {
          assert.notProperty(
            mixedBatch.pointBatch.entries,
            getUid(otherFeature),
          );
          assert.notProperty(
            mixedBatch.polygonBatch.entries,
            getUid(otherFeature),
          );
          assert.notProperty(
            mixedBatch.lineStringBatch.entries,
            getUid(otherFeature),
          );
        });
        it('keeps geometry count the same', () => {
          assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 2);
          assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 0);
          assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 0);
        });
      });
    });

    describe('#removeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
        mixedBatch.removeFeature(feature1);
      });
      it('clears the entry related to this feature', () => {
        const keys = Object.keys(mixedBatch.pointBatch.entries);
        assert.notInclude(keys, getUid(feature1));
        assert.strictEqual(mixedBatch.getFeatureFromRef(1), undefined);
        assert.strictEqual(mixedBatch.getFeatureFromRef(2), feature2);
      });
      it('recompute geometry count', () => {
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 1);
      });
    });
  });

  describe('features with LineString geometries', () => {
    let geometry1, feature1, geometry2, feature2;

    beforeEach(() => {
      geometry1 = new LineString([
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
      ]);
      feature1 = new Feature({
        geometry: geometry1,
        prop1: 'abcd',
        prop2: 'efgh',
      });
      geometry2 = new LineString([
        [8, 9],
        [10, 11],
        [12, 13],
      ]);
      feature2 = new Feature({
        geometry: geometry2,
        prop3: '1234',
        prop4: '5678',
      });
    });

    describe('#addFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
      });
      it('puts the geometries in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        const uid1 = getUid(feature1);
        const uid2 = getUid(feature2);
        assert.deepEqual(keys, [uid1, uid2]);
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid1], {
          feature: feature1,
          flatCoordss: [[0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0]],
          verticesCount: 4,
          ref: 1,
        });
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid2], {
          feature: feature2,
          flatCoordss: [[8, 9, 0, 10, 11, 0, 12, 13, 0]],
          verticesCount: 3,
          ref: 2,
        });
      });
      it('computes the aggregated metrics on all geoms', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 7);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 2);
      });
      it('leaves other batches untouched', () => {
        assert.lengthOf(Object.keys(mixedBatch.polygonBatch.entries), 0);
        assert.lengthOf(Object.keys(mixedBatch.pointBatch.entries), 0);
      });
    });

    describe('#changeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
      });
      describe('modifying geometry and props', () => {
        beforeEach(() => {
          feature1.set('prop1', 'changed');
          geometry1.appendCoordinate([100, 101]);
          geometry1.appendCoordinate([102, 103]);
          mixedBatch.changeFeature(feature1);
        });
        it('updates the modified properties and geometry in the linestring batch', () => {
          const entry = mixedBatch.lineStringBatch.entries[getUid(feature1)];
          assert.deepEqual(entry.feature.get('prop1'), 'changed');
          assert.deepEqual(entry.verticesCount, 6);
          assert.deepEqual(entry.flatCoordss, [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0, 100, 101, 0, 102, 103, 0],
          ]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 9);
          assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 2);
        });
      });
      describe('changing the geometry', () => {
        let newGeom;
        beforeEach(() => {
          newGeom = new LineString([
            [40, 41],
            [42, 43],
          ]);
          feature1.setGeometry(newGeom);
          mixedBatch.changeFeature(feature1);
        });
        it('updates the geometry in the linestring batch', () => {
          const entry = mixedBatch.lineStringBatch.entries[getUid(feature1)];
          assert.deepEqual(entry.flatCoordss, [[40, 41, 0, 42, 43, 0]]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 5);
          assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 2);
        });
      });
    });

    describe('#removeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
        mixedBatch.removeFeature(feature1);
      });
      it('clears the entry related to this feature', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        assert.notInclude(keys, getUid(feature1));
      });
      it('updates the aggregated metrics on all geoms', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 3);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 1);
      });
    });
  });

  describe('features with Polygon geometries', () => {
    let geometry1, feature1, geometry2, feature2;

    beforeEach(() => {
      geometry1 = new Polygon([
        [
          [0, 1],
          [2, 3],
          [4, 5],
          [60, 7],
        ],
        [
          [20, 21],
          [22, 23],
          [-24, 25],
        ],
      ]);
      feature1 = new Feature({
        geometry: geometry1,
        prop1: 'abcd',
        prop2: 'efgh',
      });
      geometry2 = new Polygon([
        [
          [8, 9],
          [10, 11],
          [120, 13],
        ],
        [
          [30, 31],
          [32, 33],
          [-34, 35],
        ],
        [
          [40, 41],
          [42, 43],
          [44, 45],
          [-46, 47],
        ],
      ]);
      feature2 = new Feature({
        geometry: geometry2,
        prop3: '1234',
        prop4: '5678',
      });
    });

    describe('#addFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
      });
      it('puts the polygons in the polygon batch', () => {
        const keys = Object.keys(mixedBatch.polygonBatch.entries);
        const uid1 = getUid(feature1);
        const uid2 = getUid(feature2);
        assert.deepEqual(keys, [uid1, uid2]);
        assert.deepEqual(mixedBatch.polygonBatch.entries[uid1], {
          feature: feature1,
          flatCoordss: [[0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25]],
          verticesCount: 7,
          ringsCount: 2,
          ringsVerticesCounts: [[4, 3]],
          ref: 1,
        });
        assert.deepEqual(mixedBatch.polygonBatch.entries[uid2], {
          feature: feature2,
          flatCoordss: [
            [
              8, 9, 10, 11, 120, 13, 30, 31, 32, 33, -34, 35, 40, 41, 42, 43,
              44, 45, -46, 47,
            ],
          ],
          verticesCount: 10,
          ringsCount: 3,
          ringsVerticesCounts: [[3, 3, 4]],
          ref: 2,
        });
      });
      it('computes the aggregated metrics on all polygons', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 17);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 2);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 5);
      });
      it('puts the linear rings in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        assert.deepEqual(keys, [getUid(feature1), getUid(feature2)]);
        assert.deepEqual(mixedBatch.lineStringBatch.entries[getUid(feature1)], {
          feature: feature1,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
            [20, 21, 0, 22, 23, 0, -24, 25, 0],
          ],
          verticesCount: 7,
          ref: 1,
        });
        assert.deepEqual(mixedBatch.lineStringBatch.entries[getUid(feature2)], {
          feature: feature2,
          flatCoordss: [
            [8, 9, 0, 10, 11, 0, 120, 13, 0],
            [30, 31, 0, 32, 33, 0, -34, 35, 0],
            [40, 41, 0, 42, 43, 0, 44, 45, 0, -46, 47, 0],
          ],
          verticesCount: 10,
          ref: 2,
        });
      });
      it('computes the aggregated metrics on all linestrings', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 17);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 5);
      });
      it('leaves point batch untouched', () => {
        assert.lengthOf(Object.keys(mixedBatch.pointBatch.entries), 0);
      });
    });

    describe('#changeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
      });
      describe('modifying geometry and props', () => {
        beforeEach(() => {
          feature1.set('prop1', 'changed');
          geometry1.appendLinearRing(
            new LinearRing([
              [201, 202],
              [203, 204],
              [205, 206],
              [207, 208],
            ]),
          );
          mixedBatch.changeFeature(feature1);
        });
        it('updates the modified properties and geometry in the polygon batch', () => {
          const entry = mixedBatch.polygonBatch.entries[getUid(feature1)];
          assert.deepEqual(entry.feature.get('prop1'), 'changed');
          assert.deepEqual(entry.verticesCount, 11);
          assert.deepEqual(entry.ringsCount, 3);
          assert.deepEqual(entry.ringsVerticesCounts, [[4, 3, 4]]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 21);
          assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 2);
          assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 6);
        });
      });
      describe('changing the geometry', () => {
        let newGeom;
        beforeEach(() => {
          newGeom = new Polygon([
            [
              [201, 202],
              [203, 204],
              [205, 206],
              [2070, 208],
            ],
          ]);
          feature1.setGeometry(newGeom);
          mixedBatch.changeFeature(feature1);
        });
        it('updates the geometry in the polygon batch', () => {
          const entry = mixedBatch.polygonBatch.entries[getUid(feature1)];
          assert.strictEqual(entry.feature, feature1);
          assert.deepEqual(entry.verticesCount, 4);
          assert.deepEqual(entry.ringsCount, 1);
          assert.deepEqual(entry.ringsVerticesCounts, [[4]]);
          assert.deepEqual(entry.flatCoordss, [
            [201, 202, 203, 204, 205, 206, 2070, 208],
          ]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 14);
          assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 2);
          assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 4);
        });
      });
    });

    describe('#removeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
        mixedBatch.removeFeature(feature1);
      });
      it('clears the entry related to this feature', () => {
        const keys = Object.keys(mixedBatch.polygonBatch.entries);
        assert.notInclude(keys, getUid(feature1));
      });
      it('updates the aggregated metrics on all geoms', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 10);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 1);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 3);
      });
      it('keeps the removed ref for later use', () => {
        assert.deepEqual(mixedBatch.freeGlobalRef_, [1]);
        assert.strictEqual(mixedBatch.globalCounter_, 2);
        assert.strictEqual(mixedBatch.refToFeature_.size, 1);
      });
    });
  });

  describe('feature with nested geometries (collection, multi)', () => {
    let feature, geomCollection, multiPolygon, multiPoint, multiLine;

    beforeEach(() => {
      multiPoint = new MultiPoint([
        [101, 102],
        [201, 202],
        [301, 302],
      ]);
      multiLine = new MultiLineString([
        [
          [0, 1],
          [2, 3],
          [4, 5],
          [6, 7],
        ],
        [
          [8, 9],
          [10, 11],
          [12, 13],
        ],
      ]);
      multiPolygon = new MultiPolygon([
        [
          [
            [0, 1],
            [2, 3],
            [4, 5],
            [60, 7],
          ],
          [
            [20, 21],
            [22, 23],
            [-24, 25],
          ],
        ],
        [
          [
            [8, 9],
            [10, 11],
            [120, 13],
          ],
          [
            [30, 31],
            [32, 33],
            [-34, 35],
          ],
          [
            [40, 41],
            [42, 43],
            [44, 45],
            [-46, 47],
          ],
        ],
      ]);
      geomCollection = new GeometryCollection([
        multiPolygon,
        multiLine,
        multiPoint,
      ]);
      feature = new Feature({
        geometry: geomCollection,
        prop3: '1234',
        prop4: '5678',
      });
    });

    describe('#addFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature);
      });
      it('puts the polygons in the polygon batch', () => {
        const uid = getUid(feature);
        assert.deepEqual(mixedBatch.polygonBatch.entries[uid], {
          feature: feature,
          flatCoordss: [
            [0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25],
            [
              8, 9, 10, 11, 120, 13, 30, 31, 32, 33, -34, 35, 40, 41, 42, 43,
              44, 45, -46, 47,
            ],
          ],
          verticesCount: 17,
          ringsCount: 5,
          ringsVerticesCounts: [
            [4, 3],
            [3, 3, 4],
          ],
          ref: 1,
        });
      });
      it('puts the polygon rings and linestrings in the linestring batch', () => {
        const uid = getUid(feature);
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid], {
          feature: feature,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
            [20, 21, 0, 22, 23, 0, -24, 25, 0],
            [8, 9, 0, 10, 11, 0, 120, 13, 0],
            [30, 31, 0, 32, 33, 0, -34, 35, 0],
            [40, 41, 0, 42, 43, 0, 44, 45, 0, -46, 47, 0],
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0],
            [8, 9, 0, 10, 11, 0, 12, 13, 0],
          ],
          verticesCount: 24,
          ref: 1,
        });
      });
      it('puts the points in the point batch', () => {
        const uid = getUid(feature);
        assert.deepEqual(mixedBatch.pointBatch.entries[uid], {
          feature: feature,
          flatCoordss: [
            [101, 102],
            [201, 202],
            [301, 302],
          ],
          ref: 1,
        });
      });
      it('computes the aggregated metrics on all polygons', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 17);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 2);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 5);
      });
      it('computes the aggregated metrics on all linestring', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 24);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 7);
      });
      it('computes the aggregated metrics on all points', () => {
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 3);
      });
    });

    describe('#changeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature);
      });
      describe('modifying geometry', () => {
        beforeEach(() => {
          multiLine.appendLineString(
            new LineString([
              [500, 501],
              [502, 503],
              [504, 505],
              [506, 507],
            ]),
          );
          multiPolygon.appendPolygon(
            new Polygon([
              [
                [201, 202],
                [203, 204],
                [205, 206],
                [207, 208],
                [2090, 210],
              ],
            ]),
          );
          mixedBatch.changeFeature(feature);
        });
        it('updates the geometries in the polygon batch', () => {
          const entry = mixedBatch.polygonBatch.entries[getUid(feature)];
          assert.deepEqual(entry, {
            feature: feature,
            flatCoordss: [
              [0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25],
              [
                8, 9, 10, 11, 120, 13, 30, 31, 32, 33, -34, 35, 40, 41, 42, 43,
                44, 45, -46, 47,
              ],
              [201, 202, 203, 204, 205, 206, 207, 208, 2090, 210],
            ],
            verticesCount: 22,
            ringsCount: 6,
            ringsVerticesCounts: [[4, 3], [3, 3, 4], [5]],
            ref: 1,
          });
        });
        it('updates the geometries in the linestring batch', () => {
          const entry = mixedBatch.lineStringBatch.entries[getUid(feature)];
          assert.deepEqual(entry, {
            feature: feature,
            flatCoordss: [
              [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
              [20, 21, 0, 22, 23, 0, -24, 25, 0],
              [8, 9, 0, 10, 11, 0, 120, 13, 0],
              [30, 31, 0, 32, 33, 0, -34, 35, 0],
              [40, 41, 0, 42, 43, 0, 44, 45, 0, -46, 47, 0],
              [
                201, 202, 0, 203, 204, 0, 205, 206, 0, 207, 208, 0, 2090, 210,
                0,
              ],
              [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0],
              [8, 9, 0, 10, 11, 0, 12, 13, 0],
              [500, 501, 0, 502, 503, 0, 504, 505, 0, 506, 507, 0],
            ],
            verticesCount: 33,
            ref: 1,
          });
        });
        it('updates the aggregated metrics on the polygon batch', () => {
          assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 22);
          assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 3);
          assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 6);
        });
        it('updates the aggregated metrics on the linestring batch', () => {
          assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 33);
          assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 9);
        });
      });
      describe('changing the geometry', () => {
        beforeEach(() => {
          feature.setGeometry(
            new Polygon([
              [
                [201, 202],
                [203, 204],
                [205, 206],
                [2070, 208],
              ],
            ]),
          );
          mixedBatch.changeFeature(feature);
        });
        it('updates the geometries in the polygon batch', () => {
          const entry = mixedBatch.polygonBatch.entries[getUid(feature)];
          assert.deepEqual(entry, {
            feature: feature,
            flatCoordss: [[201, 202, 203, 204, 205, 206, 2070, 208]],
            verticesCount: 4,
            ringsCount: 1,
            ringsVerticesCounts: [[4]],
            ref: 1,
          });
        });
        it('updates the geometries in the linestring batch', () => {
          const entry = mixedBatch.lineStringBatch.entries[getUid(feature)];
          assert.deepEqual(entry, {
            feature: feature,
            flatCoordss: [
              [201, 202, 0, 203, 204, 0, 205, 206, 0, 2070, 208, 0],
            ],
            verticesCount: 4,
            ref: 1,
          });
        });
        it('updates the aggregated metrics on the polygon batch', () => {
          assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 4);
          assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 1);
          assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 1);
        });
        it('updates the aggregated metrics on the linestring batch', () => {
          assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 4);
          assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 1);
        });
        it('updates the aggregated metrics on the point batch', () => {
          const keys = Object.keys(mixedBatch.pointBatch.entries);
          assert.notInclude(keys, getUid(feature));
          assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 0);
        });
      });
    });

    describe('#removeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature);
        mixedBatch.removeFeature(feature);
      });
      it('clears all entries in the polygon batch', () => {
        const keys = Object.keys(mixedBatch.polygonBatch.entries);
        assert.lengthOf(keys, 0);
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 0);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 0);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 0);
      });
      it('clears all entries in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        assert.lengthOf(keys, 0);
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 0);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 0);
      });
      it('clears all entries in the point batch', () => {
        const keys = Object.keys(mixedBatch.pointBatch.entries);
        assert.lengthOf(keys, 0);
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 0);
      });
    });
  });

  describe('geometries with XYM layout', () => {
    let feature,
      geomCollection,
      multiPolygon,
      multiPoint,
      multiLine,
      lineStringXYM;

    beforeEach(() => {
      multiPoint = new MultiPoint([
        [101, 102, 10],
        [201, 202, 20],
        [301, 302, 30],
      ]);
      multiLine = new MultiLineString([
        [
          [0, 1, 0],
          [2, 3, 0],
          [4, 5, 0],
          [6, 7, 0],
        ],
      ]);
      multiPolygon = new MultiPolygon([
        [
          [
            [0, 1, 0],
            [2, 3, 0],
            [4, 5, 0],
            [60, 7, 0],
          ],
        ],
      ]);
      lineStringXYM = new LineString(
        [
          [2674770.253246974, 6402833.8602291, 1697339891000],
          [2674779.158806238, 6402839.028714703, 1697343500000],
          [2674780.272001146, 6402840.751543939, 1697343506000],
        ],
        'XYM',
      );
      geomCollection = new GeometryCollection([
        multiPolygon,
        multiLine,
        multiPoint,
        lineStringXYM,
      ]);
      feature = new Feature({
        geometry: geomCollection,
      });
      mixedBatch.addFeature(feature);
    });

    describe('#addFeature', () => {
      it('puts the polygons in the polygon batch', () => {
        const uid = getUid(feature);
        assert.deepEqual(mixedBatch.polygonBatch.entries[uid], {
          feature: feature,
          flatCoordss: [[0, 1, 2, 3, 4, 5, 60, 7]],
          verticesCount: 4,
          ringsCount: 1,
          ringsVerticesCounts: [[4]],
          ref: 1,
        });
      });
      it('puts the polygon rings and linestrings in the linestring batch', () => {
        const uid = getUid(feature);
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid], {
          feature: feature,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0],
            [
              2674770.253246974, 6402833.8602291, 1697339891000,
              2674779.158806238, 6402839.028714703, 1697343500000,
              2674780.272001146, 6402840.751543939, 1697343506000,
            ],
          ],
          verticesCount: 11,
          ref: 1,
        });
      });
      it('puts the points in the point batch', () => {
        const uid = getUid(feature);
        assert.deepEqual(mixedBatch.pointBatch.entries[uid], {
          feature: feature,
          flatCoordss: [
            [101, 102],
            [201, 202],
            [301, 302],
          ],
          ref: 1,
        });
      });
      it('computes the aggregated metrics on all polygons', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 4);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 1);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 1);
      });
      it('computes the aggregated metrics on all linestring', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 11);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 3);
      });
      it('computes the aggregated metrics on all points', () => {
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 3);
      });
    });
  });

  describe('render feature with Polygon geometry', () => {
    let geometry, feature, uid;

    beforeEach(() => {
      geometry = new Polygon([
        [
          [0, 1],
          [2, 3],
          [4, 5],
          [60, 7],
        ],
        [
          [20, 21],
          [22, 23],
          [-24, 25],
        ],
      ]);
      feature = new RenderFeature(
        'Polygon',
        geometry.getFlatCoordinates(),
        geometry.getEnds(),
        2,
        {
          prop1: 'abcd',
          prop2: 'efgh',
        },
      );
      uid = getUid(feature);
    });

    describe('#addFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature);
      });
      it('puts the polygons in the polygon batch', () => {
        const keys = Object.keys(mixedBatch.polygonBatch.entries);
        assert.deepEqual(keys, [uid]);
        assert.deepEqual(mixedBatch.polygonBatch.entries[uid], {
          feature: feature,
          flatCoordss: [[0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25]],
          verticesCount: 7,
          ringsCount: 2,
          ringsVerticesCounts: [[4, 3]],
          ref: 1,
        });
      });
      it('computes the aggregated metrics on all polygons', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 7);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 1);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 2);
      });
      it('puts the linear rings in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        assert.deepEqual(keys, [uid]);
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid], {
          feature: feature,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
            [20, 21, 0, 22, 23, 0, -24, 25, 0],
          ],
          verticesCount: 7,
          ref: 1,
        });
      });
      it('computes the aggregated metrics on all linestrings', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 7);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 2);
      });
      it('leaves point batch untouched', () => {
        assert.lengthOf(Object.keys(mixedBatch.pointBatch.entries), 0);
      });
    });

    describe('#removeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature);
        mixedBatch.removeFeature(feature);
      });
      it('clears the entry related to this feature', () => {
        const keys = Object.keys(mixedBatch.polygonBatch.entries);
        assert.notInclude(keys, uid);
      });
      it('updates the aggregated metrics on all geoms', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 0);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 0);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 0);
      });
    });
  });

  describe('render feature with alternating CW and CCW rings', () => {
    let geometry, feature, uid;

    beforeEach(() => {
      geometry = new Polygon([
        [
          [0, 1],
          [2, 3],
          [4, 5],
          [60, 7],
        ],
        [
          [20, 21],
          [22, 23],
          [-24, 25],
        ],
        [
          [8, 9],
          [10, 11],
          [120, 13],
        ],
        [
          [30, 31],
          [32, 33],
          [-34, 35],
        ],
      ]);
      feature = new RenderFeature(
        'Polygon',
        geometry.getFlatCoordinates(),
        geometry.getEnds(),
        2,
        {
          prop1: 'abcd',
          prop2: 'efgh',
        },
      );
      uid = getUid(feature);
      mixedBatch.addFeature(feature);
    });

    it('puts two different polygons with holes in the polygon batch', () => {
      assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 2);
      assert.deepEqual(mixedBatch.polygonBatch.entries[uid], {
        feature: feature,
        flatCoordss: [
          [0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25],
          [8, 9, 10, 11, 120, 13, 30, 31, 32, 33, -34, 35],
        ],
        verticesCount: 13,
        ringsCount: 4,
        ringsVerticesCounts: [
          [4, 3],
          [3, 3],
        ],
        ref: 1,
      });
    });
    it('puts the linear rings in the linestring batch', () => {
      assert.deepEqual(mixedBatch.lineStringBatch.entries[uid], {
        feature: feature,
        flatCoordss: [
          [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
          [20, 21, 0, 22, 23, 0, -24, 25, 0],
          [8, 9, 0, 10, 11, 0, 120, 13, 0],
          [30, 31, 0, 32, 33, 0, -34, 35, 0],
        ],
        verticesCount: 13,
        ref: 1,
      });
    });
  });

  describe('feature with multi geometry', () => {
    let feature1,
      feature2,
      feature3,
      uid1,
      uid2,
      multiPolygon,
      multiLine,
      multiPoint;

    beforeEach(() => {
      multiLine = new MultiLineString([
        [
          [0, 1],
          [2, 3],
          [4, 5],
          [6, 7],
        ],
        [
          [8, 9],
          [10, 11],
          [12, 13],
        ],
      ]);
      multiPolygon = new MultiPolygon([
        [
          [
            [0, 1],
            [2, 3],
            [4, 5],
            [-6, 7],
          ],
          [
            [20, 21],
            [22, 23],
            [24, -25],
          ],
        ],
        [
          [
            [8, 9],
            [10, 11],
            [-12, 13],
          ],
          [
            [30, 31],
            [32, 33],
            [34, -35],
          ],
          [
            [40, 41],
            [42, 43],
            [44, 45],
            [46, -47],
          ],
        ],
      ]);
      multiPoint = new MultiPoint([
        [101, 102],
        [201, 202],
        [301, 302],
      ]);
      feature1 = new RenderFeature(
        'MultiLineString',
        multiLine.getFlatCoordinates(),
        multiLine.getEnds(),
        2,
        {
          prop3: 'abcd',
          prop4: 'efgh',
        },
      );
      feature2 = new RenderFeature(
        'Polygon',
        multiPolygon.getFlatCoordinates(),
        multiPolygon.getEndss().flat(),
        2,
        {
          prop3: 'uvw',
          prop4: 'xyz',
        },
      );
      feature3 = new RenderFeature(
        'MultiPoint',
        multiPoint.getFlatCoordinates(),
        multiPoint.getPoints().map((p, i) => i + 1),
        2,
        {
          prop3: 'uvw',
          prop4: 'xyz',
        },
      );
      uid1 = getUid(feature1);
      uid2 = getUid(feature2);
    });

    describe('#addFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature1);
        mixedBatch.addFeature(feature2);
        mixedBatch.addFeature(feature3);
      });
      it('puts the polygons in the polygon batch', () => {
        assert.deepEqual(mixedBatch.polygonBatch.entries[uid2], {
          feature: feature2,
          flatCoordss: [
            [0, 1, 2, 3, 4, 5, -6, 7, 20, 21, 22, 23, 24, -25],
            [
              8, 9, 10, 11, -12, 13, 30, 31, 32, 33, 34, -35, 40, 41, 42, 43,
              44, 45, 46, -47,
            ],
          ],
          verticesCount: 17,
          ringsCount: 5,
          ringsVerticesCounts: [
            [4, 3],
            [3, 3, 4],
          ],
          ref: 2,
        });
      });
      it('puts the polygon rings and linestrings in the linestring batch', () => {
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid1], {
          feature: feature1,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0],
            [8, 9, 0, 10, 11, 0, 12, 13, 0],
          ],
          verticesCount: 7,
          ref: 1,
        });
        assert.deepEqual(mixedBatch.lineStringBatch.entries[uid2], {
          feature: feature2,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, -6, 7, 0],
            [20, 21, 0, 22, 23, 0, 24, -25, 0],
            [8, 9, 0, 10, 11, 0, -12, 13, 0],
            [30, 31, 0, 32, 33, 0, 34, -35, 0],
            [40, 41, 0, 42, 43, 0, 44, 45, 0, 46, -47, 0],
          ],
          verticesCount: 17,
          ref: 2,
        });
      });
      it('computes the aggregated metrics on all polygons', () => {
        assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 17);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 2);
        assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 5);
      });
      it('computes the aggregated metrics on all linestring', () => {
        assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 24);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 7);
      });
      it('computes the aggregated metrics on all points', () => {
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 3);
      });
    });
  });

  describe('with projectionTransform', () => {
    let geometry1, feature1, uid1, projectionTransform, transformedFlatCoordss;

    beforeEach(() => {
      projectionTransform = getTransform('EPSG:4326', 'EPSG:3857');

      geometry1 = new Point([135, 35]);
      feature1 = new Feature({
        geometry: geometry1,
      });

      uid1 = getUid(feature1);
      transformedFlatCoordss = [projectionTransform([135, 35])];

      mixedBatch.addFeature(feature1, projectionTransform);
    });

    it('has the transformed flatCoords', () => {
      assert.deepEqual(
        mixedBatch.pointBatch.entries[uid1].flatCoordss,
        transformedFlatCoordss,
      );
    });
    it('has the same transformed flatCoords after changeFeature', () => {
      mixedBatch.changeFeature(feature1, projectionTransform);
      assert.deepEqual(
        mixedBatch.pointBatch.entries[uid1].flatCoordss,
        transformedFlatCoordss,
      );
    });
  });

  describe('#clear', () => {
    beforeEach(() => {
      const feature1 = new Feature(
        new Polygon([
          [
            [201, 202],
            [203, 204],
            [205, 206],
            [207, 208],
          ],
        ]),
      );
      const feature2 = new Feature(new Point([201, 202]));
      mixedBatch.addFeature(feature1);
      mixedBatch.addFeature(feature2);
      mixedBatch.clear();
    });

    it('clears polygon batch', () => {
      assert.lengthOf(Object.keys(mixedBatch.polygonBatch.entries), 0);
      assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 0);
      assert.strictEqual(mixedBatch.polygonBatch.verticesCount, 0);
      assert.strictEqual(mixedBatch.polygonBatch.ringsCount, 0);
    });

    it('clears linestring batch', () => {
      assert.lengthOf(Object.keys(mixedBatch.lineStringBatch.entries), 0);
      assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 0);
      assert.strictEqual(mixedBatch.lineStringBatch.verticesCount, 0);
    });

    it('clears point batch', () => {
      assert.lengthOf(Object.keys(mixedBatch.pointBatch.entries), 0);
      assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 0);
    });
  });

  describe('#filter', () => {
    let feature1, feature2, feature3, feature4;
    beforeEach(() => {
      feature1 = new Feature({
        keep: true,
        geometry: new Point([101, 102]),
      });
      feature2 = new Feature({
        keep: false,
        geometry: new Point([201, 202]),
      });
      feature3 = new Feature({
        keep: false,
        geometry: new Point([301, 302]),
      });
      feature4 = new Feature({
        keep: true,
        geometry: new Point([401, 402]),
      });
      mixedBatch.addFeature(feature1);
      mixedBatch.addFeature(feature2);
      mixedBatch.addFeature(feature3);
      mixedBatch.addFeature(feature4);
    });
    describe('partial filtering', () => {
      beforeEach(() => {
        mixedBatch = mixedBatch.filter((feature) => feature.get('keep'));
      });

      it('only keeps two features', () => {
        assert.lengthOf(Object.keys(mixedBatch.pointBatch.entries), 2);
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 2);
      });

      it('leaves polygon batch empty', () => {
        assert.lengthOf(Object.keys(mixedBatch.polygonBatch.entries), 0);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 0);
      });

      it('leaves linestring batch empty', () => {
        assert.lengthOf(Object.keys(mixedBatch.lineStringBatch.entries), 0);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 0);
      });

      it('preserves the feature references from the original batch', () => {
        assert.strictEqual(mixedBatch.getFeatureFromRef(1), feature1);
        assert.strictEqual(mixedBatch.getFeatureFromRef(4), feature4);
      });
    });
    describe('filtering out everything', () => {
      beforeEach(() => {
        mixedBatch = mixedBatch.filter(() => false);
      });

      it('leaves point batch empty', () => {
        assert.lengthOf(Object.keys(mixedBatch.pointBatch.entries), 0);
        assert.strictEqual(mixedBatch.pointBatch.geometriesCount, 0);
      });

      it('leaves polygon batch empty', () => {
        assert.lengthOf(Object.keys(mixedBatch.polygonBatch.entries), 0);
        assert.strictEqual(mixedBatch.polygonBatch.geometriesCount, 0);
      });

      it('leaves linestring batch empty', () => {
        assert.lengthOf(Object.keys(mixedBatch.lineStringBatch.entries), 0);
        assert.strictEqual(mixedBatch.lineStringBatch.geometriesCount, 0);
      });
    });
  });
});
