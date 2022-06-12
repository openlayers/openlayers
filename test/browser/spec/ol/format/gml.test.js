import Feature from '../../../../../src/ol/Feature.js';
import GML from '../../../../../src/ol/format/GML.js';
import GML2 from '../../../../../src/ol/format/GML2.js';
import GML32 from '../../../../../src/ol/format/GML32.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import LinearRing from '../../../../../src/ol/geom/LinearRing.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import MultiPoint from '../../../../../src/ol/geom/MultiPoint.js';
import MultiPolygon from '../../../../../src/ol/geom/MultiPolygon.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {createElementNS, parse} from '../../../../../src/ol/xml.js';
import {transform} from '../../../../../src/ol/proj.js';

const readGeometry = function (format, text, opt_options) {
  const doc = parse(text);
  // we need an intermediate node for testing purposes
  const node = document.createElement('pre');
  node.appendChild(doc.documentElement);
  return format.readGeometryFromNode(node, opt_options);
};

describe('ol.format.GML2', function () {
  let format;
  beforeEach(function () {
    format = new GML2({srsName: 'CRS:84'});
  });

  describe('#readFeatures', function () {
    let features;
    before(function (done) {
      const url = 'spec/ol/format/gml/osm-wfs-10.xml';
      afterLoadText(url, function (xml) {
        try {
          features = new GML2().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('reads all features', function () {
      expect(features.length).to.be(3);
    });
  });

  describe('#readGeometry', function () {
    describe('gml 2.1.2', function () {
      it('can read a point geometry', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:coordinates>-90,-180</gml:coordinates>' +
          '</gml:Point>';

        const g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([-180, -90, 0]);
      });

      it('can read a 3D point geometry', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:coordinates>-90,-180,42</gml:coordinates>' +
          '</gml:Point>';

        const g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([-180, -90, 42]);
      });

      it('can read a box element', function () {
        const text =
          '<gml:Box xmlns:gml="http://www.opengis.net/gml" ' +
          'srsName="EPSG:4326">' +
          '  <gml:coordinates>-0.768746,47.003018 ' +
          '    3.002191,47.925567</gml:coordinates>' +
          '</gml:Box>';

        const g = readGeometry(format, text);
        expect(g).to.eql([47.003018, -0.768746, 47.925567, 3.002191]);
      });

      it('can read a multipolygon with gml:coordinates', function () {
        const text =
          '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
          '        srsName="EPSG:4326">' +
          '  <gml:polygonMember>' +
          '    <gml:Polygon>' +
          '      <gml:outerBoundaryIs>' +
          '        <gml:LinearRing>' +
          '          <gml:coordinates>-0.318987,47.003018 ' +
          '             -0.768746,47.358268 ' +
          '             -0.574463,47.684285 -0.347374,47.854602 ' +
          '             -0.006740,47.925567 ' +
          '             0.135191,47.726864 0.149384,47.599127 ' +
          '             0.419052,47.670092 0.532597,47.428810 ' +
          '             0.305508,47.443003 0.475824,47.144948 ' +
          '             0.064225,47.201721 ' +
          '             -0.318987,47.003018 </gml:coordinates>' +
          '        </gml:LinearRing>' +
          '      </gml:outerBoundaryIs>' +
          '      <gml:innerBoundaryIs>' +
          '        <gml:LinearRing>' +
          '          <gml:coordinates>-0.035126,47.485582 ' +
          '             -0.035126,47.485582 ' +
          '             -0.049319,47.641706 -0.233829,47.655899 ' +
          '             -0.375760,47.457196 ' +
          '             -0.276408,47.286879 -0.035126,47.485582 ' +
          '          </gml:coordinates>' +
          '        </gml:LinearRing>' +
          '      </gml:innerBoundaryIs>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMember>' +
          '</gml:MultiPolygon>';

        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [47.003018, -0.318987, 0],
              [47.358268, -0.768746, 0],
              [47.684285, -0.574463, 0],
              [47.854602, -0.347374, 0],
              [47.925567, -0.00674, 0],
              [47.726864, 0.135191, 0],
              [47.599127, 0.149384, 0],
              [47.670092, 0.419052, 0],
              [47.42881, 0.532597, 0],
              [47.443003, 0.305508, 0],
              [47.144948, 0.475824, 0],
              [47.201721, 0.064225, 0],
              [47.003018, -0.318987, 0],
            ],
            [
              [47.485582, -0.035126, 0],
              [47.485582, -0.035126, 0],
              [47.641706, -0.049319, 0],
              [47.655899, -0.233829, 0],
              [47.457196, -0.37576, 0],
              [47.286879, -0.276408, 0],
              [47.485582, -0.035126, 0],
            ],
          ],
        ]);
      });
    });
  });

  describe('#writeFeatureElement', function () {
    let node;
    const featureNS = 'http://www.openlayers.org/';
    beforeEach(function () {
      node = createElementNS(featureNS, 'layer');
    });

    it('can serialize a LineString', function () {
      const expected =
        '<layer xmlns="http://www.openlayers.org/" fid="1">' +
        '  <geometry>' +
        '     <LineString xmlns="http://www.opengis.net/gml" ' +
        '                  srsName="EPSG:4326">' +
        '       <coordinates ' +
        '                     decimal="." cs="," ts=" ">' +
        '         2,1.1 4.2,3' +
        '       </coordinates>' +
        '      </LineString>' +
        '    </geometry>' +
        '  </layer>';

      const feature = new Feature({
        geometry: new LineString([
          [1.1, 2],
          [3, 4.2],
        ]),
      });
      feature.setId(1);
      const objectStack = [
        {
          featureNS: featureNS,
          srsName: 'EPSG:4326',
        },
      ];
      format.writeFeatureElement(node, feature, objectStack);

      expect(node).to.xmleql(parse(expected));
    });

    it('can serialize a Polygon', function () {
      const expected =
        '<layer xmlns="http://www.openlayers.org/" fid="1">' +
        '  <geometry>' +
        '     <Polygon xmlns="http://www.opengis.net/gml" ' +
        '                  srsName="EPSG:4326">' +
        '       <outerBoundaryIs>' +
        '         <LinearRing srsName="EPSG:4326">' +
        '           <coordinates ' +
        '                        decimal="." cs="," ts=" ">' +
        '              2,1.1 4.2,3 6,5.2' +
        '           </coordinates>' +
        '         </LinearRing>' +
        '       </outerBoundaryIs>' +
        '      </Polygon>' +
        '    </geometry>' +
        '  </layer>';

      const feature = new Feature({
        geometry: new Polygon([
          [
            [1.1, 2],
            [3, 4.2],
            [5.2, 6],
          ],
        ]),
      });
      feature.setId(1);
      const objectStack = [
        {
          featureNS: featureNS,
          srsName: 'EPSG:4326',
        },
      ];
      format.writeFeatureElement(node, feature, objectStack);

      expect(node).to.xmleql(parse(expected));
    });

    it('can serialize a Point', function () {
      const expected =
        '<layer xmlns="http://www.openlayers.org/" fid="1">' +
        '  <geometry>' +
        '     <Point xmlns="http://www.opengis.net/gml" ' +
        '            srsName="EPSG:4326">' +
        '       <coordinates ' +
        '                    decimal="." cs="," ts=" ">' +
        '              2,1.1' +
        '       </coordinates>' +
        '      </Point>' +
        '    </geometry>' +
        '  </layer>';

      const feature = new Feature({
        geometry: new Point([1.1, 2]),
      });
      feature.setId(1);
      const objectStack = [
        {
          featureNS: featureNS,
          srsName: 'EPSG:4326',
        },
      ];
      format.writeFeatureElement(node, feature, objectStack);

      expect(node).to.xmleql(parse(expected));
    });

    it('can serialize a Multi Point', function () {
      const expected =
        '<layer xmlns="http://www.openlayers.org/" fid="1">' +
        '  <geometry>' +
        '     <MultiPoint xmlns="http://www.opengis.net/gml" ' +
        '                 srsName="EPSG:4326">' +
        '       <pointMember>' +
        '         <Point srsName="EPSG:4326">' +
        '           <coordinates ' +
        '                    decimal="." cs="," ts=" ">' +
        '              2,1.1' +
        '           </coordinates>' +
        '         </Point>' +
        '       </pointMember>' +
        '      </MultiPoint>' +
        '    </geometry>' +
        '  </layer>';

      const feature = new Feature({
        geometry: new MultiPoint([[1.1, 2]]),
      });
      feature.setId(1);
      const objectStack = [
        {
          featureNS: featureNS,
          srsName: 'EPSG:4326',
        },
      ];
      format.writeFeatureElement(node, feature, objectStack);

      expect(node).to.xmleql(parse(expected));
    });

    it('can serialize a Multi Line String', function () {
      const expected =
        '<layer xmlns="http://www.openlayers.org/" fid="1">' +
        '  <geometry>' +
        '     <MultiLineString xmlns="http://www.opengis.net/gml" ' +
        '                 srsName="EPSG:4326">' +
        '       <lineStringMember>' +
        '         <LineString srsName="EPSG:4326">' +
        '           <coordinates ' +
        '                    decimal="." cs="," ts=" ">' +
        '              2,1.1 4.2,3' +
        '           </coordinates>' +
        '         </LineString>' +
        '       </lineStringMember>' +
        '      </MultiLineString>' +
        '    </geometry>' +
        '  </layer>';

      const feature = new Feature({
        geometry: new MultiLineString([
          [
            [1.1, 2],
            [3, 4.2],
          ],
        ]),
      });
      feature.setId(1);
      const objectStack = [
        {
          featureNS: featureNS,
          srsName: 'EPSG:4326',
        },
      ];
      format.writeFeatureElement(node, feature, objectStack);

      expect(node).to.xmleql(parse(expected));
    });

    it('can serialize a Multi Polygon', function () {
      const expected =
        '<layer xmlns="http://www.openlayers.org/" fid="1">' +
        '  <geometry>' +
        '     <MultiPolygon xmlns="http://www.opengis.net/gml" ' +
        '                 srsName="EPSG:4326">' +
        '       <polygonMember>' +
        '         <Polygon srsName="EPSG:4326">' +
        '           <outerBoundaryIs>' +
        '             <LinearRing srsName="EPSG:4326">' +
        '               <coordinates ' +
        '                        decimal="." cs="," ts=" ">' +
        '                  2,1.1 4.2,3 6,5.2' +
        '               </coordinates>' +
        '             </LinearRing>' +
        '           </outerBoundaryIs>' +
        '         </Polygon>' +
        '       </polygonMember>' +
        '      </MultiPolygon>' +
        '    </geometry>' +
        '  </layer>';

      const feature = new Feature({
        geometry: new MultiPolygon([
          [
            [
              [1.1, 2],
              [3, 4.2],
              [5.2, 6],
            ],
          ],
        ]),
      });
      feature.setId(1);
      const objectStack = [
        {
          featureNS: featureNS,
          srsName: 'EPSG:4326',
        },
      ];
      format.writeFeatureElement(node, feature, objectStack);

      expect(node).to.xmleql(parse(expected));
    });
  });
});

