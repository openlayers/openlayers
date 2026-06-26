import {assert} from 'chai';
import Feature from '../../../../../src/ol/Feature.js';
import GPX from '../../../../../src/ol/format/GPX.js';
import LineString from '../../../../../src/ol/geom/LineString.js';
import MultiLineString from '../../../../../src/ol/geom/MultiLineString.js';
import Point from '../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../src/ol/geom/Polygon.js';
import {get as getProjection, transform} from '../../../../../src/ol/proj.js';
import {parse} from '../../../../../src/ol/xml.js';
import {assertXmlEqual} from '../../../../util/xml.js';

describe('ol.format.GPX', function () {
  let format;
  beforeEach(function () {
    format = new GPX();
  });

  describe('#readProjection', function () {
    it('returns the default projection from document', function () {
      const projection = format.readProjectionFromDocument();
      assert.deepEqual(projection, getProjection('EPSG:4326'));
    });

    it('returns the default projection from node', function () {
      const projection = format.readProjectionFromNode();
      assert.deepEqual(projection, getProjection('EPSG:4326'));
    });
  });

  describe('metadata', function () {
    it('can handle an empty metadata tag', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <metadata></metadata>' +
        '</gpx>';
      const metadata = format.readMetadata(text);
      assert.isNull(metadata);
    });
    it('can read various metadata entries/attribute', function () {
      const test =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        `  <metadata>` +
        `    <name>GPX file name</name>` +
        `    <desc>something that describe this GPX</desc>` +
        `    <author>` +
        `      <name>Author name</name>` +
        `      <link href="https://url.to.author.website.com"></link>` +
        `    </author>` +
        `    <copyright author="hello I'm the author of the copyright">` +
        `      <year>2024</year>` +
        `      <license>https://link.to.the.licence.com</license>` +
        `    </copyright>` +
        `    <link href="https://a-link-for-this.gpx.com"></link>` +
        `    <time>2024-01-25T12:00</time>` +
        `    <keywords>Some,keywords,for,this,GPX</keywords>` +
        `    <bounds minlat="12.3" maxlat="45.6" minlon="-7.0" maxlon="8.9"></bounds>` +
        `  </metadata>` +
        '</gpx>';
      const metadata = format.readMetadata(test);
      assert.instanceOf(metadata, Object);
      assert.strictEqual(metadata['name'], 'GPX file name');
      assert.strictEqual(metadata['desc'], 'something that describe this GPX');

      assert.instanceOf(metadata['author'], Object);
      const {author} = metadata;
      assert.strictEqual(author['name'], 'Author name');
      assert.strictEqual(author['link'], 'https://url.to.author.website.com');

      assert.instanceOf(metadata['copyright'], Object);
      const {copyright} = metadata;
      assert.strictEqual(
        copyright['author'],
        "hello I'm the author of the copyright",
      );
      assert.strictEqual(copyright['year'], 2024);
      assert.strictEqual(
        copyright['license'],
        'https://link.to.the.licence.com',
      );

      assert.strictEqual(metadata['link'], 'https://a-link-for-this.gpx.com');
      assert.strictEqual(
        metadata['time'],
        new Date('2024-01-25T12:00').getTime() / 1000,
      );
      assert.strictEqual(metadata['keywords'], 'Some,keywords,for,this,GPX');

      assert.lengthOf(metadata['bounds'], 2);
      const [bottomLeft, topRight] = metadata['bounds'];
      assert.lengthOf(bottomLeft, 2);
      assert.strictEqual(bottomLeft[0], -7.0);
      assert.strictEqual(bottomLeft[1], 12.3);
      assert.lengthOf(topRight, 2);
      assert.strictEqual(topRight[0], 8.9);
      assert.strictEqual(topRight[1], 45.6);
    });
  });

  describe('rte', function () {
    it('can read an empty rte', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <rte/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, LineString);
      assert.deepEqual(g.getCoordinates(), []);
      assert.strictEqual(g.getLayout(), 'XY');
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      assert.strictEqual(f.get('name'), 'Name');
      assert.strictEqual(f.get('cmt'), 'Comment');
      assert.strictEqual(f.get('desc'), 'Description');
      assert.strictEqual(f.get('src'), 'Source');
      assert.strictEqual(f.get('link'), 'http://example.com/');
      assert.strictEqual(f.get('linkText'), 'Link text');
      assert.strictEqual(f.get('linkType'), 'Link type');
      assert.strictEqual(f.get('number'), 1);
      assert.strictEqual(f.get('type'), 'Type');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, LineString);
      assert.deepEqual(g.getCoordinates(), [
        [2, 1],
        [4, 3],
      ]);
      assert.strictEqual(g.getLayout(), 'XY');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, LineString);
      const p1 = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      const p2 = transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      assert.deepEqual(g.getCoordinates(), [p1, p2]);
      assert.strictEqual(g.getLayout(), 'XY');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857',
      });
      assertXmlEqual(serialized, parse(text));
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
      assertXmlEqual(serialized, parse(text));
    });
  });

  describe('trk', function () {
    it('can read an empty trk', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <trk/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, MultiLineString);
      assert.deepEqual(g.getCoordinates(), []);
      assert.strictEqual(g.getLayout(), 'XY');
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      assert.strictEqual(f.get('name'), 'Name');
      assert.strictEqual(f.get('cmt'), 'Comment');
      assert.strictEqual(f.get('desc'), 'Description');
      assert.strictEqual(f.get('src'), 'Source');
      assert.strictEqual(f.get('link'), 'http://example.com/');
      assert.strictEqual(f.get('linkText'), 'Link text');
      assert.strictEqual(f.get('linkType'), 'Link type');
      assert.strictEqual(f.get('number'), 1);
      assert.strictEqual(f.get('type'), 'Type');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, MultiLineString);
      assert.deepEqual(g.getCoordinates(), [[]]);
      assert.strictEqual(g.getLayout(), 'XY');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, MultiLineString);
      assert.deepEqual(g.getCoordinates(), [
        [
          [2, 1, 3, 1263115752],
          [6, 5, 7, 1263115812],
        ],
      ]);
      assert.strictEqual(g.getLayout(), 'XYZM');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, MultiLineString);
      const p1 = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      p1.push(3, 1263115752);
      const p2 = transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      p2.push(7, 1263115812);
      assert.deepEqual(g.getCoordinates(), [[p1, p2]]);
      assert.strictEqual(g.getLayout(), 'XYZM');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857',
      });
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, MultiLineString);
      assert.deepEqual(g.getCoordinates(), [
        [
          [2, 1, 3, 1263115752],
          [6, 5, 7, 1263115812],
        ],
        [
          [9, 8, 10, 1263115872],
          [12, 11, 13, 1263115932],
        ],
      ]);
      assert.strictEqual(g.getLayout(), 'XYZM');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(g.getCoordinates(), [2, 1]);
      assert.strictEqual(g.getLayout(), 'XY');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      const expectedPoint = transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      assert.deepEqual(g.getCoordinates(), expectedPoint);
      assert.strictEqual(g.getLayout(), 'XY');
      const serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857',
      });
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(g.getCoordinates(), [2, 1, 3]);
      assert.strictEqual(g.getLayout(), 'XYZ');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(g.getCoordinates(), [2, 1, 1263115752]);
      assert.strictEqual(g.getLayout(), 'XYM');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      const g = f.getGeometry();
      assert.instanceOf(g, Point);
      assert.deepEqual(g.getCoordinates(), [2, 1, 3, 1263115752]);
      assert.strictEqual(g.getLayout(), 'XYZM');
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 1);
      const f = fs[0];
      assert.instanceOf(f, Feature);
      assert.strictEqual(f.get('magvar'), 11);
      assert.strictEqual(f.get('geoidheight'), 4);
      assert.strictEqual(f.get('name'), 'Name');
      assert.strictEqual(f.get('cmt'), 'Comment');
      assert.strictEqual(f.get('desc'), 'Description');
      assert.strictEqual(f.get('src'), 'Source');
      assert.strictEqual(f.get('link'), 'http://example.com/');
      assert.strictEqual(f.get('linkText'), 'Link text');
      assert.strictEqual(f.get('linkType'), 'Link type');
      assert.strictEqual(f.get('sym'), 'Symbol');
      assert.strictEqual(f.get('type'), 'Type');
      assert.strictEqual(f.get('fix'), '2d');
      assert.strictEqual(f.get('hdop'), 6);
      assert.strictEqual(f.get('vdop'), 7);
      assert.strictEqual(f.get('pdop'), 8);
      assert.strictEqual(f.get('ageofdgpsdata'), 9);
      assert.strictEqual(f.get('dgpsid'), 10);
      const serialized = format.writeFeaturesNode(fs);
      assertXmlEqual(serialized, parse(text));
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
      assert.lengthOf(fs, 3);
    });

    it('can read features with a version 1.1 namespace', function () {
      const text =
        '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
        '  <wpt/>' +
        '  <rte/>' +
        '  <trk/>' +
        '</gpx>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 3);
    });

    it('can read features with no namespace', function () {
      const text = '<gpx>' + '  <wpt/>' + '  <rte/>' + '  <trk/>' + '</gpx>';
      const fs = format.readFeatures(text);
      assert.lengthOf(fs, 3);
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
      assert.lengthOf(fs, 1);
      const feature = fs[0];
      assert.strictEqual(feature.getId(), 'feature-id');
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
      assert.lengthOf(fs, 1);
      const feature = fs[0];
      assert.strictEqual(feature.getId(), 'feature-id');
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
      assert.lengthOf(fs, 1);
      const feature = fs[0];
      assert.strictEqual(feature.getId(), 'feature-id');
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
      assertXmlEqual(gpx, parse(expected));
    });
  });
});
