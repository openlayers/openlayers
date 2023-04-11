import RenderFeature, {
  toFeature,
  toGeometry,
} from '../../../../src/ol/render/Feature.js';
import expect from '../../expect.js';
import {
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from '../../../../src/ol/geom.js';

describe('ol/render/Feature', function () {
  describe('ol/render/Feature.toGeometry()', function () {
    it('creates a Point', function () {
      const geometry = new Point([0, 0]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        []
      );
      const converted = toGeometry(renderFeature);
      expect(converted).to.be.a(Point);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
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
        []
      );
      const converted = toGeometry(renderFeature);
      expect(converted).to.be.a(MultiPoint);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
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
        []
      );
      const converted = toGeometry(renderFeature);
      expect(converted).to.be.a(LineString);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
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
        geometry.getEnds().slice()
      );
      const converted = toGeometry(renderFeature);
      expect(converted).to.be.a(MultiLineString);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
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
        geometry.getEnds().slice()
      );
      const converted = toGeometry(renderFeature);
      expect(converted).to.be.a(Polygon);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
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
        geometry.getEndss().flat(1)
      );
      const converted = toGeometry(renderFeature);
      expect(converted).to.be.a(MultiPolygon);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
      );
      expect(converted.getEndss()).to.eql(geometry.getEndss());
      expect(converted.getProperties()).to.eql({});
    });
  });

  describe('ol/render/Feature.toFeature()', function () {
    it('creates a Feature<Point>', function () {
      const id = 'asdf';
      const properties = {test: '123'};
      const geometry = new Point([0, 0]);
      const renderFeature = new RenderFeature(
        geometry.getType(),
        geometry.getFlatCoordinates().slice(),
        [],
        properties,
        id
      );
      const feature = toFeature(renderFeature);
      const converted = feature.getGeometry();
      expect(converted).to.be.a(Point);
      expect(converted.getFlatCoordinates()).to.eql(
        geometry.getFlatCoordinates()
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
      properties,
      id
    );
    const geometryName = 'geom';
    const feature = toFeature(renderFeature, geometryName);
    const converted = feature.getGeometry();
    expect(converted).to.be.a(LineString);
    expect(feature.get(geometryName)).to.be(converted);
    expect(converted.getFlatCoordinates()).to.eql(
      geometry.getFlatCoordinates()
    );
    expect(feature.getId()).to.be(id);
    const props = feature.getProperties();
    delete props.geom;
    expect(props).to.eql(properties);
  });
});
