import {assert} from 'chai';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import RenderFeature, {
  toFeature,
  toGeometry,
} from '../../../../src/ol/render/Feature.js';

describe('ol/render/Feature', function () {
  describe('toGeometry()', function () {
    it('creates a Point', function () {
      const geometry = new Point([0, 0]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        [],
        2,
      );
      const converted = toGeometry(renderFeature);
      assert.instanceOf(converted, Point);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.deepEqual(converted.getProperties(), {});
    });
    it('creates a MultiPoint', function () {
      const geometry = new MultiPoint([
        [0, 0],
        [4, 5],
      ]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        [],
        2,
      );
      const converted = toGeometry(renderFeature);
      assert.instanceOf(converted, MultiPoint);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.deepEqual(converted.getProperties(), {});
    });
    it('creates a LineString', function () {
      const geometry = new LineString([
        [0, 0],
        [4, 5],
      ]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        [],
        2,
      );
      const converted = toGeometry(renderFeature);
      assert.instanceOf(converted, LineString);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.deepEqual(converted.getProperties(), {});
    });
    it('creates a MultiLineString', function () {
      const geometry = new MultiLineString([
        [
          [0, 0],
          [4, 5],
        ],
        [
          [0, 0],
          [4, 5],
        ],
      ]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        geometry.getEnds().slice(),
        2,
      );
      const converted = toGeometry(renderFeature);
      assert.instanceOf(converted, MultiLineString);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.deepEqual(converted.getEnds(), geometry.getEnds());
      assert.deepEqual(converted.getProperties(), {});
    });
    it('creates a Polygon', function () {
      const geometry = new Polygon([
        [
          [0, 0],
          [5, 0],
          [5, 5],
          [0, 0],
        ],
        [
          [1, 1],
          [4, 4],
          [4, 1],
          [1, 1],
        ],
      ]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        geometry.getEnds().slice(),
        2,
      );
      const converted = toGeometry(renderFeature);
      assert.instanceOf(converted, Polygon);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.deepEqual(converted.getEnds(), geometry.getEnds());
      assert.deepEqual(converted.getProperties(), {});
    });
    it('creates a MultiPolygon from oriented polygon rings', function () {
      const geometry = new MultiPolygon([
        [
          [
            [0, 0],
            [5, 0],
            [5, 5],
            [0, 0],
          ],
          [
            [1, 1],
            [4, 4],
            [4, 1],
            [1, 1],
          ],
        ],
        [
          [
            [-0, -0],
            [-5, -0],
            [-5, -5],
            [-0, -0],
          ],
        ],
      ]);
      const renderFeature = new RenderFeature(
        'Polygon',
        geometry.getFlatCoordinates().slice(),
        geometry.getEndss().flat(1),
        2,
      );
      const converted = toGeometry(renderFeature);
      assert.instanceOf(converted, MultiPolygon);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.deepEqual(converted.getEndss(), geometry.getEndss());
      assert.deepEqual(converted.getProperties(), {});
    });
  });

  describe('getPropertiesInternal()', () => {
    it('returns the properties', () => {
      const id = 'asdf';
      const properties = {test: '123'};
      const geometry = new Point([0, 0]);
      const feature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        [],
        2,
        properties,
        id,
      );

      const got = feature.getPropertiesInternal();
      assert.deepEqual(got, properties);
    });
  });

  describe('toFeature()', function () {
    it('creates a Feature<Point>', function () {
      const id = 'asdf';
      const properties = {test: '123'};
      const geometry = new Point([0, 0]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        [],
        2,
        properties,
        id,
      );
      const feature = toFeature(renderFeature);
      const converted = feature.getGeometry();
      assert.instanceOf(converted, Point);
      assert.deepEqual(
        converted.getFlatCoordinates(),
        geometry.getFlatCoordinates(),
      );
      assert.strictEqual(feature.getId(), id);
      const props = feature.getProperties();
      delete props.geometry;
      assert.deepEqual(props, properties);
    });
  });
  it('creates a Feature<LineString> with non-default geometry name', function () {
    const id = 'asdf';
    const properties = {geometry: '123'};
    const geometry = new LineString([
      [0, 0],
      [5, 5],
    ]);
    const renderFeature = new RenderFeature(
      geometry.getType(),
      geometry.getFlatCoordinates().slice(),
      [],
      2,
      properties,
      id,
    );
    const geometryName = 'geom';
    const feature = toFeature(renderFeature, geometryName);
    const converted = feature.getGeometry();
    assert.instanceOf(converted, LineString);
    assert.strictEqual(feature.get(geometryName), converted);
    assert.deepEqual(
      converted.getFlatCoordinates(),
      geometry.getFlatCoordinates(),
    );
    assert.strictEqual(feature.getId(), id);
    const props = feature.getProperties();
    delete props.geom;
    assert.deepEqual(props, properties);
  });

  describe('clone()', () => {
    it('creates a clone', () => {
      const id = 'asdf';
      const properties = {geometry: '123'};
      const geometry = new MultiLineString([
        [
          [0, 0],
          [4, 5],
        ],
        [
          [0, 0],
          [4, 5],
        ],
      ]);
      const feature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        geometry.getEnds().slice(),
        2,
        properties,
        id,
      );

      const clone = feature.clone();
      assert.instanceOf(clone, RenderFeature);
      assert.deepEqual(
        clone.getFlatCoordinates(),
        feature.getFlatCoordinates(),
      );
      assert.deepEqual(clone.getEnds(), feature.getEnds());
      assert.strictEqual(clone.getId(), feature.getId());
      assert.deepEqual(clone.getProperties(), feature.getProperties());

      const modifiedCoordinates = clone.getFlatCoordinates();
      modifiedCoordinates.length = 0;

      const originalCoordinates = feature.getFlatCoordinates();
      assert.notEqual(originalCoordinates, modifiedCoordinates);

      const modifiedEnds = clone.getEnds();
      modifiedEnds.length = 0;

      const originalEnds = feature.getEnds();
      assert.notEqual(originalEnds, modifiedEnds);

      const modifiedProperties = clone.getProperties();
      for (const key in modifiedProperties) {
        delete modifiedProperties[key];
      }
      const originalProperties = feature.getProperties();
      assert.notEqual(originalProperties, modifiedProperties);
    });
  });
});