describe('ol.format.GML3', function () {
  let format, formatWGS84, formatNoSrs;
  beforeEach(function () {
    format = new GML({srsName: 'CRS:84'});
    formatWGS84 = new GML({
      srsName: 'urn:x-ogc:def:crs:EPSG:4326',
    });
    formatNoSrs = new GML();
  });

  describe('#readGeometry', function () {
    describe('point', function () {
      it('can read and write a point geometry', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos srsDimension="2">1 2</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a point geometry with scientific notation', function () {
        let text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1E7 2</gml:pos>' +
          '</gml:Point>';
        let g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([10000000, 2, 0]);
        text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1e7 2</gml:pos>' +
          '</gml:Point>';
        g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([10000000, 2, 0]);
      });

      it('can read, transform and write a point geometry', function () {
        const config = {
          featureProjection: 'EPSG:3857',
        };
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1 2</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(format, text, config);
        expect(g).to.be.an(Point);
        const coordinates = g.getCoordinates();
        expect(coordinates.splice(0, 2)).to.eql(
          transform([1, 2], 'CRS:84', 'EPSG:3857')
        );
        config.dataProjection = 'CRS:84';
        const serialized = format.writeGeometryNode(g, config);
        const pos = serialized.firstElementChild.firstElementChild.textContent;
        const coordinate = pos.split(' ');
        expect(coordinate[0]).to.roughlyEqual(1, 1e-9);
        expect(coordinate[1]).to.roughlyEqual(2, 1e-9);
      });

      it('can detect SRS, read and transform a point geometry', function () {
        const config = {
          featureProjection: 'EPSG:3857',
        };
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1 2</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(formatNoSrs, text, config);
        expect(g).to.be.an(Point);
        const coordinates = g.getCoordinates();
        expect(coordinates.splice(0, 2)).to.eql(
          transform([1, 2], 'CRS:84', 'EPSG:3857')
        );
      });

      it('can read and write a point geometry in EPSG:4326', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:pos srsDimension="2">2 1</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(formatWGS84, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
        const serialized = formatWGS84.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('linestring', function () {
      it('can read and write a linestring geometry', function () {
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:posList srsDimension="2">1 2 3 4</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read, transform and write a linestring geometry', function () {
        const config = {
          dataProjection: 'CRS:84',
          featureProjection: 'EPSG:3857',
        };
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:posList>1 2 3 4</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(format, text, config);
        expect(g).to.be.an(LineString);
        const coordinates = g.getCoordinates();
        expect(coordinates[0].slice(0, 2)).to.eql(
          transform([1, 2], 'CRS:84', 'EPSG:3857')
        );
        expect(coordinates[1].slice(0, 2)).to.eql(
          transform([3, 4], 'CRS:84', 'EPSG:3857')
        );
        const serialized = format.writeGeometryNode(g, config);
        const poss = serialized.firstElementChild.firstElementChild.textContent;
        const coordinate = poss.split(' ');
        expect(coordinate[0]).to.roughlyEqual(1, 1e-9);
        expect(coordinate[1]).to.roughlyEqual(2, 1e-9);
        expect(coordinate[2]).to.roughlyEqual(3, 1e-9);
        expect(coordinate[3]).to.roughlyEqual(4, 1e-9);
      });

      it('can read and write a linestring geometry in EPSG:4326', function () {
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:posList srsDimension="2">2 1 4 3</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(formatWGS84, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
        ]);
        const serialized = formatWGS84.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('axis order', function () {
      it(
        'can read and write a linestring geometry with ' + 'correct axis order',
        function () {
          const text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
            '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
            ' <gml:posList srsDimension="2">-90 -180 90 180</gml:posList>' +
            '</gml:LineString>';
          const g = readGeometry(format, text);
          expect(g).to.be.an(LineString);
          expect(g.getCoordinates()).to.eql([
            [-180, -90, 0],
            [180, 90, 0],
          ]);
          const serialized = formatWGS84.writeGeometryNode(g);
          expect(serialized.firstElementChild).to.xmleql(parse(text));
        }
      );

      it('can read and write a point geometry with correct axis order', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:pos srsDimension="2">-90 -180</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([-180, -90, 0]);
        const serialized = formatWGS84.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read and write a surface geometry with right axis order', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:surfaceMember>' +
          '    <gml:Polygon srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName=' +
          '          "urn:x-ogc:def:crs:EPSG:4326">' +
          '          <gml:posList srsDimension="2">' +
          '          38.9661 -77.0081 38.9931 -77.0421 ' +
          '          38.9321 -77.1221 38.9151 -77.0781 38.8861 ' +
          '          -77.0671 38.8621 -77.0391 38.8381 -77.0401 ' +
          '          38.8291 -77.0451 38.8131 -77.0351 38.7881 ' +
          '          -77.0451 38.8891 -76.9111 38.9661 -77.0081' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMember>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g.getCoordinates()[0][0][0][0]).to.equal(-77.0081);
        expect(g.getCoordinates()[0][0][0][1]).to.equal(38.9661);
        format = new GML({
          srsName: 'urn:x-ogc:def:crs:EPSG:4326',
          surface: false,
        });
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('linestring 3D', function () {
      it('can read a linestring 3D geometry', function () {
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84" srsDimension="3">' +
          '  <gml:posList>1 2 3 4 5 6</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 3],
          [4, 5, 6],
        ]);
      });
    });

    describe('linearring', function () {
      it('can read and write a linearring geometry', function () {
        const text =
          '<gml:LinearRing xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:posList srsDimension="2">1 2 3 4 5 6 1 2</gml:posList>' +
          '</gml:LinearRing>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LinearRing);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
          [5, 6, 0],
          [1, 2, 0],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('polygon', function () {
      it('can read and write a polygon geometry', function () {
        const text =
          '<gml:Polygon xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:exterior>' +
          '    <gml:LinearRing srsName="CRS:84">' +
          '     <gml:posList srsDimension="2">1 2 3 2 3 4 1 2</gml:posList>' +
          '    </gml:LinearRing>' +
          '  </gml:exterior>' +
          '  <gml:interior>' +
          '    <gml:LinearRing srsName="CRS:84">' +
          '     <gml:posList srsDimension="2">2 3 2 5 4 5 2 3</gml:posList>' +
          '    </gml:LinearRing>' +
          '  </gml:interior>' +
          '  <gml:interior>' +
          '    <gml:LinearRing srsName="CRS:84">' +
          '     <gml:posList srsDimension="2">3 4 3 6 5 6 3 4</gml:posList>' +
          '    </gml:LinearRing>' +
          '  </gml:interior>' +
          '</gml:Polygon>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Polygon);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [3, 2, 0],
            [3, 4, 0],
            [1, 2, 0],
          ],
          [
            [2, 3, 0],
            [2, 5, 0],
            [4, 5, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [3, 6, 0],
            [5, 6, 0],
            [3, 4, 0],
          ],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('surface', function () {
      it('can read and write a surface geometry', function () {
        const text =
          '<gml:Surface xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:patches>' +
          '    <gml:PolygonPatch>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            2 3 2 5 4 5 2 3' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            3 4 3 6 5 6 3 4' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:PolygonPatch>' +
          '  </gml:patches>' +
          '</gml:Surface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Polygon);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [3, 2, 0],
            [3, 4, 0],
            [1, 2, 0],
          ],
          [
            [2, 3, 0],
            [2, 5, 0],
            [4, 5, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [3, 6, 0],
            [5, 6, 0],
            [3, 4, 0],
          ],
        ]);
        format = new GML({srsName: 'CRS:84', surface: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('curve', function () {
      it('can read and write a curve geometry', function () {
        const text =
          '<gml:Curve xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:segments>' +
          '    <gml:LineStringSegment>' +
          '      <gml:posList srsDimension="2">1 2 3 4</gml:posList>' +
          '    </gml:LineStringSegment>' +
          '  </gml:segments>' +
          '</gml:Curve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
        ]);
        format = new GML({srsName: 'CRS:84', curve: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('envelope', function () {
      it('can read an envelope geometry', function () {
        const text =
          '<gml:Envelope xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:lowerCorner>1 2</gml:lowerCorner>' +
          '  <gml:upperCorner>3 4</gml:upperCorner>' +
          '</gml:Envelope>';
        const g = readGeometry(format, text);
        expect(g).to.eql([1, 2, 3, 4]);
      });
    });

    describe('multipoint', function () {
      it('can read and write a singular multipoint geometry', function () {
        const text =
          '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pointMember>' +
          '    <gml:Point srsName="CRS:84">' +
          '      <gml:pos srsDimension="2">1 2</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMember>' +
          '  <gml:pointMember>' +
          '    <gml:Point srsName="CRS:84">' +
          '      <gml:pos srsDimension="2">2 3</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMember>' +
          '  <gml:pointMember>' +
          '    <gml:Point srsName="CRS:84">' +
          '      <gml:pos srsDimension="2">3 4</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMember>' +
          '</gml:MultiPoint>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPoint);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [2, 3, 0],
          [3, 4, 0],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multipoint geometry', function () {
        const text =
          '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:pointMembers>' +
          '    <gml:Point>' +
          '      <gml:pos>1 2</gml:pos>' +
          '    </gml:Point>' +
          '    <gml:Point>' +
          '      <gml:pos>2 3</gml:pos>' +
          '    </gml:Point>' +
          '    <gml:Point>' +
          '      <gml:pos>3 4</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMembers>' +
          '</gml:MultiPoint>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPoint);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [2, 3, 0],
          [3, 4, 0],
        ]);
      });
    });

    describe('multilinestring', function () {
      it('can read and write a singular multilinestring geometry', function () {
        const text =
          '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:lineStringMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">1 2 2 3</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:lineStringMember>' +
          '  <gml:lineStringMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">3 4 4 5</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:lineStringMember>' +
          '</gml:MultiLineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
        format = new GML({srsName: 'CRS:84', multiCurve: false});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multilinestring geometry', function () {
        const text =
          '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:lineStringMembers>' +
          '    <gml:LineString>' +
          '      <gml:posList>1 2 2 3</gml:posList>' +
          '    </gml:LineString>' +
          '    <gml:LineString>' +
          '      <gml:posList>3 4 4 5</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:lineStringMembers>' +
          '</gml:MultiLineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
      });
    });

    describe('multipolygon', function () {
      it('can read and write a singular multipolygon geometry', function () {
        const text =
          '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:polygonMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            2 3 2 5 4 5 2 3' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            3 4 3 6 5 6 3 4' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMember>' +
          '  <gml:polygonMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMember>' +
          '</gml:MultiPolygon>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
        format = new GML({srsName: 'CRS:84', multiSurface: false});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multipolygon geometry', function () {
        const text =
          '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:polygonMembers>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMembers>' +
          '</gml:MultiPolygon>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
      });
    });

    describe('multicurve', function () {
      it('can read and write a singular multicurve-linestring geometry', function () {
        const text =
          '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:curveMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">1 2 2 3</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:curveMember>' +
          '  <gml:curveMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">3 4 4 5</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:curveMember>' +
          '</gml:MultiCurve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read and write a singular multicurve-curve geometry', function () {
        const text =
          '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:curveMember>' +
          '    <gml:Curve srsName="CRS:84">' +
          '      <gml:segments>' +
          '        <gml:LineStringSegment>' +
          '          <gml:posList srsDimension="2">1 2 2 3</gml:posList>' +
          '        </gml:LineStringSegment>' +
          '      </gml:segments>' +
          '    </gml:Curve>' +
          '  </gml:curveMember>' +
          '  <gml:curveMember>' +
          '    <gml:Curve srsName="CRS:84">' +
          '      <gml:segments>' +
          '        <gml:LineStringSegment>' +
          '          <gml:posList srsDimension="2">3 4 4 5</gml:posList>' +
          '        </gml:LineStringSegment>' +
          '      </gml:segments>' +
          '    </gml:Curve>' +
          '  </gml:curveMember>' +
          '</gml:MultiCurve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
        format = new GML({srsName: 'CRS:84', curve: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('multisurface', function () {
      it('can read and write a singular multisurface geometry', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:surfaceMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            2 3 2 5 4 5 2 3' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            3 4 3 6 5 6 3 4' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMember>' +
          '  <gml:surfaceMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMember>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multisurface geometry', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:surfaceMembers>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMembers>' +
          '  <gml:surfaceMembers>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMembers>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
      });

      it('can read and write a multisurface-surface geometry', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml" ' +
          '    srsName="CRS:84">' +
          '  <gml:surfaceMember>' +
          '    <gml:Surface srsName="CRS:84">' +
          '      <gml:patches>' +
          '        <gml:PolygonPatch>' +
          '          <gml:exterior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                1 2 3 2 3 4 1 2' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:exterior>' +
          '          <gml:interior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                2 3 2 5 4 5 2 3' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:interior>' +
          '          <gml:interior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                3 4 3 6 5 6 3 4' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:interior>' +
          '        </gml:PolygonPatch>' +
          '      </gml:patches>' +
          '    </gml:Surface>' +
          '  </gml:surfaceMember>' +
          '  <gml:surfaceMember>' +
          '    <gml:Surface srsName="CRS:84">' +
          '      <gml:patches>' +
          '        <gml:PolygonPatch>' +
          '          <gml:exterior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                1 2 3 2 3 4 1 2' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:exterior>' +
          '        </gml:PolygonPatch>' +
          '      </gml:patches>' +
          '    </gml:Surface>' +
          '  </gml:surfaceMember>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
        format = new GML({srsName: 'CRS:84', surface: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });
  });

  describe('when parsing empty attribute', function () {
    it('generates undefined value', function () {
      const text =
        '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml">' +
        '  <topp:gnis_pop gml:id="gnis_pop.148604" xmlns:topp="' +
        'http://www.openplans.org/topp">' +
        '    <gml:name>Aflu</gml:name>' +
        '    <topp:the_geom>' +
        '      <gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
        '        <gml:pos>34.12 2.09</gml:pos>' +
        '      </gml:Point>' +
        '    </topp:the_geom>' +
        '    <topp:population>84683</topp:population>' +
        '    <topp:country>Algeria</topp:country>' +
        '    <topp:type>place</topp:type>' +
        '    <topp:name>Aflu</topp:name>' +
        '    <topp:empty></topp:empty>' +
        '  </topp:gnis_pop>' +
        '</gml:featureMembers>';
      const config = {
        'featureNS': 'http://www.openplans.org/topp',
        'featureType': 'gnis_pop',
      };
      const features = new GML(config).readFeatures(text);
      const feature = features[0];
      expect(feature.get('empty')).to.be(undefined);
    });
  });

  describe('when parsing CDATA attribute', function () {
    let features;
    before(function (done) {
      try {
        const text =
          '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml">' +
          '  <topp:gnis_pop gml:id="gnis_pop.148604" xmlns:topp="' +
          'http://www.openplans.org/topp">' +
          '    <gml:name>Aflu</gml:name>' +
          '    <topp:the_geom>' +
          '      <gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '        <gml:pos>34.12 2.09</gml:pos>' +
          '      </gml:Point>' +
          '    </topp:the_geom>' +
          '    <topp:population>84683</topp:population>' +
          '    <topp:country>Algeria</topp:country>' +
          '    <topp:type>place</topp:type>' +
          '    <topp:name>Aflu</topp:name>' +
          '    <topp:cdata><![CDATA[<a>b</a>]]></topp:cdata>' +
          '  </topp:gnis_pop>' +
          '</gml:featureMembers>';
        const config = {
          'featureNS': 'http://www.openplans.org/topp',
          'featureType': 'gnis_pop',
        };
        features = new GML(config).readFeatures(text);
      } catch (e) {
        done(e);
      }
      done();
    });

    it('creates 1 feature', function () {
      expect(features).to.have.length(1);
    });

    it('converts XML attribute to text', function () {
      expect(features[0].get('cdata')).to.be('<a>b</a>');
    });
  });

  describe('when parsing TOPP states WFS with autoconfigure', function () {
    let features, gmlFormat;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/topp-states-wfs.xml', function (xml) {
        try {
          gmlFormat = new GML();
          features = gmlFormat.readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });

    it('creates the right id for the feature', function () {
      expect(features[0].getId()).to.equal('states.1');
    });

    it('can reuse the parser for a different featureNS', function () {
      const text =
        '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml">' +
        '  <foo:gnis_pop gml:id="gnis_pop.148604" xmlns:foo="' +
        'http://foo">' +
        '    <gml:name>Aflu</gml:name>' +
        '    <foo:the_geom>' +
        '      <gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
        '        <gml:pos>34.12 2.09</gml:pos>' +
        '      </gml:Point>' +
        '    </foo:the_geom>' +
        '    <foo:population>84683</foo:population>' +
        '  </foo:gnis_pop>' +
        '</gml:featureMembers>';
      features = gmlFormat.readFeatures(text);
      expect(features).to.have.length(1);
      expect(features[0].get('population')).to.equal('84683');
    });

    it('can read an empty collection', function () {
      const text =
        '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml">' +
        '</gml:featureMembers>';
      features = gmlFormat.readFeatures(text);
      expect(features).to.have.length(0);
    });
  });

  describe('when parsing TOPP states GML', function () {
    let features, text, gmlFormat;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/topp-states-gml.xml', function (xml) {
        try {
          const schemaLoc =
            'http://www.openplans.org/topp ' +
            'http://demo.opengeo.org/geoserver/wfs?service=WFS&version=' +
            '1.1.0&request=DescribeFeatureType&typeName=topp:states ' +
            'http://www.opengis.net/gml ' +
            'http://schemas.opengis.net/gml/3.2.1/gml.xsd';
          const config = {
            'featureNS': 'http://www.openplans.org/topp',
            'featureType': 'states',
            'multiSurface': true,
            'srsName': 'urn:x-ogc:def:crs:EPSG:4326',
            'schemaLocation': schemaLoc,
          };
          text = xml;
          gmlFormat = new GML(config);
          features = gmlFormat.readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 10 features', function () {
      expect(features).to.have.length(10);
    });

    it('creates the right id for the feature', function () {
      expect(features[0].getId()).to.equal('states.1');
    });

    it('writes back features as GML', function () {
      const serialized = gmlFormat.writeFeaturesNode(features);
      expect(serialized).to.xmleql(parse(text), {ignoreElementOrder: true});
    });
  });

  describe('when parsing TOPP states GML with multiple featureMember tags', function () {
    let features, gmlFormat;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/topp-states-gml-featureMember.xml',
        function (xml) {
          try {
            const schemaLoc =
              'http://www.openplans.org/topp ' +
              'http://demo.opengeo.org/geoserver/wfs?service=WFS&version=' +
              '1.1.0&request=DescribeFeatureType&typeName=topp:states ' +
              'http://www.opengis.net/gml ' +
              'http://schemas.opengis.net/gml/3.2.1/gml.xsd';
            const config = {
              'featureNS': 'http://www.openplans.org/topp',
              'featureType': 'states',
              'multiSurface': true,
              'srsName': 'urn:x-ogc:def:crs:EPSG:4326',
              'schemaLocation': schemaLoc,
            };
            gmlFormat = new GML(config);
            features = gmlFormat.readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });
  });

  describe('when parsing TOPP states GML from WFS', function () {
    let features, feature;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/topp-states-wfs.xml', function (xml) {
        try {
          const config = {
            'featureNS': 'http://www.openplans.org/topp',
            'featureType': 'states',
          };
          features = new GML(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });

    it('creates a polygon for Illinois', function () {
      feature = features[0];
      expect(feature.getId()).to.equal('states.1');
      expect(feature.get('STATE_NAME')).to.equal('Illinois');
      expect(feature.getGeometry()).to.be.an(MultiPolygon);
    });
  });

  describe('when parsing more than one geometry', function () {
    let features;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/more-geoms.xml', function (xml) {
        try {
          const config = {
            'featureNS': 'http://opengeo.org/#medford',
            'featureType': 'zoning',
          };
          features = new GML(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 2 geometries', function () {
      const feature = features[0];
      expect(feature.get('center')).to.be.a(Point);
      expect(feature.get('the_geom')).to.be.a(MultiPolygon);
    });
  });

  describe('when parsing an attribute name equal to featureType', function () {
    let features;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/repeated-name.xml', function (xml) {
        try {
          const config = {
            'featureNS': 'http://opengeo.org/#medford',
            'featureType': 'zoning',
          };
          features = new GML(config).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates the correct attribute value', function () {
      const feature = features[0];
      expect(feature.get('zoning')).to.equal('I-L');
    });
  });

  describe('when parsing only a boundedBy element and no geometry', function () {
    let features;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/only-boundedby.xml', function (xml) {
        try {
          features = new GML().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates a feature without a geometry', function () {
      const feature = features[0];
      expect(feature.getGeometry()).to.be(undefined);
    });
  });

  describe('when parsing from OGR', function () {
    let features;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/ogr.xml', function (xml) {
        try {
          features = new GML().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('reads all features', function () {
      expect(features.length).to.be(1);
    });
  });

  describe('when parsing multiple feature types', function () {
    let features;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames.xml',
        function (xml) {
          try {
            features = new GML({
              featureNS: 'http://localhost:8080/official',
              featureType: ['planet_osm_polygon', 'planet_osm_line'],
            }).readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features', function () {
      expect(features.length).to.be(12);
    });
  });

  describe('when parsing multiple feature types', function () {
    let features;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/multiple-typenames.xml',
        function (xml) {
          try {
            features = new GML().readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('reads all features with autoconfigure', function () {
      expect(features.length).to.be(12);
    });
  });

  describe('when parsing multiple feature types / namespaces', function () {
    let features;
    before(function (done) {
      const url = 'spec/ol/format/gml/multiple-typenames-ns.xml';
      afterLoadText(url, function (xml) {
        try {
          features = new GML({
            featureNS: {
              'topp': 'http://www.openplans.org/topp',
              'sf': 'http://www.openplans.org/spearfish',
            },
            featureType: ['topp:states', 'sf:roads'],
          }).readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('reads all features', function () {
      expect(features.length).to.be(2);
    });
  });

  describe('when parsing multiple feature types / namespaces', function () {
    let features;
    before(function (done) {
      const url = 'spec/ol/format/gml/multiple-typenames-ns.xml';
      afterLoadText(url, function (xml) {
        try {
          features = new GML().readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('reads all features with autoconfigure', function () {
      expect(features.length).to.be(2);
    });
  });

  describe('when parsing srsDimension from WFS (Geoserver)', function () {
    let features, feature;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/gml/geoserver3DFeatures.xml',
        function (xml) {
          try {
            const config = {
              'featureNS': 'http://www.opengeospatial.net/cite',
              'featureType': 'geoserver_layer',
            };
            features = new GML(config).readFeatures(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });

    it('creates a LineString', function () {
      feature = features[0];
      expect(feature.getId()).to.equal('geoserver_layer.1');
      expect(feature.getGeometry()).to.be.an(LineString);
    });

    it('creates a Polygon', function () {
      feature = features[1];
      expect(feature.getId()).to.equal('geoserver_layer.2');
      expect(feature.getGeometry()).to.be.an(Polygon);
    });

    it('creates a Point', function () {
      feature = features[2];
      expect(feature.getId()).to.equal('geoserver_layer.3');
      expect(feature.getGeometry()).to.be.an(Point);
    });

    it('creates 3D Features with the expected geometries', function () {
      const expectedGeometry1 = [
        4.46386854, 51.91122415, 46.04679351, 4.46382399, 51.91120839,
        46.04679382,
      ];
      const expectedGeometry2 = [
        4.46385491, 51.91119276, 46.06074531, 4.4638264, 51.91118582,
        46.06074609, 4.46380612, 51.91121772, 46.06074168, 4.46383463,
        51.91122465, 46.06074089, 4.46385491, 51.91119276, 46.06074531,
      ];
      const expectedGeometry3 = [4.46383715, 51.91125849, 46.04679348];

      feature = features[0];
      expect(feature.getGeometry().getFlatCoordinates()).to.eql(
        expectedGeometry1
      );
      feature = features[1];
      expect(feature.getGeometry().getFlatCoordinates()).to.eql(
        expectedGeometry2
      );
      feature = features[2];
      expect(feature.getGeometry().getFlatCoordinates()).to.eql(
        expectedGeometry3
      );
    });
  });

  describe('when parsing complex', function () {
    let features, gmlFormat;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/gml-complex.xml', function (xml) {
        try {
          gmlFormat = new GML();
          features = gmlFormat.readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 3 features', function () {
      expect(features).to.have.length(3);
    });

    it('creates feature with two names', function () {
      expect(features[0].values_['name']).to.have.length(2);
    });

    it('parses mutliple simple elements to strings', function () {
      expect(features[0].values_['name'][0]).to.be.a('string');
    });

    it('creates nested property', function () {
      expect(
        features[0].values_['observationMethod']['CGI_TermValue']['value'][
          '_content_'
        ]
      ).to.eql('urn:ogc:def:nil:OGC:missing');
    });

    it('creates nested attribute', function () {
      expect(
        features[0].values_['observationMethod']['CGI_TermValue']['value'][
          'codeSpace'
        ]
      ).to.eql('urn:ietf:rfc:2141');
    });
  });
});

describe('ol.format.GML32', function () {
  let format, formatWGS84, formatNoSrs;
  beforeEach(function () {
    format = new GML32({srsName: 'CRS:84'});
    formatWGS84 = new GML32({
      srsName: 'urn:x-ogc:def:crs:EPSG:4326',
    });
    formatNoSrs = new GML32();
  });

  describe('#readGeometry', function () {
    describe('point', function () {
      it('can read and write a point geometry', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos srsDimension="2">1 2</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a point geometry with scientific notation', function () {
        let text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1E7 2</gml:pos>' +
          '</gml:Point>';
        let g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([10000000, 2, 0]);
        text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1e7 2</gml:pos>' +
          '</gml:Point>';
        g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([10000000, 2, 0]);
      });

      it('can read, transform and write a point geometry', function () {
        const config = {
          featureProjection: 'EPSG:3857',
        };
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1 2</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(format, text, config);
        expect(g).to.be.an(Point);
        const coordinates = g.getCoordinates();
        expect(coordinates.splice(0, 2)).to.eql(
          transform([1, 2], 'CRS:84', 'EPSG:3857')
        );
        config.dataProjection = 'CRS:84';
        const serialized = format.writeGeometryNode(g, config);
        const pos = serialized.firstElementChild.firstElementChild.textContent;
        const coordinate = pos.split(' ');
        expect(coordinate[0]).to.roughlyEqual(1, 1e-9);
        expect(coordinate[1]).to.roughlyEqual(2, 1e-9);
      });

      it('can detect SRS, read and transform a point geometry', function () {
        const config = {
          featureProjection: 'EPSG:3857',
        };
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pos>1 2</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(formatNoSrs, text, config);
        expect(g).to.be.an(Point);
        const coordinates = g.getCoordinates();
        expect(coordinates.splice(0, 2)).to.eql(
          transform([1, 2], 'CRS:84', 'EPSG:3857')
        );
      });

      it('can read and write a point geometry in EPSG:4326', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:pos srsDimension="2">2 1</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(formatWGS84, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([1, 2, 0]);
        const serialized = formatWGS84.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('linestring', function () {
      it('can read and write a linestring geometry', function () {
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:posList srsDimension="2">1 2 3 4</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read, transform and write a linestring geometry', function () {
        const config = {
          dataProjection: 'CRS:84',
          featureProjection: 'EPSG:3857',
        };
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:posList>1 2 3 4</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(format, text, config);
        expect(g).to.be.an(LineString);
        const coordinates = g.getCoordinates();
        expect(coordinates[0].slice(0, 2)).to.eql(
          transform([1, 2], 'CRS:84', 'EPSG:3857')
        );
        expect(coordinates[1].slice(0, 2)).to.eql(
          transform([3, 4], 'CRS:84', 'EPSG:3857')
        );
        const serialized = format.writeGeometryNode(g, config);
        const poss = serialized.firstElementChild.firstElementChild.textContent;
        const coordinate = poss.split(' ');
        expect(coordinate[0]).to.roughlyEqual(1, 1e-9);
        expect(coordinate[1]).to.roughlyEqual(2, 1e-9);
        expect(coordinate[2]).to.roughlyEqual(3, 1e-9);
        expect(coordinate[3]).to.roughlyEqual(4, 1e-9);
      });

      it('can read and write a linestring geometry in EPSG:4326', function () {
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:posList srsDimension="2">2 1 4 3</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(formatWGS84, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
        ]);
        const serialized = formatWGS84.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('axis order', function () {
      it(
        'can read and write a linestring geometry with ' + 'correct axis order',
        function () {
          const text =
            '<gml:LineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
            '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
            ' <gml:posList srsDimension="2">-90 -180 90 180</gml:posList>' +
            '</gml:LineString>';
          const g = readGeometry(format, text);
          expect(g).to.be.an(LineString);
          expect(g.getCoordinates()).to.eql([
            [-180, -90, 0],
            [180, 90, 0],
          ]);
          const serialized = formatWGS84.writeGeometryNode(g);
          expect(serialized.firstElementChild).to.xmleql(parse(text));
        }
      );

      it('can read and write a point geometry with correct axis order', function () {
        const text =
          '<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:pos srsDimension="2">-90 -180</gml:pos>' +
          '</gml:Point>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Point);
        expect(g.getCoordinates()).to.eql([-180, -90, 0]);
        const serialized = formatWGS84.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read and write a surface geometry with right axis order', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '  <gml:surfaceMember>' +
          '    <gml:Polygon srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName=' +
          '          "urn:x-ogc:def:crs:EPSG:4326">' +
          '          <gml:posList srsDimension="2">' +
          '          38.9661 -77.0081 38.9931 -77.0421 ' +
          '          38.9321 -77.1221 38.9151 -77.0781 38.8861 ' +
          '          -77.0671 38.8621 -77.0391 38.8381 -77.0401 ' +
          '          38.8291 -77.0451 38.8131 -77.0351 38.7881 ' +
          '          -77.0451 38.8891 -76.9111 38.9661 -77.0081' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMember>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g.getCoordinates()[0][0][0][0]).to.equal(-77.0081);
        expect(g.getCoordinates()[0][0][0][1]).to.equal(38.9661);
        format = new GML32({
          srsName: 'urn:x-ogc:def:crs:EPSG:4326',
          surface: false,
        });
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('linestring 3D', function () {
      it('can read a linestring 3D geometry', function () {
        const text =
          '<gml:LineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84" srsDimension="3">' +
          '  <gml:posList>1 2 3 4 5 6</gml:posList>' +
          '</gml:LineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 3],
          [4, 5, 6],
        ]);
      });
    });

    describe('linearring', function () {
      it('can read and write a linearring geometry', function () {
        const text =
          '<gml:LinearRing xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:posList srsDimension="2">1 2 3 4 5 6 1 2</gml:posList>' +
          '</gml:LinearRing>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LinearRing);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
          [5, 6, 0],
          [1, 2, 0],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('polygon', function () {
      it('can read and write a polygon geometry', function () {
        const text =
          '<gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:exterior>' +
          '    <gml:LinearRing srsName="CRS:84">' +
          '     <gml:posList srsDimension="2">1 2 3 2 3 4 1 2</gml:posList>' +
          '    </gml:LinearRing>' +
          '  </gml:exterior>' +
          '  <gml:interior>' +
          '    <gml:LinearRing srsName="CRS:84">' +
          '     <gml:posList srsDimension="2">2 3 2 5 4 5 2 3</gml:posList>' +
          '    </gml:LinearRing>' +
          '  </gml:interior>' +
          '  <gml:interior>' +
          '    <gml:LinearRing srsName="CRS:84">' +
          '     <gml:posList srsDimension="2">3 4 3 6 5 6 3 4</gml:posList>' +
          '    </gml:LinearRing>' +
          '  </gml:interior>' +
          '</gml:Polygon>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Polygon);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [3, 2, 0],
            [3, 4, 0],
            [1, 2, 0],
          ],
          [
            [2, 3, 0],
            [2, 5, 0],
            [4, 5, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [3, 6, 0],
            [5, 6, 0],
            [3, 4, 0],
          ],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('surface', function () {
      it('can read and write a surface geometry', function () {
        const text =
          '<gml:Surface xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:patches>' +
          '    <gml:PolygonPatch>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            2 3 2 5 4 5 2 3' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            3 4 3 6 5 6 3 4' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:PolygonPatch>' +
          '  </gml:patches>' +
          '</gml:Surface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(Polygon);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [3, 2, 0],
            [3, 4, 0],
            [1, 2, 0],
          ],
          [
            [2, 3, 0],
            [2, 5, 0],
            [4, 5, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [3, 6, 0],
            [5, 6, 0],
            [3, 4, 0],
          ],
        ]);
        format = new GML32({srsName: 'CRS:84', surface: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('curve', function () {
      it('can read and write a curve geometry', function () {
        const text =
          '<gml:Curve xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:segments>' +
          '    <gml:LineStringSegment>' +
          '      <gml:posList srsDimension="2">1 2 3 4</gml:posList>' +
          '    </gml:LineStringSegment>' +
          '  </gml:segments>' +
          '</gml:Curve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
        ]);
        format = new GML32({srsName: 'CRS:84', curve: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read and write a curve geometry', function () {
        const text =
          '<gml:Curve xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:segments>' +
          '    <gml:LineStringSegment>' +
          '      <gml:posList srsDimension="2">1 2 3 4</gml:posList>' +
          '    </gml:LineStringSegment>' +
          '    <gml:LineStringSegment>' +
          '      <gml:posList srsDimension="2">5 6 7 8</gml:posList>' +
          '    </gml:LineStringSegment>' +
          '  </gml:segments>' +
          '</gml:Curve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(LineString);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [3, 4, 0],
          [5, 6, 0],
          [7, 8, 0],
        ]);
        format = new GML32({srsName: 'CRS:84', curve: true});
        const serialized = format.writeGeometryNode(g);
        // Conversion back to GML is not lossless, because we don't know
        // the mapping of original LineString segements to the OpenLayers
        // LineString geometry's coordinates.
        const expected =
          '<gml:Curve xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:segments>' +
          '    <gml:LineStringSegment>' +
          '      <gml:posList srsDimension="2">1 2 3 4 5 6 7 8</gml:posList>' +
          '    </gml:LineStringSegment>' +
          '  </gml:segments>' +
          '</gml:Curve>';
        expect(serialized.firstElementChild).to.xmleql(parse(expected));
      });

      it('can read a polygon with a ring of curves', function () {
        const text = `
        <gml:Polygon xmlns:gml="http://www.opengis.net/gml/3.2" srsName="CRS:84">
          <gml:exterior>
            <gml:Ring>
              <gml:curveMember>
                <gml:Curve>
                  <gml:segments>
                    <gml:LineStringSegment interpolation="linear">
                      <gml:posList>1 2 3 4</gml:posList>
                    </gml:LineStringSegment>
                    <gml:LineStringSegment interpolation="linear">
                      <gml:posList>5 6 7 8</gml:posList>
                    </gml:LineStringSegment>
                  </gml:segments>
                </gml:Curve>
              </gml:curveMember>
            </gml:Ring>
          </gml:exterior>
        </gml:Polygon>
        `;
        const g = readGeometry(format, text);
        expect(g).to.be.an(Polygon);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [3, 4, 0],
            [5, 6, 0],
            [7, 8, 0],
          ],
        ]);
      });
    });

    describe('envelope', function () {
      it('can read an envelope geometry', function () {
        const text =
          '<gml:Envelope xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:lowerCorner>1 2</gml:lowerCorner>' +
          '  <gml:upperCorner>3 4</gml:upperCorner>' +
          '</gml:Envelope>';
        const g = readGeometry(format, text);
        expect(g).to.eql([1, 2, 3, 4]);
      });
    });

    describe('multipoint', function () {
      it('can read and write a singular multipoint geometry', function () {
        const text =
          '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pointMember>' +
          '    <gml:Point srsName="CRS:84">' +
          '      <gml:pos srsDimension="2">1 2</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMember>' +
          '  <gml:pointMember>' +
          '    <gml:Point srsName="CRS:84">' +
          '      <gml:pos srsDimension="2">2 3</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMember>' +
          '  <gml:pointMember>' +
          '    <gml:Point srsName="CRS:84">' +
          '      <gml:pos srsDimension="2">3 4</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMember>' +
          '</gml:MultiPoint>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPoint);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [2, 3, 0],
          [3, 4, 0],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multipoint geometry', function () {
        const text =
          '<gml:MultiPoint xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:pointMembers>' +
          '    <gml:Point>' +
          '      <gml:pos>1 2</gml:pos>' +
          '    </gml:Point>' +
          '    <gml:Point>' +
          '      <gml:pos>2 3</gml:pos>' +
          '    </gml:Point>' +
          '    <gml:Point>' +
          '      <gml:pos>3 4</gml:pos>' +
          '    </gml:Point>' +
          '  </gml:pointMembers>' +
          '</gml:MultiPoint>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPoint);
        expect(g.getCoordinates()).to.eql([
          [1, 2, 0],
          [2, 3, 0],
          [3, 4, 0],
        ]);
      });
    });

    describe('multilinestring', function () {
      it('can read and write a singular multilinestring geometry', function () {
        const text =
          '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:lineStringMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">1 2 2 3</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:lineStringMember>' +
          '  <gml:lineStringMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">3 4 4 5</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:lineStringMember>' +
          '</gml:MultiLineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
        format = new GML32({srsName: 'CRS:84', multiCurve: false});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multilinestring geometry', function () {
        const text =
          '<gml:MultiLineString xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:lineStringMembers>' +
          '    <gml:LineString>' +
          '      <gml:posList>1 2 2 3</gml:posList>' +
          '    </gml:LineString>' +
          '    <gml:LineString>' +
          '      <gml:posList>3 4 4 5</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:lineStringMembers>' +
          '</gml:MultiLineString>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
      });
    });

    describe('multipolygon', function () {
      it('can read and write a singular multipolygon geometry', function () {
        const text =
          '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:polygonMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            2 3 2 5 4 5 2 3' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            3 4 3 6 5 6 3 4' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMember>' +
          '  <gml:polygonMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMember>' +
          '</gml:MultiPolygon>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
        format = new GML32({srsName: 'CRS:84', multiSurface: false});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multipolygon geometry', function () {
        const text =
          '<gml:MultiPolygon xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:polygonMembers>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:polygonMembers>' +
          '</gml:MultiPolygon>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
      });
    });

    describe('multicurve', function () {
      it('can read and write a singular multicurve-linestring geometry', function () {
        const text =
          '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:curveMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">1 2 2 3</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:curveMember>' +
          '  <gml:curveMember>' +
          '    <gml:LineString srsName="CRS:84">' +
          '      <gml:posList srsDimension="2">3 4 4 5</gml:posList>' +
          '    </gml:LineString>' +
          '  </gml:curveMember>' +
          '</gml:MultiCurve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read and write a singular multicurve-curve geometry', function () {
        const text =
          '<gml:MultiCurve xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:curveMember>' +
          '    <gml:Curve srsName="CRS:84">' +
          '      <gml:segments>' +
          '        <gml:LineStringSegment>' +
          '          <gml:posList srsDimension="2">1 2 2 3</gml:posList>' +
          '        </gml:LineStringSegment>' +
          '      </gml:segments>' +
          '    </gml:Curve>' +
          '  </gml:curveMember>' +
          '  <gml:curveMember>' +
          '    <gml:Curve srsName="CRS:84">' +
          '      <gml:segments>' +
          '        <gml:LineStringSegment>' +
          '          <gml:posList srsDimension="2">3 4 4 5</gml:posList>' +
          '        </gml:LineStringSegment>' +
          '      </gml:segments>' +
          '    </gml:Curve>' +
          '  </gml:curveMember>' +
          '</gml:MultiCurve>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiLineString);
        expect(g.getCoordinates()).to.eql([
          [
            [1, 2, 0],
            [2, 3, 0],
          ],
          [
            [3, 4, 0],
            [4, 5, 0],
          ],
        ]);
        format = new GML32({srsName: 'CRS:84', curve: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });

    describe('multisurface', function () {
      it('can read and write a singular multisurface geometry', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:surfaceMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            2 3 2 5 4 5 2 3' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            3 4 3 6 5 6 3 4' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMember>' +
          '  <gml:surfaceMember>' +
          '    <gml:Polygon srsName="CRS:84">' +
          '      <gml:exterior>' +
          '        <gml:LinearRing srsName="CRS:84">' +
          '          <gml:posList srsDimension="2">' +
          '            1 2 3 2 3 4 1 2' +
          '          </gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMember>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });

      it('can read a plural multisurface geometry', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:surfaceMembers>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>2 3 2 5 4 5 2 3</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '      <gml:interior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>3 4 3 6 5 6 3 4</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:interior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMembers>' +
          '  <gml:surfaceMembers>' +
          '    <gml:Polygon>' +
          '      <gml:exterior>' +
          '        <gml:LinearRing>' +
          '          <gml:posList>1 2 3 2 3 4 1 2</gml:posList>' +
          '        </gml:LinearRing>' +
          '      </gml:exterior>' +
          '    </gml:Polygon>' +
          '  </gml:surfaceMembers>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
      });

      it('can read and write a multisurface-surface geometry', function () {
        const text =
          '<gml:MultiSurface xmlns:gml="http://www.opengis.net/gml/3.2" ' +
          '    srsName="CRS:84">' +
          '  <gml:surfaceMember>' +
          '    <gml:Surface srsName="CRS:84">' +
          '      <gml:patches>' +
          '        <gml:PolygonPatch>' +
          '          <gml:exterior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                1 2 3 2 3 4 1 2' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:exterior>' +
          '          <gml:interior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                2 3 2 5 4 5 2 3' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:interior>' +
          '          <gml:interior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                3 4 3 6 5 6 3 4' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:interior>' +
          '        </gml:PolygonPatch>' +
          '      </gml:patches>' +
          '    </gml:Surface>' +
          '  </gml:surfaceMember>' +
          '  <gml:surfaceMember>' +
          '    <gml:Surface srsName="CRS:84">' +
          '      <gml:patches>' +
          '        <gml:PolygonPatch>' +
          '          <gml:exterior>' +
          '            <gml:LinearRing srsName="CRS:84">' +
          '              <gml:posList srsDimension="2">' +
          '                1 2 3 2 3 4 1 2' +
          '              </gml:posList>' +
          '            </gml:LinearRing>' +
          '          </gml:exterior>' +
          '        </gml:PolygonPatch>' +
          '      </gml:patches>' +
          '    </gml:Surface>' +
          '  </gml:surfaceMember>' +
          '</gml:MultiSurface>';
        const g = readGeometry(format, text);
        expect(g).to.be.an(MultiPolygon);
        expect(g.getCoordinates()).to.eql([
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
            [
              [2, 3, 0],
              [2, 5, 0],
              [4, 5, 0],
              [2, 3, 0],
            ],
            [
              [3, 4, 0],
              [3, 6, 0],
              [5, 6, 0],
              [3, 4, 0],
            ],
          ],
          [
            [
              [1, 2, 0],
              [3, 2, 0],
              [3, 4, 0],
              [1, 2, 0],
            ],
          ],
        ]);
        format = new GML32({srsName: 'CRS:84', surface: true});
        const serialized = format.writeGeometryNode(g);
        expect(serialized.firstElementChild).to.xmleql(parse(text));
      });
    });
  });

  describe('when parsing empty attribute', function () {
    it('generates undefined value', function () {
      const text =
        '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml/3.2">' +
        '  <topp:gnis_pop gml:id="gnis_pop.148604" xmlns:topp="' +
        'http://www.openplans.org/topp">' +
        '    <gml:name>Aflu</gml:name>' +
        '    <topp:the_geom>' +
        '      <gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
        '        <gml:pos>34.12 2.09</gml:pos>' +
        '      </gml:Point>' +
        '    </topp:the_geom>' +
        '    <topp:population>84683</topp:population>' +
        '    <topp:country>Algeria</topp:country>' +
        '    <topp:type>place</topp:type>' +
        '    <topp:name>Aflu</topp:name>' +
        '    <topp:empty></topp:empty>' +
        '  </topp:gnis_pop>' +
        '</gml:featureMembers>';
      const config = {
        'featureNS': 'http://www.openplans.org/topp',
        'featureType': 'gnis_pop',
      };
      const features = new GML32(config).readFeatures(text);
      const feature = features[0];
      expect(feature.get('empty')).to.be(undefined);
    });
  });

  describe('when parsing CDATA attribute', function () {
    let features;
    before(function (done) {
      try {
        const text =
          '<gml:featureMembers xmlns:gml="http://www.opengis.net/gml/3.2">' +
          '  <topp:gnis_pop gml:id="gnis_pop.148604" xmlns:topp="' +
          'http://www.openplans.org/topp">' +
          '    <gml:name>Aflu</gml:name>' +
          '    <topp:the_geom>' +
          '      <gml:Point srsName="urn:x-ogc:def:crs:EPSG:4326">' +
          '        <gml:pos>34.12 2.09</gml:pos>' +
          '      </gml:Point>' +
          '    </topp:the_geom>' +
          '    <topp:population>84683</topp:population>' +
          '    <topp:country>Algeria</topp:country>' +
          '    <topp:type>place</topp:type>' +
          '    <topp:name>Aflu</topp:name>' +
          '    <topp:cdata><![CDATA[<a>b</a>]]></topp:cdata>' +
          '  </topp:gnis_pop>' +
          '</gml:featureMembers>';
        const config = {
          'featureNS': 'http://www.openplans.org/topp',
          'featureType': 'gnis_pop',
        };
        features = new GML32(config).readFeatures(text);
      } catch (e) {
        done(e);
      }
      done();
    });

    it('creates 1 feature', function () {
      expect(features).to.have.length(1);
    });

    it('converts XML attribute to text', function () {
      expect(features[0].get('cdata')).to.be('<a>b</a>');
    });
  });

  describe('when parsing multiple complex attributes', function () {
    let features;
    let gmlFormat;
    before(function (done) {
      afterLoadText('spec/ol/format/gml/gml32-complex.xml', function (xml) {
        try {
          gmlFormat = new GML32();
          features = gmlFormat.readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 2 features', function () {
      expect(features).to.have.length(2);
    });

    it('creates feature with three attributeA properties and two attributeB properties', function () {
      expect(features[0].values_['attributeA']).to.have.length(3);
      expect(features[0].values_['attributeB']).to.have.length(2);
    });

    it('parses mutliple complex elements to an array of objects', function () {
      expect(features[0].values_['attributeA'][0]).to.be.a('object');
    });

    it('correctly structures multiple elements with attributes', function () {
      expect(features[0].values_['attributeA'][0]['xlink:href']).to.be(
        'http://www.example.com/extern/1'
      );
      expect(features[0].values_['attributeA'][0]._content_).to.be(undefined);
      expect(features[0].values_['attributeA'][1]['xlink:href']).to.be(
        'http://www.example.com/extern/2'
      );
      expect(features[0].values_['attributeA'][2]._content_).to.be(undefined);
    });

    it('correctly structures multiple elements with complex content', function () {
      expect(features[0].values_['attributeB'][0].Attribute.value).to.be('foo');
      expect(features[0].values_['attributeB'][1].Attribute.value).to.be('bar');
    });
  });
});
