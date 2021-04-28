import Feature from '../../../../../src/ol/Feature.js';
import GPX from '../../../../../src/ol/format/GPX.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {get as getProjection, transform} from '../../../../../src/ol/proj.js';
import {parse} from '../../../../../src/ol/xml.js';

describe('ol.format.GPX', function () {
  let format;
  beforeEach(function () {
    format = new GPX();
  });

  describe('#readProjection', function () {
    it('returns the default projection from document', function () {
      const projection = format.readProjectionFromDocument();
      expect(projection).to.eql(getProjection('EPSG:4326'));
    });

    it('returns the default projection from node', function () {
      const projection = format.readProjectionFromNode();
      expect(projection).to.eql(getProjection('EPSG:4326'));
    });
  });

  describe('rte', function () {
    it('can read an empty rte', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <rte/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(LineString);
      expect(g.getCoordinates()).to.eql([]);
      expect(g.getLayout()).to.be('XY');
    });

    it('can read and write various rte attributes', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <rte>' +
        '    <name>Name</name>' +
        '    <cmt>Comment</cmt>' +
        '    <desc>Description</desc>' +
        '    <src>Source</src>' +
        '    <link href="http://example.com/">' +
        '      <text>Link text</text>' +
        '      <type>Link type</type>' +
        '    </link>' +
        '    <number>1</number>' +
        '    <type>Type</type>' +
        '  </rte>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      expect(f.get('name')).to.be('Name');
      expect(f.get('cmt')).to.be('Comment');
      expect(f.get('desc')).to.be('Description');
      expect(f.get('src')).to.be('Source');
      expect(f.get('link')).to.be('http://example.com/');
      expect(f.get('linkText')).to.be('Link text');
      expect(f.get('linkType')).to.be('Link type');
      expect(f.get('number')).to.be(1);
      expect(f.get('type')).to.be('Type');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write a rte with multiple rtepts', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <rte>' +
        '    <rtept lat="1" lon="2"/>' +
        '    <rtept lat="3" lon="4"/>' +
        '  </rte>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(LineString);
      expect(g.getCoordinates()).to.eql([
        [2, 1],
        [4, 3],
      ]);
      expect(g.getLayout()).to.be('XY');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can transform, read and write a rte', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <rte>' +
        '    <rtept lat="1" lon="2"/>' +
        '    <rtept lat="5" lon="6"/>' +
        '  </rte>' +
        '</gpx>';
      const fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857',
      });
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(LineString);
      const p1 = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      const p2 = transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      expect(g.getCoordinates()).to.eql([p1, p2]);
      expect(g.getLayout()).to.be('XY');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857',
      });
      expect(serialized).to.xmleql(parse(text));
    });

    it('does not write rte attributes in rtepts', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <rte>' +
        '    <name>Name</name>' +
        '    <rtept lat="1" lon="2"/>' +
        '    <rtept lat="3" lon="4"/>' +
        '  </rte>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('trk', function () {
    it('can read an empty trk', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <trk/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(MultiLineString);
      expect(g.getCoordinates()).to.eql([]);
      expect(g.getLayout()).to.be('XY');
    });

    it('can read and write various trk attributes', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <trk>' +
        '    <name>Name</name>' +
        '    <cmt>Comment</cmt>' +
        '    <desc>Description</desc>' +
        '    <src>Source</src>' +
        '    <link href="http://example.com/">' +
        '      <text>Link text</text>' +
        '      <type>Link type</type>' +
        '    </link>' +
        '    <number>1</number>' +
        '    <type>Type</type>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      expect(f.get('name')).to.be('Name');
      expect(f.get('cmt')).to.be('Comment');
      expect(f.get('desc')).to.be('Description');
      expect(f.get('src')).to.be('Source');
      expect(f.get('link')).to.be('http://example.com/');
      expect(f.get('linkText')).to.be('Link text');
      expect(f.get('linkType')).to.be('Link type');
      expect(f.get('number')).to.be(1);
      expect(f.get('type')).to.be('Type');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write a trk with an empty trkseg', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <trk>' +
        '    <trkseg/>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(MultiLineString);
      expect(g.getCoordinates()).to.eql([[]]);
      expect(g.getLayout()).to.be('XY');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read/write a trk with a trkseg with multiple trkpts', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <trk>' +
        '    <trkseg>' +
        '      <trkpt lat="1" lon="2">' +
        '        <ele>3</ele>' +
        '        <time>2010-01-10T09:29:12Z</time>' +
        '      </trkpt>' +
        '      <trkpt lat="5" lon="6">' +
        '        <ele>7</ele>' +
        '        <time>2010-01-10T09:30:12Z</time>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(MultiLineString);
      expect(g.getCoordinates()).to.eql([
        [
          [2, 1, 3, 1263115752],
          [6, 5, 7, 1263115812],
        ],
      ]);
      expect(g.getLayout()).to.be('XYZM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can transform, read and write a trk with a trkseg', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <trk>' +
        '    <trkseg>' +
        '      <trkpt lat="1" lon="2">' +
        '        <ele>3</ele>' +
        '        <time>2010-01-10T09:29:12Z</time>' +
        '      </trkpt>' +
        '      <trkpt lat="5" lon="6">' +
        '        <ele>7</ele>' +
        '        <time>2010-01-10T09:30:12Z</time>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857',
      });
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(MultiLineString);
      const p1 = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      p1.push(3, 1263115752);
      const p2 = transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      p2.push(7, 1263115812);
      expect(g.getCoordinates()).to.eql([[p1, p2]]);
      expect(g.getLayout()).to.be('XYZM');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857',
      });
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write a trk with multiple trksegs', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <trk>' +
        '    <trkseg>' +
        '      <trkpt lat="1" lon="2">' +
        '        <ele>3</ele>' +
        '        <time>2010-01-10T09:29:12Z</time>' +
        '      </trkpt>' +
        '      <trkpt lat="5" lon="6">' +
        '        <ele>7</ele>' +
        '        <time>2010-01-10T09:30:12Z</time>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '    <trkseg>' +
        '      <trkpt lat="8" lon="9">' +
        '        <ele>10</ele>' +
        '        <time>2010-01-10T09:31:12Z</time>' +
        '      </trkpt>' +
        '      <trkpt lat="11" lon="12">' +
        '        <ele>13</ele>' +
        '        <time>2010-01-10T09:32:12Z</time>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(MultiLineString);
      expect(g.getCoordinates()).to.eql([
        [
          [2, 1, 3, 1263115752],
          [6, 5, 7, 1263115812],
        ],
        [
          [9, 8, 10, 1263115872],
          [12, 11, 13, 1263115932],
        ],
      ]);
      expect(g.getLayout()).to.be('XYZM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('does not write trk attributes in trkpts', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <trk>' +
        '    <name>Name</name>' +
        '    <trkseg>' +
        '      <trkpt lat="1" lon="2">' +
        '        <ele>3</ele>' +
        '        <time>2010-01-10T09:29:12Z</time>' +
        '      </trkpt>' +
        '      <trkpt lat="5" lon="6">' +
        '        <ele>7</ele>' +
        '        <time>2010-01-10T09:30:12Z</time>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '    <trkseg>' +
        '      <trkpt lat="8" lon="9">' +
        '        <ele>10</ele>' +
        '        <time>2010-01-10T09:31:12Z</time>' +
        '      </trkpt>' +
        '      <trkpt lat="11" lon="12">' +
        '        <ele>13</ele>' +
        '        <time>2010-01-10T09:32:12Z</time>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('wpt', function () {
    it('can read and write a wpt', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <wpt lat="1" lon="2"/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(Point);
      expect(g.getCoordinates()).to.eql([2, 1]);
      expect(g.getLayout()).to.be('XY');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can transform, read and write a wpt', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <wpt lat="1" lon="2"/>' +
        '</gpx>';
      const fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857',
      });
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(Point);
      const expectedPoint = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      expect(g.getCoordinates()).to.eql(expectedPoint);
      expect(g.getLayout()).to.be('XY');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857',
      });
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write a wpt with ele', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <wpt lat="1" lon="2">' +
        '    <ele>3</ele>' +
        '  </wpt>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(Point);
      expect(g.getCoordinates()).to.eql([2, 1, 3]);
      expect(g.getLayout()).to.be('XYZ');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write a wpt with time', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <wpt lat="1" lon="2">' +
        '    <time>2010-01-10T09:29:12Z</time>' +
        '  </wpt>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(Point);
      expect(g.getCoordinates()).to.eql([2, 1, 1263115752]);
      expect(g.getLayout()).to.be('XYM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write a wpt with ele and time', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <wpt lat="1" lon="2">' +
        '    <ele>3</ele>' +
        '    <time>2010-01-10T09:29:12Z</time>' +
        '  </wpt>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      const g = f.getGeometry();
      expect(g).to.be.an(Point);
      expect(g.getCoordinates()).to.eql([2, 1, 3, 1263115752]);
      expect(g.getLayout()).to.be('XYZM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    it('can read and write various wpt attributes', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
        '  <wpt lat="1" lon="2">' +
        '    <magvar>11</magvar>' +
        '    <geoidheight>4</geoidheight>' +
        '    <name>Name</name>' +
        '    <cmt>Comment</cmt>' +
        '    <desc>Description</desc>' +
        '    <src>Source</src>' +
        '    <link href="http://example.com/">' +
        '      <text>Link text</text>' +
        '      <type>Link type</type>' +
        '    </link>' +
        '    <sym>Symbol</sym>' +
        '    <type>Type</type>' +
        '    <fix>2d</fix>' +
        '    <sat>5</sat>' +
        '    <hdop>6</hdop>' +
        '    <vdop>7</vdop>' +
        '    <pdop>8</pdop>' +
        '    <ageofdgpsdata>9</ageofdgpsdata>' +
        '    <dgpsid>10</dgpsid>' +
        '  </wpt>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const f = fs[0];
      expect(f).to.be.an(Feature);
      expect(f.get('magvar')).to.be(11);
      expect(f.get('geoidheight')).to.be(4);
      expect(f.get('name')).to.be('Name');
      expect(f.get('cmt')).to.be('Comment');
      expect(f.get('desc')).to.be('Description');
      expect(f.get('src')).to.be('Source');
      expect(f.get('link')).to.be('http://example.com/');
      expect(f.get('linkText')).to.be('Link text');
      expect(f.get('linkType')).to.be('Link type');
      expect(f.get('sym')).to.be('Symbol');
      expect(f.get('type')).to.be('Type');
      expect(f.get('fix')).to.be('2d');
      expect(f.get('hdop')).to.be(6);
      expect(f.get('vdop')).to.be(7);
      expect(f.get('pdop')).to.be(8);
      expect(f.get('ageofdgpsdata')).to.be(9);
      expect(f.get('dgpsid')).to.be(10);
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });
  });

  describe('XML namespace support', function () {
    beforeEach(function () {
      format = new GPX();
    });

    it('can read features with a version 1.0 namespace', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/0">' +
        '  <wpt/>' +
        '  <rte/>' +
        '  <trk/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(3);
    });

    it('can read features with a version 1.1 namespace', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <wpt/>' +
        '  <rte/>' +
        '  <trk/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(3);
    });

    it('can read features with no namespace', function () {
      const text = '<gpx>' + '  <wpt/>' + '  <rte/>' + '  <trk/>' + '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(3);
    });
  });

  describe('extensions support', function () {
    beforeEach(function () {
      format = new GPX({
        readExtensions: function (feature, extensionsNode) {
          const nodes = extensionsNode.getElementsByTagName('id');
          const id = nodes.item(0).textContent;
          feature.setId(id);
        },
      });
    });

    it('can process extensions from wpt', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <wpt>' +
        '    <extensions>' +
        '      <id>feature-id</id>' +
        '    </extensions>' +
        '  </wpt>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const feature = fs[0];
      expect(feature.getId()).to.be('feature-id');
    });

    it('can process extensions from rte', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <rte>' +
        '    <extensions>' +
        '      <foo>bar</foo>' +
        '      <id>feature-id</id>' +
        '    </extensions>' +
        '  </rte>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const feature = fs[0];
      expect(feature.getId()).to.be('feature-id');
    });

    it('can process extensions from trk, not trkpt', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <trk>' +
        '    <extensions>' +
        '      <id>feature-id</id>' +
        '    </extensions>' +
        '    <trkseg>' +
        '      <trkpt>' +
        '        <extensions>' +
        '          <id>another-feature-id</id>' +
        '        </extensions>' +
        '      </trkpt>' +
        '    </trkseg>' +
        '  </trk>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      const feature = fs[0];
      expect(feature.getId()).to.be('feature-id');
    });
  });

  describe('write unsupported geometries', function () {
    beforeEach(function () {
      format = new GPX();
    });

    it('does not fail', function () {
      const polygon = new Polygon([
        [
          [0, 0],
          [2, 2],
          [4, 0],
          [0, 0],
        ],
      ]);
      const feature = new Feature(polygon);
      const features = [feature];
      const gpx = format.writeFeaturesNode(features);
      const expected =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
        'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
        'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" ' +
        'creator="OpenLayers"></gpx>';
      expect(gpx).to.xmleql(parse(expected));
    });
  });
});
