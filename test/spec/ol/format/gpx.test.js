import Feature from '../../../../src/ol/Feature.js';
import GPX from '../../../../src/ol/format/GPX.js';
import LineString from '../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../src/ol/geom/MultiLineString.js';
import Point from '../../../../src/ol/geom/Point.js';
import Polygon from '../../../../src/ol/geom/Polygon.js';
import {get as getProjection, transform} from '../../../../src/ol/proj.js';
import {parse} from '../../../../src/ol/xml.js';

describe('ol.format.GPX', () => {

  let format;
  beforeEach(() => {
    format = new GPX();
  });

  describe('#readProjection', () => {
    test('returns the default projection from document', () => {
      const projection = format.readProjectionFromDocument();
      expect(projection).toEqual(getProjection('EPSG:4326'));
    });

    test('returns the default projection from node', () => {
      const projection = format.readProjectionFromNode();
      expect(projection).toEqual(getProjection('EPSG:4326'));
    });
  });

  describe('rte', () => {

    test('can read an empty rte', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <rte/>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(LineString);
      expect(g.getCoordinates()).toEqual([]);
      expect(g.getLayout()).toBe('XY');
    });

    test('can read and write various rte attributes', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      expect(f.get('name')).toBe('Name');
      expect(f.get('cmt')).toBe('Comment');
      expect(f.get('desc')).toBe('Description');
      expect(f.get('src')).toBe('Source');
      expect(f.get('link')).toBe('http://example.com/');
      expect(f.get('linkText')).toBe('Link text');
      expect(f.get('linkType')).toBe('Link type');
      expect(f.get('number')).toBe(1);
      expect(f.get('type')).toBe('Type');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write a rte with multiple rtepts', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(LineString);
      expect(g.getCoordinates()).toEqual([[2, 1], [4, 3]]);
      expect(g.getLayout()).toBe('XY');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can transform, read and write a rte', () => {
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
        featureProjection: 'EPSG:3857'
      });
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(LineString);
      const p1 = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      const p2 = transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      expect(g.getCoordinates()).toEqual([p1, p2]);
      expect(g.getLayout()).toBe('XY');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857'
      });
      expect(serialized).to.xmleql(parse(text));
    });

    test('does not write rte attributes in rtepts', () => {
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

  describe('trk', () => {

    test('can read an empty trk', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <trk/>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(MultiLineString);
      expect(g.getCoordinates()).toEqual([]);
      expect(g.getLayout()).toBe('XY');
    });

    test('can read and write various trk attributes', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      expect(f.get('name')).toBe('Name');
      expect(f.get('cmt')).toBe('Comment');
      expect(f.get('desc')).toBe('Description');
      expect(f.get('src')).toBe('Source');
      expect(f.get('link')).toBe('http://example.com/');
      expect(f.get('linkText')).toBe('Link text');
      expect(f.get('linkType')).toBe('Link type');
      expect(f.get('number')).toBe(1);
      expect(f.get('type')).toBe('Type');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write a trk with an empty trkseg', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(MultiLineString);
      expect(g.getCoordinates()).toEqual([[]]);
      expect(g.getLayout()).toBe('XY');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read/write a trk with a trkseg with multiple trkpts', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(MultiLineString);
      expect(g.getCoordinates()).toEqual([
        [[2, 1, 3, 1263115752], [6, 5, 7, 1263115812]]
      ]);
      expect(g.getLayout()).toBe('XYZM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can transform, read and write a trk with a trkseg', () => {
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
        featureProjection: 'EPSG:3857'
      });
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(MultiLineString);
      const p1 = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      p1.push(3, 1263115752);
      const p2 = transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      p2.push(7, 1263115812);
      expect(g.getCoordinates()).toEqual([[p1, p2]]);
      expect(g.getLayout()).toBe('XYZM');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857'
      });
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write a trk with multiple trksegs', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(MultiLineString);
      expect(g.getCoordinates()).toEqual([
        [[2, 1, 3, 1263115752], [6, 5, 7, 1263115812]],
        [[9, 8, 10, 1263115872], [12, 11, 13, 1263115932]]
      ]);
      expect(g.getLayout()).toBe('XYZM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('does not write trk attributes in trkpts', () => {
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

  describe('wpt', () => {

    test('can read and write a wpt', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2"/>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual([2, 1]);
      expect(g.getLayout()).toBe('XY');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can transform, read and write a wpt', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2"/>' +
          '</gpx>';
      const fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857'
      });
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      const expectedPoint = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      expect(g.getCoordinates()).toEqual(expectedPoint);
      expect(g.getLayout()).toBe('XY');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857'
      });
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write a wpt with ele', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual([2, 1, 3]);
      expect(g.getLayout()).toBe('XYZ');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write a wpt with time', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual([2, 1, 1263115752]);
      expect(g.getLayout()).toBe('XYM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write a wpt with ele and time', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      const g = f.getGeometry();
      expect(g).toBeInstanceOf(Point);
      expect(g.getCoordinates()).toEqual([2, 1, 3, 1263115752]);
      expect(g.getLayout()).toBe('XYZM');
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

    test('can read and write various wpt attributes', () => {
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
      expect(fs).toHaveLength(1);
      const f = fs[0];
      expect(f).toBeInstanceOf(Feature);
      expect(f.get('magvar')).toBe(11);
      expect(f.get('geoidheight')).toBe(4);
      expect(f.get('name')).toBe('Name');
      expect(f.get('cmt')).toBe('Comment');
      expect(f.get('desc')).toBe('Description');
      expect(f.get('src')).toBe('Source');
      expect(f.get('link')).toBe('http://example.com/');
      expect(f.get('linkText')).toBe('Link text');
      expect(f.get('linkType')).toBe('Link type');
      expect(f.get('sym')).toBe('Symbol');
      expect(f.get('type')).toBe('Type');
      expect(f.get('fix')).toBe('2d');
      expect(f.get('hdop')).toBe(6);
      expect(f.get('vdop')).toBe(7);
      expect(f.get('pdop')).toBe(8);
      expect(f.get('ageofdgpsdata')).toBe(9);
      expect(f.get('dgpsid')).toBe(10);
      const serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(parse(text));
    });

  });

  describe('XML namespace support', () => {

    beforeEach(() => {
      format = new GPX();
    });

    test('can read features with a version 1.0 namespace', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/0">' +
          '  <wpt/>' +
          '  <rte/>' +
          '  <trk/>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(3);
    });

    test('can read features with a version 1.1 namespace', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <wpt/>' +
          '  <rte/>' +
          '  <trk/>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(3);
    });

    test('can read features with no namespace', () => {
      const text =
          '<gpx>' +
          '  <wpt/>' +
          '  <rte/>' +
          '  <trk/>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(3);
    });

  });

  describe('extensions support', () => {

    beforeEach(() => {
      format = new GPX({
        readExtensions: function(feature, extensionsNode) {
          const nodes = extensionsNode.getElementsByTagName('id');
          const id = nodes.item(0).textContent;
          feature.setId(id);
        }
      });
    });

    test('can process extensions from wpt', () => {
      const text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <wpt>' +
          '    <extensions>' +
          '      <id>feature-id</id>' +
          '    </extensions>' +
          '  </wpt>' +
          '</gpx>';
      const fs = format.readFeatures(text);
      expect(fs).toHaveLength(1);
      const feature = fs[0];
      expect(feature.getId()).toBe('feature-id');
    });

    test('can process extensions from rte', () => {
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
      expect(fs).toHaveLength(1);
      const feature = fs[0];
      expect(feature.getId()).toBe('feature-id');
    });

    test('can process extensions from trk, not trkpt', () => {
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
      expect(fs).toHaveLength(1);
      const feature = fs[0];
      expect(feature.getId()).toBe('feature-id');
    });

  });

  describe('write unsupported geometries', () => {
    beforeEach(() => {
      format = new GPX();
    });

    test('does not fail', () => {
      const polygon = new Polygon(
        [[[0, 0], [2, 2], [4, 0], [0, 0]]]);
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
