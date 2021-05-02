import Feature from '../../../../src/ol/Feature.js';
import Point from '../../../../src/ol/geom/Point.js';
import WKT from '../../../../src/ol/format/WKT.js';
import expect from '../../expect.js';
import {transform} from '../../../../src/ol/proj.js';

describe('ol/format/WKT.js', function () {
  let format = new WKT();

  describe('#readProjectionFromText', function () {
    it('returns the default projection', function () {
      const projection = format.readProjectionFromText('POINT(1 2)');
      expect(projection).to.be(undefined);
    });
  });

  describe('#readGeometry()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const wkt = 'POINT(1 2)';
      const geom = format.readGeometry(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      expect(geom.getCoordinates()).to.eql(
        transform([1, 2], 'EPSG:4326', 'EPSG:3857')
      );
    });
  });

  describe('#writeGeometry()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const geom = new Point([1, 2]).transform('EPSG:4326', 'EPSG:3857');
      const wkt = format.writeGeometry(geom, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const got = format.readGeometry(wkt).getCoordinates();
      expect(got[0]).to.roughlyEqual(1, 1e-6);
      expect(got[1]).to.roughlyEqual(2, 1e-6);
    });
  });

  describe('#readFeature()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const wkt = 'POINT(1 2)';
      const feature = format.readFeature(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const geom = feature.getGeometry();
      expect(geom.getCoordinates()).to.eql(
        transform([1, 2], 'EPSG:4326', 'EPSG:3857')
      );
    });
  });

  describe('#writeFeature()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const feature = new Feature(
        new Point([1, 2]).transform('EPSG:4326', 'EPSG:3857')
      );
      const wkt = format.writeFeature(feature, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const gotFeature = format.readFeature(wkt);
      expect(gotFeature).to.be.a(Feature);
      const got = gotFeature.getGeometry().getCoordinates();
      expect(got[0]).to.roughlyEqual(1, 1e-6);
      expect(got[1]).to.roughlyEqual(2, 1e-6);
    });
  });

  describe('#readFeatures()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const wkt = 'GEOMETRYCOLLECTION(POINT(1 2),POINT(4 5))';
      const features = format.readFeatures(wkt, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      expect(features.length).to.eql(2);
      const point1 = features[0].getGeometry();
      const point2 = features[1].getGeometry();
      expect(point1.getType()).to.eql('Point');
      expect(point2.getType()).to.eql('Point');
      expect(point1.getCoordinates()).to.eql(
        transform([1, 2], 'EPSG:4326', 'EPSG:3857')
      );
      expect(point2.getCoordinates()).to.eql(
        transform([4, 5], 'EPSG:4326', 'EPSG:3857')
      );
    });
  });

  describe('#writeFeatures()', function () {
    it('transforms with dataProjection and featureProjection', function () {
      const features = [
        new Feature(new Point([1, 2]).transform('EPSG:4326', 'EPSG:3857')),
        new Feature(new Point([4, 5]).transform('EPSG:4326', 'EPSG:3857')),
      ];
      const wkt = format.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      const gotFeatures = format.readFeatures(wkt);
      expect(gotFeatures).to.have.length(2);
      expect(gotFeatures[0].getGeometry().getCoordinates()[0]).to.roughlyEqual(
        1,
        1e-6
      );
      expect(gotFeatures[0].getGeometry().getCoordinates()[1]).to.roughlyEqual(
        2,
        1e-6
      );
      expect(gotFeatures[1].getGeometry().getCoordinates()[0]).to.roughlyEqual(
        4,
        1e-6
      );
      expect(gotFeatures[1].getGeometry().getCoordinates()[1]).to.roughlyEqual(
        5,
        1e-6
      );
    });
  });

  it('Point read / written correctly', function () {
    let wkt = 'POINT(30 10)';
    let geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'POINT (30 10)';
    geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10]);
  });

  it('Point Z read / written correctly', function () {
    let wkt = 'POINT Z(30 10 5)';
    let geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10, 5]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'POINT Z (30 10 5)';
    geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10, 5]);
  });

  it('Point M read / written correctly', function () {
    let wkt = 'POINT M(30 10 5)';
    let geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10, 5]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'POINT M (30 10 5)';
    geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10, 5]);
  });

  it('Point ZM read / written correctly', function () {
    let wkt = 'POINT ZM(30 10 5 0.1)';
    let geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10, 5, 0.1]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'POINT ZM (30 10 5 0.1)';
    geom = format.readGeometry(wkt);
    expect(geom.getCoordinates()).to.eql([30, 10, 5, 0.1]);
  });

  it('MultiPoint read / written correctly', function () {
    // there are two forms to test
    let wkt = 'MULTIPOINT((10 40),(40 30),(20 20),(30 10))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40]);
    expect(points[1].getCoordinates()).to.eql([40, 30]);
    expect(points[2].getCoordinates()).to.eql([20, 20]);
    expect(points[3].getCoordinates()).to.eql([30, 10]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // this has whitespace
    wkt = 'MULTIPOINT (10 40, 40 30, 20 20, 30 10)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40]);
    expect(points[1].getCoordinates()).to.eql([40, 30]);
    expect(points[2].getCoordinates()).to.eql([20, 20]);
    expect(points[3].getCoordinates()).to.eql([30, 10]);
  });

  it('MultiPoint Z read / written correctly', function () {
    // there are two forms to test
    let wkt = 'MULTIPOINT Z((10 40 1),(40 30 2),(20 20 3),(30 10 4))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40, 1]);
    expect(points[1].getCoordinates()).to.eql([40, 30, 2]);
    expect(points[2].getCoordinates()).to.eql([20, 20, 3]);
    expect(points[3].getCoordinates()).to.eql([30, 10, 4]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // this has whitespace and no standardized parentheses
    wkt = 'MULTIPOINT Z (10 40 1, 40 30 2, 20 20 3, 30 10 4)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40, 1]);
    expect(points[1].getCoordinates()).to.eql([40, 30, 2]);
    expect(points[2].getCoordinates()).to.eql([20, 20, 3]);
    expect(points[3].getCoordinates()).to.eql([30, 10, 4]);
  });

  it('MultiPoint M read / written correctly', function () {
    // there are two forms to test
    let wkt = 'MULTIPOINT M((10 40 1),(40 30 2),(20 20 3),(30 10 4))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40, 1]);
    expect(points[1].getCoordinates()).to.eql([40, 30, 2]);
    expect(points[2].getCoordinates()).to.eql([20, 20, 3]);
    expect(points[3].getCoordinates()).to.eql([30, 10, 4]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // this has whitespace and no standardized parentheses
    wkt = 'MULTIPOINT M (10 40 1, 40 30 2, 20 20 3, 30 10 4)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40, 1]);
    expect(points[1].getCoordinates()).to.eql([40, 30, 2]);
    expect(points[2].getCoordinates()).to.eql([20, 20, 3]);
    expect(points[3].getCoordinates()).to.eql([30, 10, 4]);
  });

  it('MultiPoint ZM read / written correctly', function () {
    // there are two forms to test
    let wkt =
      'MULTIPOINT ZM((10 40 1 0.1),(40 30 2 0.1),(20 20 3 0.1),(30 10 4 0.1))';
    let geom = format.readGeometry(wkt);
    let points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40, 1, 0.1]);
    expect(points[1].getCoordinates()).to.eql([40, 30, 2, 0.1]);
    expect(points[2].getCoordinates()).to.eql([20, 20, 3, 0.1]);
    expect(points[3].getCoordinates()).to.eql([30, 10, 4, 0.1]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // this has whitespace and no standardized parentheses
    wkt = 'MULTIPOINT ZM (10 40 1 0.1,40 30 2 0.1,20 20 3 0.1,30 10 4 0.1)';
    geom = format.readGeometry(wkt);
    points = geom.getPoints();
    expect(points.length).to.eql(4);
    expect(points[0].getCoordinates()).to.eql([10, 40, 1, 0.1]);
    expect(points[1].getCoordinates()).to.eql([40, 30, 2, 0.1]);
    expect(points[2].getCoordinates()).to.eql([20, 20, 3, 0.1]);
    expect(points[3].getCoordinates()).to.eql([30, 10, 4, 0.1]);
  });

  it('LineString read / written correctly', function () {
    let wkt = 'LINESTRING(30 10,10 30,40 40)';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10],
      [10, 30],
      [40, 40],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'LINESTRING (30 10, 10 30, 40 40)';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10],
      [10, 30],
      [40, 40],
    ]);
  });

  it('LineString Z read / written correctly', function () {
    let wkt = 'LINESTRING Z(30 10 1,10 30 2,40 40 3)';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'LINESTRING Z (30 10 1, 10 30 2, 40 40 3)';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
  });

  it('LineString M read / written correctly', function () {
    let wkt = 'LINESTRING M(30 10 1,10 30 2,40 40 3)';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'LINESTRING M (30 10 1, 10 30 2, 40 40 3)';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 30, 2],
      [40, 40, 3],
    ]);
  });

  it('LineString ZM read / written correctly', function () {
    let wkt = 'LINESTRING ZM(30 10 1 0.1,10 30 2 0.1,40 40 3 0.1)';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10, 1, 0.1],
      [10, 30, 2, 0.1],
      [40, 40, 3, 0.1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'LINESTRING ZM (30 10 1 0.1, 10 30 2 0.1, 40 40 3 0.1)';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('LineString');
    expect(geom.getCoordinates()).to.eql([
      [30, 10, 1, 0.1],
      [10, 30, 2, 0.1],
      [40, 40, 3, 0.1],
    ]);
  });

  it('MultiLineString read / written correctly', function () {
    let wkt =
      'MULTILINESTRING((10 10,20 20,10 40),' + '(40 40,30 30,40 20,30 10))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    let linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10],
      [20, 20],
      [10, 40],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING ( (10 10, 20 20, 10 40), ' +
      '(40 40, 30 30, 40 20, 30 10) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10],
      [20, 20],
      [10, 40],
    ]);
  });

  it('MultiLineString Z read / written correctly', function () {
    let wkt =
      'MULTILINESTRING Z((10 10 1,20 20 2,10 40 3),' +
      '(40 40 1,30 30 2,40 20 3,30 10 4))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    let linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING Z ( (10 10 1, 20 20 2, 10 40 3), ' +
      '(40 40 1, 30 30 2, 40 20 3, 30 10 4) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
  });

  it('MultiLineString M read / written correctly', function () {
    let wkt =
      'MULTILINESTRING M((10 10 1,20 20 2,10 40 3),' +
      '(40 40 1,30 30 2,40 20 3,30 10 4))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    let linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING M ( (10 10 1, 20 20 2, 10 40 3), ' +
      '(40 40 1, 30 30 2, 40 20 3, 30 10 4) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10, 1],
      [20, 20, 2],
      [10, 40, 3],
    ]);
  });

  it('MultiLineString ZM read / written correctly', function () {
    let wkt =
      'MULTILINESTRING ZM((10 10 1 0.1,20 20 2 0.1,10 40 3 0.1),' +
      '(40 40 1 0.1,30 30 2 0.1,40 20 3 0.1,30 10 4 0.1))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    let linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10, 1, 0.1],
      [20, 20, 2, 0.1],
      [10, 40, 3, 0.1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt =
      'MULTILINESTRING ZM ( (10 10 1 0.1, 20 20 2 0.1, 10 40 3 0.1), ' +
      '(40 40 1 0.1, 30 30 2 0.1, 40 20 3 0.1, 30 10 4 0.1) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiLineString');
    linestrings = geom.getLineStrings();
    expect(linestrings.length).to.eql(2);
    expect(linestrings[0].getType()).to.eql('LineString');
    expect(linestrings[0].getCoordinates()).to.eql([
      [10, 10, 1, 0.1],
      [20, 20, 2, 0.1],
      [10, 40, 3, 0.1],
    ]);
  });

  it('Polygon read / written correctly', function () {
    let wkt = 'POLYGON((30 10,10 20,20 40,40 40,30 10))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    let rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10],
      [10, 20],
      [20, 40],
      [40, 40],
      [30, 10],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // note that WKT doesn't care about winding order, we do
    wkt = 'POLYGON((35 10,10 20,15 40,45 45,35 10),(20 30,30 20,35 35,20 30))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(2);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[1].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [35, 10],
      [10, 20],
      [15, 40],
      [45, 45],
      [35, 10],
    ]);
    expect(rings[1].getCoordinates()).to.eql([
      [20, 30],
      [30, 20],
      [35, 35],
      [20, 30],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'POLYGON ( (30 10, 10 20, 20 40, 40 40, 30 10) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10],
      [10, 20],
      [20, 40],
      [40, 40],
      [30, 10],
    ]);
  });

  it('Polygon Z read / written correctly', function () {
    let wkt = 'POLYGON Z((30 10 1,10 20 2,20 40 3,40 40 4,30 10 1))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    let rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // note that WKT doesn't care about winding order, we do
    wkt =
      'POLYGON Z((35 10 1,10 20 2,15 40 3,45 45 4,35 10 1),(20 30 1,30 20 2,35 35 3,20 30 1))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(2);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[1].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [35, 10, 1],
      [10, 20, 2],
      [15, 40, 3],
      [45, 45, 4],
      [35, 10, 1],
    ]);
    expect(rings[1].getCoordinates()).to.eql([
      [20, 30, 1],
      [30, 20, 2],
      [35, 35, 3],
      [20, 30, 1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'POLYGON  Z ( (30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 1) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
  });

  it('Polygon M read / written correctly', function () {
    let wkt = 'POLYGON M((30 10 1,10 20 2,20 40 3,40 40 4,30 10 1))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    let rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // note that WKT doesn't care about winding order, we do
    wkt =
      'POLYGON M((35 10 1,10 20 2,15 40 3,45 45 4,35 10 1),(20 30 1,30 20 2,35 35 3,20 30 1))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(2);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[1].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [35, 10, 1],
      [10, 20, 2],
      [15, 40, 3],
      [45, 45, 4],
      [35, 10, 1],
    ]);
    expect(rings[1].getCoordinates()).to.eql([
      [20, 30, 1],
      [30, 20, 2],
      [35, 35, 3],
      [20, 30, 1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt = 'POLYGON  M ( (30 10 1, 10 20 2, 20 40 3, 40 40 4, 30 10 1) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10, 1],
      [10, 20, 2],
      [20, 40, 3],
      [40, 40, 4],
      [30, 10, 1],
    ]);
  });

  it('Polygon ZM read / written correctly', function () {
    let wkt =
      'POLYGON ZM((30 10 1 0.1,10 20 2 0.1,20 40 3 0.1,40 40 4 0.1,30 10 1 0.1))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    let rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10, 1, 0.1],
      [10, 20, 2, 0.1],
      [20, 40, 3, 0.1],
      [40, 40, 4, 0.1],
      [30, 10, 1, 0.1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // note that WKT doesn't care about winding order, we do
    wkt =
      'POLYGON ZM((35 10 1 0.1,10 20 2 0.1,15 40 3 0.1,45 45 4 0.1,35 10 1 0.1),(20 30 1 0.1,30 20 2 0.1,35 35 3 0.1,20 30 1 0.1))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(2);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[1].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [35, 10, 1, 0.1],
      [10, 20, 2, 0.1],
      [15, 40, 3, 0.1],
      [45, 45, 4, 0.1],
      [35, 10, 1, 0.1],
    ]);
    expect(rings[1].getCoordinates()).to.eql([
      [20, 30, 1, 0.1],
      [30, 20, 2, 0.1],
      [35, 35, 3, 0.1],
      [20, 30, 1, 0.1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt =
      'POLYGON  ZM ( (30 10 1 0.1, 10 20 2 0.1, 20 40 3 0.1, 40 40 4 0.1, 30 10 1 0.1) )';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('Polygon');
    rings = geom.getLinearRings();
    expect(rings.length).to.eql(1);
    expect(rings[0].getType()).to.eql('LinearRing');
    expect(rings[0].getCoordinates()).to.eql([
      [30, 10, 1, 0.1],
      [10, 20, 2, 0.1],
      [20, 40, 3, 0.1],
      [40, 40, 4, 0.1],
      [30, 10, 1, 0.1],
    ]);
  });

  it('MultiPolygon read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON(((40 40,45 30,20 45,40 40)),' +
      '((20 35,45 20,30 5,10 10,10 30,20 35),(30 20,20 25,20 15,30 20)))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    let polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40],
      [45, 30],
      [20, 45],
      [40, 40],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35],
      [45, 20],
      [30, 5],
      [10, 10],
      [10, 30],
      [20, 35],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20],
      [20, 25],
      [20, 15],
      [30, 20],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON( ( ( 40 40,45 30, 20 45 ,40 40 )) ,' +
      '( (20 35, 45 20,30 5,10 10,10 30,20 35), ' +
      '( 30 20,  20 25,20 15  ,30 20 ) ))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40],
      [45, 30],
      [20, 45],
      [40, 40],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35],
      [45, 20],
      [30, 5],
      [10, 10],
      [10, 30],
      [20, 35],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20],
      [20, 25],
      [20, 15],
      [30, 20],
    ]);
  });

  it('MultiPolygon Z read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON Z(((40 40 1,45 30 2,20 45 3,40 40 1)),' +
      '((20 35 1,45 20 2,30 5 3,10 10 4,10 30 5,20 35 1),(30 20 1,20 25 2,20 15 3,30 20 1)))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    let polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON Z ( ( ( 40 40 1,45 30 2, 20 45 3 ,40 40 1 )) ,' +
      '( (20 35 1, 45 20 2,30 5 3,10 10 4,10 30 5,20 35 1), ' +
      '( 30 20 1,  20 25 2,20 15 3  ,30 20 1 ) ))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
  });

  it('MultiPolygon M read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON M(((40 40 1,45 30 2,20 45 3,40 40 1)),' +
      '((20 35 1,45 20 2,30 5 3,10 10 4,10 30 5,20 35 1),(30 20 1,20 25 2,20 15 3,30 20 1)))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    let polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON M ( ( ( 40 40 1,45 30 2, 20 45 3 ,40 40 1 )) ,' +
      '( (20 35 1, 45 20 2,30 5 3,10 10 4,10 30 5,20 35 1), ' +
      '( 30 20 1,  20 25 2,20 15 3  ,30 20 1 ) ))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40, 1],
      [45, 30, 2],
      [20, 45, 3],
      [40, 40, 1],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35, 1],
      [45, 20, 2],
      [30, 5, 3],
      [10, 10, 4],
      [10, 30, 5],
      [20, 35, 1],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20, 1],
      [20, 25, 2],
      [20, 15, 3],
      [30, 20, 1],
    ]);
  });

  it('MultiPolygon ZM read / written correctly', function () {
    // note that WKT doesn't care about winding order, we do
    let wkt =
      'MULTIPOLYGON ZM(((40 40 1 0.1,45 30 2 0.1,20 45 3 0.1,40 40 1 0.1)),' +
      '((20 35 1 0.1,45 20 2 0.1,30 5 3 0.1,10 10 4 0.1,10 30 5 0.1,20 35 1 0.1),(30 20 1 0.1,20 25 2 0.1,20 15 3 0.1,30 20 1 0.1)))';
    let geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    let polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40, 1, 0.1],
      [45, 30, 2, 0.1],
      [20, 45, 3, 0.1],
      [40, 40, 1, 0.1],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35, 1, 0.1],
      [45, 20, 2, 0.1],
      [30, 5, 3, 0.1],
      [10, 10, 4, 0.1],
      [10, 30, 5, 0.1],
      [20, 35, 1, 0.1],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20, 1, 0.1],
      [20, 25, 2, 0.1],
      [20, 15, 3, 0.1],
      [30, 20, 1, 0.1],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);

    // test whitespace when reading
    wkt =
      'MULTIPOLYGON ZM ( ( ( 40 40 1 0.1,45 30 2 0.1, 20 45 3 0.1 ,40 40 1  0.1 )) ,' +
      '( (20 35 1 0.1, 45 20 2 0.1,30 5 3 0.1,10 10 4 0.1,10 30 5 0.1,20 35 1 0.1), ' +
      '( 30 20 1 0.1,  20 25 2 0.1,20 15 3 0.1  ,30 20 1 0.1 ) ))';
    geom = format.readGeometry(wkt);
    expect(geom.getType()).to.eql('MultiPolygon');
    polygons = geom.getPolygons();
    expect(polygons.length).to.eql(2);
    expect(polygons[0].getType()).to.eql('Polygon');
    expect(polygons[1].getType()).to.eql('Polygon');
    expect(polygons[0].getLinearRings().length).to.eql(1);
    expect(polygons[1].getLinearRings().length).to.eql(2);
    expect(polygons[0].getLinearRings()[0].getCoordinates()).to.eql([
      [40, 40, 1, 0.1],
      [45, 30, 2, 0.1],
      [20, 45, 3, 0.1],
      [40, 40, 1, 0.1],
    ]);
    expect(polygons[1].getLinearRings()[0].getCoordinates()).to.eql([
      [20, 35, 1, 0.1],
      [45, 20, 2, 0.1],
      [30, 5, 3, 0.1],
      [10, 10, 4, 0.1],
      [10, 30, 5, 0.1],
      [20, 35, 1, 0.1],
    ]);
    expect(polygons[1].getLinearRings()[1].getCoordinates()).to.eql([
      [30, 20, 1, 0.1],
      [20, 25, 2, 0.1],
      [20, 15, 3, 0.1],
      [30, 20, 1, 0.1],
    ]);
  });

  it('Empty geometries read / written correctly', function () {
    const wkt = 'POINT EMPTY';
    const geom = format.readGeometry(wkt);
    const coordinates = geom.getCoordinates();
    expect(coordinates.length).to.be(2);
    expect(isNaN(coordinates[0])).to.be(true);
    expect(isNaN(coordinates[1])).to.be(true);
    const wkts = [
      'LINESTRING',
      'POLYGON',
      'MULTIPOINT',
      'MULTILINESTRING',
      'MULTIPOLYGON',
    ];
    for (let i = 0, ii = wkts.length; i < ii; ++i) {
      const wkt = wkts[i] + ' EMPTY';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([]);
      expect(format.writeGeometry(geom)).to.eql(wkt);
    }
  });

  it('Invalid geometries detected correctly', function () {
    expect(function () {
      format.readGeometry('POINT(1,2)');
    }).to.throwException();
    expect(function () {
      format.readGeometry('LINESTRING(1 2,3 4');
    }).to.throwException();
    expect(function () {
      format.readGeometry('POLYGON(1 2,3 4))');
    }).to.throwException();
    expect(function () {
      format.readGeometry('POLGON((1 2,3 4))');
    }).to.throwException();
    expect(function () {
      format.readGeometry('LINESTRING(1.2,3 4');
    }).to.throwException();
    expect(function () {
      format.readGeometry('MULTIPOINT((1 2),3 4))');
    }).to.throwException();
    expect(function () {
      format.readGeometry('MULTIPOLYGON((1 2,3 4))');
    }).to.throwException();
    expect(function () {
      format.readGeometry('GEOMETRYCOLLECTION(1 2,3 4)');
    }).to.throwException();
  });

  it('GeometryCollection read / written correctly', function () {
    let wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    let geom = format.readGeometry(wkt);
    let geoms = geom.getGeometries();
    expect(geoms.length).to.eql(2);
    expect(geom.getType()).to.eql('GeometryCollection');
    expect(geoms[0].getType()).to.eql('Point');
    expect(geoms[1].getType()).to.eql('LineString');
    expect(geoms[0].getCoordinates()).to.eql([4, 6]);
    expect(geoms[1].getCoordinates()).to.eql([
      [4, 6],
      [7, 10],
    ]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
    // test whitespace when reading
    wkt = 'GEOMETRYCOLLECTION ( POINT (4 6), LINESTRING (4 6, 7 10) )';
    geom = format.readGeometry(wkt);
    geoms = geom.getGeometries();
    expect(geoms.length).to.eql(2);
    expect(geom.getType()).to.eql('GeometryCollection');
    expect(geoms[0].getType()).to.eql('Point');
    expect(geoms[1].getType()).to.eql('LineString');
    expect(geoms[0].getCoordinates()).to.eql([4, 6]);
    expect(geoms[1].getCoordinates()).to.eql([
      [4, 6],
      [7, 10],
    ]);
  });

  it('Empty GeometryCollection read / written correctly', function () {
    const wkt = 'GEOMETRYCOLLECTION EMPTY';
    const geom = format.readGeometry(wkt);
    expect(geom.getGeometries()).to.eql([]);
    expect(format.writeGeometry(geom)).to.eql(wkt);
  });

  it('GeometryCollection split / merged correctly', function () {
    format = new WKT({splitCollection: true});
    const wkt = 'GEOMETRYCOLLECTION(POINT(4 6),LINESTRING(4 6,7 10))';
    const features = format.readFeatures(wkt);
    expect(features.length).to.eql(2);
    const geoms = [features[0].getGeometry(), features[1].getGeometry()];
    expect(geoms[0].getType()).to.eql('Point');
    expect(geoms[1].getType()).to.eql('LineString');
    expect(geoms[0].getCoordinates()).to.eql([4, 6]);
    expect(geoms[1].getCoordinates()).to.eql([
      [4, 6],
      [7, 10],
    ]);
    expect(format.writeFeatures(features)).to.eql(wkt);
  });

  it('Point feature read / written correctly', function () {
    const wkt = 'POINT(30 10)';
    const feature = format.readFeature(wkt);
    const geom = feature.getGeometry();
    expect(geom.getCoordinates()).to.eql([30, 10]);
    expect(format.writeFeature(feature)).to.eql(wkt);
  });

  it('Features read / written correctly', function () {
    const wkt = 'GEOMETRYCOLLECTION(POINT(1 2),POINT(3 4))';
    const features = format.readFeatures(wkt);
    expect(features.length).to.eql(2);
    const point1 = features[0].getGeometry();
    const point2 = features[1].getGeometry();
    expect(point1.getType()).to.eql('Point');
    expect(point2.getType()).to.eql('Point');
    expect(point1.getCoordinates()).to.eql([1, 2]);
    expect(point2.getCoordinates()).to.eql([3, 4]);
    expect(format.writeFeatures(features)).to.eql(wkt);
  });

  describe('scientific notation supported', function () {
    it('handles scientific notation correctly', function () {
      const wkt = 'POINT(3e1 1e1)';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([30, 10]);
      expect(format.writeGeometry(geom)).to.eql('POINT(30 10)');
    });

    it('works with with negative exponent', function () {
      const wkt = 'POINT(3e-1 1e-1)';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([0.3, 0.1]);
      expect(format.writeGeometry(geom)).to.eql('POINT(0.3 0.1)');
    });

    it('works with with explicitly positive exponent', function () {
      const wkt = 'POINT(3e+1 1e+1)';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([30, 10]);
      expect(format.writeGeometry(geom)).to.eql('POINT(30 10)');
    });

    it('handles very small numbers in scientific notation', function () {
      // very small numbers keep the scientific notation, both when reading and
      // writing
      const wkt = 'POINT(3e-9 1e-9)';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([3e-9, 1e-9]);
      expect(format.writeGeometry(geom)).to.eql('POINT(3e-9 1e-9)');
    });

    it('handles very big numbers in scientific notation', function () {
      // very big numbers keep the scientific notation, both when reading and
      // writing
      const wkt = 'POINT(3e25 1e25)';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([3e25, 1e25]);
      expect(format.writeGeometry(geom)).to.eql('POINT(3e+25 1e+25)');
    });

    it('works case insensitively (e / E)', function () {
      const wkt = 'POINT(3E1 1E1)';
      const geom = format.readGeometry(wkt);
      expect(geom.getCoordinates()).to.eql([30, 10]);
      expect(format.writeGeometry(geom)).to.eql('POINT(30 10)');
    });

    it('detects invalid scientific notation', function () {
      expect(function () {
        // note the double 'e'
        format.readGeometry('POINT(3ee1 10)');
      }).to.throwException();
    });
  });
});
