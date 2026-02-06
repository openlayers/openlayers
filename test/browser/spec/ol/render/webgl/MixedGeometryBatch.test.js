import {spy as sinonSpy} from 'sinon';
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
      spy = sinonSpy(mixedBatch, 'addFeature');
      mixedBatch.addFeatures(features);
    });
    it('calls addFeature for each feature', () => {
      expect(spy.callCount).to.be(3);
      expect(spy.args[0][0]).to.be(features[0]);
      expect(spy.args[1][0]).to.be(features[1]);
      expect(spy.args[2][0]).to.be(features[2]);
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
        expect(keys).to.eql([uid1, uid2]);
        expect(mixedBatch.pointBatch.entries[uid1]).to.eql({
          feature: feature1,
          ref: 1,
          flatCoordss: [[0, 1]],
        });
        expect(mixedBatch.pointBatch.entries[uid2]).to.eql({
          feature: feature2,
          ref: 2,
          flatCoordss: [[2, 3]],
        });
      });
      it('computes the geometries count', () => {
        expect(mixedBatch.pointBatch.geometriesCount).to.be(2);
      });
      it('leaves other batches untouched', () => {
        expect(Object.keys(mixedBatch.polygonBatch.entries)).to.have.length(0);
        expect(Object.keys(mixedBatch.lineStringBatch.entries)).to.have.length(
          0,
        );
      });
      it('assigns a hit detection ref to the entry', () => {
        expect(mixedBatch.globalCounter_).to.be(2);
        expect(mixedBatch.freeGlobalRef_.length).to.be(0);
        expect(mixedBatch.getFeatureFromRef(1)).to.be(feature1);
        expect(mixedBatch.getFeatureFromRef(2)).to.be(feature2);
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
          expect(entry.feature.get('prop1')).to.eql('changed');
        });
        it('keeps geometry count the same', () => {
          expect(mixedBatch.pointBatch.geometriesCount).to.be(2);
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
          expect(entry.flatCoordss).to.eql([[40, 41]]);
        });
        it('keeps geometry count the same', () => {
          expect(mixedBatch.pointBatch.geometriesCount).to.be(2);
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
          expect(mixedBatch.pointBatch.entries).not.to.contain(
            getUid(otherFeature),
          );
          expect(mixedBatch.polygonBatch.entries).not.to.contain(
            getUid(otherFeature),
          );
          expect(mixedBatch.lineStringBatch.entries).not.to.contain(
            getUid(otherFeature),
          );
        });
        it('keeps geometry count the same', () => {
          expect(mixedBatch.pointBatch.geometriesCount).to.be(2);
          expect(mixedBatch.polygonBatch.geometriesCount).to.be(0);
          expect(mixedBatch.lineStringBatch.geometriesCount).to.be(0);
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
        expect(keys).to.not.contain(getUid(feature1));
        expect(mixedBatch.getFeatureFromRef(1)).to.be(undefined);
        expect(mixedBatch.getFeatureFromRef(2)).to.be(feature2);
      });
      it('recompute geometry count', () => {
        expect(mixedBatch.pointBatch.geometriesCount).to.be(1);
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
        expect(keys).to.eql([uid1, uid2]);
        expect(mixedBatch.lineStringBatch.entries[uid1]).to.eql({
          feature: feature1,
          flatCoordss: [[0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0]],
          verticesCount: 4,
          ref: 1,
        });
        expect(mixedBatch.lineStringBatch.entries[uid2]).to.eql({
          feature: feature2,
          flatCoordss: [[8, 9, 0, 10, 11, 0, 12, 13, 0]],
          verticesCount: 3,
          ref: 2,
        });
      });
      it('computes the aggregated metrics on all geoms', () => {
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(7);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(2);
      });
      it('leaves other batches untouched', () => {
        expect(Object.keys(mixedBatch.polygonBatch.entries)).to.have.length(0);
        expect(Object.keys(mixedBatch.pointBatch.entries)).to.have.length(0);
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
          expect(entry.feature.get('prop1')).to.eql('changed');
          expect(entry.verticesCount).to.eql(6);
          expect(entry.flatCoordss).to.eql([
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0, 100, 101, 0, 102, 103, 0],
          ]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          expect(mixedBatch.lineStringBatch.verticesCount).to.be(9);
          expect(mixedBatch.lineStringBatch.geometriesCount).to.be(2);
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
          expect(entry.flatCoordss).to.eql([[40, 41, 0, 42, 43, 0]]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          expect(mixedBatch.lineStringBatch.verticesCount).to.be(5);
          expect(mixedBatch.lineStringBatch.geometriesCount).to.be(2);
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
        expect(keys).to.not.contain(getUid(feature1));
      });
      it('updates the aggregated metrics on all geoms', () => {
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(3);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(1);
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
        expect(keys).to.eql([uid1, uid2]);
        expect(mixedBatch.polygonBatch.entries[uid1]).to.eql({
          feature: feature1,
          flatCoordss: [[0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25]],
          verticesCount: 7,
          ringsCount: 2,
          ringsVerticesCounts: [[4, 3]],
          ref: 1,
        });
        expect(mixedBatch.polygonBatch.entries[uid2]).to.eql({
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
        expect(mixedBatch.polygonBatch.verticesCount).to.be(17);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(2);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(5);
      });
      it('puts the linear rings in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        expect(keys).to.eql([getUid(feature1), getUid(feature2)]);
        expect(mixedBatch.lineStringBatch.entries[getUid(feature1)]).to.eql({
          feature: feature1,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 60, 7, 0],
            [20, 21, 0, 22, 23, 0, -24, 25, 0],
          ],
          verticesCount: 7,
          ref: 1,
        });
        expect(mixedBatch.lineStringBatch.entries[getUid(feature2)]).to.eql({
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
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(17);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(5);
      });
      it('leaves point batch untouched', () => {
        expect(Object.keys(mixedBatch.pointBatch.entries)).to.have.length(0);
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
          expect(entry.feature.get('prop1')).to.eql('changed');
          expect(entry.verticesCount).to.eql(11);
          expect(entry.ringsCount).to.eql(3);
          expect(entry.ringsVerticesCounts).to.eql([[4, 3, 4]]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          expect(mixedBatch.polygonBatch.verticesCount).to.be(21);
          expect(mixedBatch.polygonBatch.geometriesCount).to.be(2);
          expect(mixedBatch.polygonBatch.ringsCount).to.be(6);
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
          expect(entry.feature).to.be(feature1);
          expect(entry.verticesCount).to.eql(4);
          expect(entry.ringsCount).to.eql(1);
          expect(entry.ringsVerticesCounts).to.eql([[4]]);
          expect(entry.flatCoordss).to.eql([
            [201, 202, 203, 204, 205, 206, 2070, 208],
          ]);
        });
        it('updates the aggregated metrics on all geoms', () => {
          expect(mixedBatch.polygonBatch.verticesCount).to.be(14);
          expect(mixedBatch.polygonBatch.geometriesCount).to.be(2);
          expect(mixedBatch.polygonBatch.ringsCount).to.be(4);
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
        expect(keys).to.not.contain(getUid(feature1));
      });
      it('updates the aggregated metrics on all geoms', () => {
        expect(mixedBatch.polygonBatch.verticesCount).to.be(10);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(1);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(3);
      });
      it('keeps the removed ref for later use', () => {
        expect(mixedBatch.freeGlobalRef_).to.eql([1]);
        expect(mixedBatch.globalCounter_).to.be(2);
        expect(mixedBatch.refToFeature_.size).to.be(1);
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
        expect(mixedBatch.polygonBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.lineStringBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.pointBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.polygonBatch.verticesCount).to.be(17);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(2);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(5);
      });
      it('computes the aggregated metrics on all linestring', () => {
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(24);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(7);
      });
      it('computes the aggregated metrics on all points', () => {
        expect(mixedBatch.pointBatch.geometriesCount).to.be(3);
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
          expect(entry).to.eql({
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
          expect(entry).to.eql({
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
          expect(mixedBatch.polygonBatch.verticesCount).to.be(22);
          expect(mixedBatch.polygonBatch.geometriesCount).to.be(3);
          expect(mixedBatch.polygonBatch.ringsCount).to.be(6);
        });
        it('updates the aggregated metrics on the linestring batch', () => {
          expect(mixedBatch.lineStringBatch.verticesCount).to.be(33);
          expect(mixedBatch.lineStringBatch.geometriesCount).to.be(9);
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
          expect(entry).to.eql({
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
          expect(entry).to.eql({
            feature: feature,
            flatCoordss: [
              [201, 202, 0, 203, 204, 0, 205, 206, 0, 2070, 208, 0],
            ],
            verticesCount: 4,
            ref: 1,
          });
        });
        it('updates the aggregated metrics on the polygon batch', () => {
          expect(mixedBatch.polygonBatch.verticesCount).to.be(4);
          expect(mixedBatch.polygonBatch.geometriesCount).to.be(1);
          expect(mixedBatch.polygonBatch.ringsCount).to.be(1);
        });
        it('updates the aggregated metrics on the linestring batch', () => {
          expect(mixedBatch.lineStringBatch.verticesCount).to.be(4);
          expect(mixedBatch.lineStringBatch.geometriesCount).to.be(1);
        });
        it('updates the aggregated metrics on the point batch', () => {
          const keys = Object.keys(mixedBatch.pointBatch.entries);
          expect(keys).to.not.contain(getUid(feature));
          expect(mixedBatch.pointBatch.geometriesCount).to.be(0);
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
        expect(keys).to.have.length(0);
        expect(mixedBatch.polygonBatch.verticesCount).to.be(0);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(0);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(0);
      });
      it('clears all entries in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        expect(keys).to.have.length(0);
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(0);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(0);
      });
      it('clears all entries in the point batch', () => {
        const keys = Object.keys(mixedBatch.pointBatch.entries);
        expect(keys).to.have.length(0);
        expect(mixedBatch.pointBatch.geometriesCount).to.be(0);
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
        expect(mixedBatch.polygonBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.lineStringBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.pointBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.polygonBatch.verticesCount).to.be(4);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(1);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(1);
      });
      it('computes the aggregated metrics on all linestring', () => {
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(11);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(3);
      });
      it('computes the aggregated metrics on all points', () => {
        expect(mixedBatch.pointBatch.geometriesCount).to.be(3);
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
        expect(keys).to.eql([uid]);
        expect(mixedBatch.polygonBatch.entries[uid]).to.eql({
          feature: feature,
          flatCoordss: [[0, 1, 2, 3, 4, 5, 60, 7, 20, 21, 22, 23, -24, 25]],
          verticesCount: 7,
          ringsCount: 2,
          ringsVerticesCounts: [[4, 3]],
          ref: 1,
        });
      });
      it('computes the aggregated metrics on all polygons', () => {
        expect(mixedBatch.polygonBatch.verticesCount).to.be(7);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(1);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(2);
      });
      it('puts the linear rings in the linestring batch', () => {
        const keys = Object.keys(mixedBatch.lineStringBatch.entries);
        expect(keys).to.eql([uid]);
        expect(mixedBatch.lineStringBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(7);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(2);
      });
      it('leaves point batch untouched', () => {
        expect(Object.keys(mixedBatch.pointBatch.entries)).to.have.length(0);
      });
    });

    describe('#removeFeature', () => {
      beforeEach(() => {
        mixedBatch.addFeature(feature);
        mixedBatch.removeFeature(feature);
      });
      it('clears the entry related to this feature', () => {
        const keys = Object.keys(mixedBatch.polygonBatch.entries);
        expect(keys).to.not.contain(uid);
      });
      it('updates the aggregated metrics on all geoms', () => {
        expect(mixedBatch.polygonBatch.verticesCount).to.be(0);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(0);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(0);
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
      expect(mixedBatch.polygonBatch.geometriesCount).to.be(2);
      expect(mixedBatch.polygonBatch.entries[uid]).to.eql({
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
      expect(mixedBatch.lineStringBatch.entries[uid]).to.eql({
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
        expect(mixedBatch.polygonBatch.entries[uid2]).to.eql({
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
        expect(mixedBatch.lineStringBatch.entries[uid1]).to.eql({
          feature: feature1,
          flatCoordss: [
            [0, 1, 0, 2, 3, 0, 4, 5, 0, 6, 7, 0],
            [8, 9, 0, 10, 11, 0, 12, 13, 0],
          ],
          verticesCount: 7,
          ref: 1,
        });
        expect(mixedBatch.lineStringBatch.entries[uid2]).to.eql({
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
        expect(mixedBatch.polygonBatch.verticesCount).to.be(17);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(2);
        expect(mixedBatch.polygonBatch.ringsCount).to.be(5);
      });
      it('computes the aggregated metrics on all linestring', () => {
        expect(mixedBatch.lineStringBatch.verticesCount).to.be(24);
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(7);
      });
      it('computes the aggregated metrics on all points', () => {
        expect(mixedBatch.pointBatch.geometriesCount).to.be(3);
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
      expect(mixedBatch.pointBatch.entries[uid1].flatCoordss).to.eql(
        transformedFlatCoordss,
      );
    });
    it('has the same transformed flatCoords after changeFeature', () => {
      mixedBatch.changeFeature(feature1, projectionTransform);
      expect(mixedBatch.pointBatch.entries[uid1].flatCoordss).to.eql(
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
      expect(Object.keys(mixedBatch.polygonBatch.entries)).to.have.length(0);
      expect(mixedBatch.polygonBatch.geometriesCount).to.be(0);
      expect(mixedBatch.polygonBatch.verticesCount).to.be(0);
      expect(mixedBatch.polygonBatch.ringsCount).to.be(0);
    });

    it('clears linestring batch', () => {
      expect(Object.keys(mixedBatch.lineStringBatch.entries)).to.have.length(0);
      expect(mixedBatch.lineStringBatch.geometriesCount).to.be(0);
      expect(mixedBatch.lineStringBatch.verticesCount).to.be(0);
    });

    it('clears point batch', () => {
      expect(Object.keys(mixedBatch.pointBatch.entries)).to.have.length(0);
      expect(mixedBatch.pointBatch.geometriesCount).to.be(0);
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
        expect(Object.keys(mixedBatch.pointBatch.entries)).to.have.length(2);
        expect(mixedBatch.pointBatch.geometriesCount).to.be(2);
      });

      it('leaves polygon batch empty', () => {
        expect(Object.keys(mixedBatch.polygonBatch.entries)).to.have.length(0);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(0);
      });

      it('leaves linestring batch empty', () => {
        expect(Object.keys(mixedBatch.lineStringBatch.entries)).to.have.length(
          0,
        );
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(0);
      });

      it('preserves the feature references from the original batch', () => {
        expect(mixedBatch.getFeatureFromRef(1)).to.be(feature1);
        expect(mixedBatch.getFeatureFromRef(4)).to.be(feature4);
      });
    });
    describe('filtering out everything', () => {
      beforeEach(() => {
        mixedBatch = mixedBatch.filter(() => false);
      });

      it('leaves point batch empty', () => {
        expect(Object.keys(mixedBatch.pointBatch.entries)).to.have.length(0);
        expect(mixedBatch.pointBatch.geometriesCount).to.be(0);
      });

      it('leaves polygon batch empty', () => {
        expect(Object.keys(mixedBatch.polygonBatch.entries)).to.have.length(0);
        expect(mixedBatch.polygonBatch.geometriesCount).to.be(0);
      });

      it('leaves linestring batch empty', () => {
        expect(Object.keys(mixedBatch.lineStringBatch.entries)).to.have.length(
          0,
        );
        expect(mixedBatch.lineStringBatch.geometriesCount).to.be(0);
      });
    });
  });
});
