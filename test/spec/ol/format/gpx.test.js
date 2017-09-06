

import _ol_Feature_ from '../../../../src/ol/feature';
import _ol_format_GPX_ from '../../../../src/ol/format/gpx';
import _ol_geom_LineString_ from '../../../../src/ol/geom/linestring';
import _ol_geom_MultiLineString_ from '../../../../src/ol/geom/multilinestring';
import _ol_geom_Point_ from '../../../../src/ol/geom/point';
import _ol_geom_Polygon_ from '../../../../src/ol/geom/polygon';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_xml_ from '../../../../src/ol/xml';

describe('ol.format.GPX', function() {

  var format;
  beforeEach(function() {
    format = new _ol_format_GPX_();
  });

  describe('#readProjection', function() {
    it('returns the default projection from document', function() {
      var projection = format.readProjectionFromDocument();
      expect(projection).to.eql(_ol_proj_.get('EPSG:4326'));
    });

    it('returns the default projection from node', function() {
      var projection = format.readProjectionFromNode();
      expect(projection).to.eql(_ol_proj_.get('EPSG:4326'));
    });
  });

  describe('rte', function() {

    it('can read an empty rte', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <rte/>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_LineString_);
      expect(g.getCoordinates()).to.eql([]);
      expect(g.getLayout()).to.be('XY');
    });

    it('can read and write various rte attributes', function() {
      var text =
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
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      expect(f.get('name')).to.be('Name');
      expect(f.get('cmt')).to.be('Comment');
      expect(f.get('desc')).to.be('Description');
      expect(f.get('src')).to.be('Source');
      expect(f.get('link')).to.be('http://example.com/');
      expect(f.get('linkText')).to.be('Link text');
      expect(f.get('linkType')).to.be('Link type');
      expect(f.get('number')).to.be(1);
      expect(f.get('type')).to.be('Type');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write a rte with multiple rtepts', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <rte>' +
          '    <rtept lat="1" lon="2"/>' +
          '    <rtept lat="3" lon="4"/>' +
          '  </rte>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_LineString_);
      expect(g.getCoordinates()).to.eql([[2, 1], [4, 3]]);
      expect(g.getLayout()).to.be('XY');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can transform, read and write a rte', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <rte>' +
          '    <rtept lat="1" lon="2"/>' +
          '    <rtept lat="5" lon="6"/>' +
          '  </rte>' +
          '</gpx>';
      var fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857'
      });
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_LineString_);
      var p1 = _ol_proj_.transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      var p2 = _ol_proj_.transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      expect(g.getCoordinates()).to.eql([p1, p2]);
      expect(g.getLayout()).to.be('XY');
      var serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857'
      });
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('does not write rte attributes in rtepts', function() {
      var text =
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
      var fs = format.readFeatures(text);
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

  });

  describe('trk', function() {

    it('can read an empty trk', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <trk/>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_MultiLineString_);
      expect(g.getCoordinates()).to.eql([]);
      expect(g.getLayout()).to.be('XY');
    });

    it('can read and write various trk attributes', function() {
      var text =
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
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      expect(f.get('name')).to.be('Name');
      expect(f.get('cmt')).to.be('Comment');
      expect(f.get('desc')).to.be('Description');
      expect(f.get('src')).to.be('Source');
      expect(f.get('link')).to.be('http://example.com/');
      expect(f.get('linkText')).to.be('Link text');
      expect(f.get('linkType')).to.be('Link type');
      expect(f.get('number')).to.be(1);
      expect(f.get('type')).to.be('Type');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write a trk with an empty trkseg', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <trk>' +
          '    <trkseg/>' +
          '  </trk>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_MultiLineString_);
      expect(g.getCoordinates()).to.eql([[]]);
      expect(g.getLayout()).to.be('XY');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read/write a trk with a trkseg with multiple trkpts', function() {
      var text =
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
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_MultiLineString_);
      expect(g.getCoordinates()).to.eql([
        [[2, 1, 3, 1263115752], [6, 5, 7, 1263115812]]
      ]);
      expect(g.getLayout()).to.be('XYZM');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can transform, read and write a trk with a trkseg', function() {
      var text =
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
      var fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857'
      });
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_MultiLineString_);
      var p1 = _ol_proj_.transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      p1.push(3, 1263115752);
      var p2 = _ol_proj_.transform([6, 5], 'EPSG:4326', 'EPSG:3857');
      p2.push(7, 1263115812);
      expect(g.getCoordinates()).to.eql([[p1, p2]]);
      expect(g.getLayout()).to.be('XYZM');
      var serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857'
      });
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write a trk with multiple trksegs', function() {
      var text =
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
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_MultiLineString_);
      expect(g.getCoordinates()).to.eql([
        [[2, 1, 3, 1263115752], [6, 5, 7, 1263115812]],
        [[9, 8, 10, 1263115872], [12, 11, 13, 1263115932]]
      ]);
      expect(g.getLayout()).to.be('XYZM');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('does not write trk attributes in trkpts', function() {
      var text =
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
      var fs = format.readFeatures(text);
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

  });

  describe('wpt', function() {

    it('can read and write a wpt', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2"/>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_Point_);
      expect(g.getCoordinates()).to.eql([2, 1]);
      expect(g.getLayout()).to.be('XY');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can transform, read and write a wpt', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2"/>' +
          '</gpx>';
      var fs = format.readFeatures(text, {
        featureProjection: 'EPSG:3857'
      });
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_Point_);
      var expectedPoint = _ol_proj_.transform([2, 1], 'EPSG:4326', 'EPSG:3857');
      expect(g.getCoordinates()).to.eql(expectedPoint);
      expect(g.getLayout()).to.be('XY');
      var serialized = format.writeFeaturesNode(fs, {
        featureProjection: 'EPSG:3857'
      });
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write a wpt with ele', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2">' +
          '    <ele>3</ele>' +
          '  </wpt>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_Point_);
      expect(g.getCoordinates()).to.eql([2, 1, 3]);
      expect(g.getLayout()).to.be('XYZ');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write a wpt with time', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2">' +
          '    <time>2010-01-10T09:29:12Z</time>' +
          '  </wpt>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_Point_);
      expect(g.getCoordinates()).to.eql([2, 1, 1263115752]);
      expect(g.getLayout()).to.be('XYM');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write a wpt with ele and time', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="OpenLayers">' +
          '  <wpt lat="1" lon="2">' +
          '    <ele>3</ele>' +
          '    <time>2010-01-10T09:29:12Z</time>' +
          '  </wpt>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
      var g = f.getGeometry();
      expect(g).to.be.an(_ol_geom_Point_);
      expect(g.getCoordinates()).to.eql([2, 1, 3, 1263115752]);
      expect(g.getLayout()).to.be('XYZM');
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

    it('can read and write various wpt attributes', function() {
      var text =
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
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var f = fs[0];
      expect(f).to.be.an(_ol_Feature_);
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
      var serialized = format.writeFeaturesNode(fs);
      expect(serialized).to.xmleql(_ol_xml_.parse(text));
    });

  });

  describe('XML namespace support', function() {

    beforeEach(function() {
      format = new _ol_format_GPX_();
    });

    it('can read features with a version 1.0 namespace', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/0">' +
          '  <wpt/>' +
          '  <rte/>' +
          '  <trk/>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(3);
    });

    it('can read features with a version 1.1 namespace', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <wpt/>' +
          '  <rte/>' +
          '  <trk/>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(3);
    });

    it('can read features with no namespace', function() {
      var text =
          '<gpx>' +
          '  <wpt/>' +
          '  <rte/>' +
          '  <trk/>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(3);
    });

  });

  describe('extensions support', function() {

    beforeEach(function() {
      format = new _ol_format_GPX_({
        readExtensions: function(feature, extensionsNode) {
          var nodes = extensionsNode.getElementsByTagName('id');
          var id = nodes.item(0).textContent;
          feature.setId(id);
        }
      });
    });

    it('can process extensions from wpt', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <wpt>' +
          '    <extensions>' +
          '      <id>feature-id</id>' +
          '    </extensions>' +
          '  </wpt>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var feature = fs[0];
      expect(feature.getId()).to.be('feature-id');
    });

    it('can process extensions from rte', function() {
      var text =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1">' +
          '  <rte>' +
          '    <extensions>' +
          '      <foo>bar</foo>' +
          '      <id>feature-id</id>' +
          '    </extensions>' +
          '  </rte>' +
          '</gpx>';
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var feature = fs[0];
      expect(feature.getId()).to.be('feature-id');
    });

    it('can process extensions from trk, not trkpt', function() {
      var text =
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
      var fs = format.readFeatures(text);
      expect(fs).to.have.length(1);
      var feature = fs[0];
      expect(feature.getId()).to.be('feature-id');
    });

  });

  describe('write unsupported geometries', function() {
    beforeEach(function() {
      format = new _ol_format_GPX_();
    });

    it('does not fail', function() {
      var polygon = new _ol_geom_Polygon_(
          [[[0, 0], [2, 2], [4, 0], [0, 0]]]);
      var feature = new _ol_Feature_(polygon);
      var features = [feature];
      var gpx = format.writeFeaturesNode(features);
      var expected =
          '<gpx xmlns="http://www.topografix.com/GPX/1/1" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
          'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 ' +
          'http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" ' +
          'creator="OpenLayers"></gpx>';
      expect(gpx).to.xmleql(_ol_xml_.parse(expected));
    });
  });

});
