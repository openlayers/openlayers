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
import expect from '../../expect.js';

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
      expect(converted).to.be.a(Point);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(converted.getProperties()).to.eql({});
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
      expect(converted).to.be.a(MultiPoint);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(converted.getProperties()).to.eql({});
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
      expect(converted).to.be.a(LineString);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(converted.getProperties()).to.eql({});
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
      expect(converted).to.be.a(MultiLineString);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(converted.getEnds()).to.eql(geometry.getEnds());
      expect(converted.getProperties()).to.eql({});
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
      expect(converted).to.be.a(Polygon);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(converted.getEnds()).to.eql(geometry.getEnds());
      expect(converted.getProperties()).to.eql({});
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
      expect(converted).to.be.a(MultiPolygon);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(converted.getEndss()).to.eql(geometry.getEndss());
      expect(converted.getProperties()).to.eql({});
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
      expect(got).to.eql(properties);
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
      expect(converted).to.be.a(Point);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates(),
      );
      expect(feature.getId()).to.be(id);
      const props = feature.getProperties();
      delete props.geometry;
      expect(props).to.eql(properties);
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
    expect(converted).to.be.a(LineString);
    expect(feature.get(geometryName)).to.be(converted);
    expect(converted.getFlatCoordinates()).to.eql(
      geometry.getFlatCoordinates(),
    );
    expect(feature.getId()).to.be(id);
    const props = feature.getProperties();
    delete props.geom;
    expect(props).to.eql(properties);
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
      expect(clone).to.be.a(RenderFeature);
      expect(clone.getFlatCoordinates()).to.eql(feature.getFlatCoordinates());
      expect(clone.getEnds()).to.eql(feature.getEnds());
      expect(clone.getId()).to.be(feature.getId());
      expect(clone.getProperties()).to.eql(feature.getProperties());

      const modifiedCoordinates = clone.getFlatCoordinates();
      modifiedCoordinates.length = 0;

      const originalCoordinates = feature.getFlatCoordinates();
      expect(originalCoordinates).to.not.be(modifiedCoordinates);

      const modifiedEnds = clone.getEnds();
      modifiedEnds.length = 0;

      const originalEnds = feature.getEnds();
      expect(originalEnds).to.not.be(modifiedEnds);

      const modifiedProperties = clone.getProperties();
      for (const key in modifiedProperties) {
        delete modifiedProperties[key];
      }
      const originalProperties = feature.getProperties();
      expect(originalProperties).to.not.be(modifiedProperties);
    });
  });
});
