goog.provide('ol.test.format.KML');


describe('ol.format.KML', function() {

  var format;
  beforeEach(function() {
    format = new ol.format.KML();
  });

  describe('#readFeatures', function() {

    describe('id', function() {

      it('can read a Feature\'s id', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="foo"/>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.getId()).to.be('foo');
      });

      it('treats a missing id as undefined', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark/>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.getId()).to.be(undefined);
      });

    });

    describe('geometry', function() {

      it('treats a missing geometry as null', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark/>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be(null);
      });

      it('can read Point geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Point>' +
            '      <coordinates>1,2,3</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.Point);
        expect(g.getCoordinates()).to.eql([1, 2, 3]);
      });

      it('can read LineString geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <LineString>' +
            '      <coordinates>1,2,3 4,5,6</coordinates>' +
            '    </LineString>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.LineString);
        expect(g.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
      });

      it('can read LinearRing geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <LinearRing>' +
            '      <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
            '    </LinearRing>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql([[[1, 2, 3], [4, 5, 6], [7, 8, 9]]]);
      });

      it('can read Polygon geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Polygon>' +
            '      <outerBoundaryIs>' +
            '        <LinearRing>' +
            '          <coordinates>0,0,1 0,5,1 5,5,2 5,0,3</coordinates>' +
            '        </LinearRing>' +
            '      </outerBoundaryIs>' +
            '    </Polygon>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql(
            [[[0, 0, 1], [0, 5, 1], [5, 5, 2], [5, 0, 3]]]);
      });

      it('can read complex Polygon geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Polygon>' +
            '      <innerBoundaryIs>' +
            '        <LinearRing>' +
            '          <coordinates>1,1,0 1,2,0 2,2,0 2,1,0</coordinates>' +
            '        </LinearRing>' +
            '      </innerBoundaryIs>' +
            '      <innerBoundaryIs>' +
            '        <LinearRing>' +
            '          <coordinates>3,3,0 3,4,0 4,4,0 4,3,0</coordinates>' +
            '        </LinearRing>' +
            '      </innerBoundaryIs>' +
            '      <outerBoundaryIs>' +
            '        <LinearRing>' +
            '          <coordinates>0,0,1 0,5,1 5,5,2 5,0,3</coordinates>' +
            '        </LinearRing>' +
            '      </outerBoundaryIs>' +
            '    </Polygon>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.Polygon);
        expect(g.getCoordinates()).to.eql(
            [[[0, 0, 1], [0, 5, 1], [5, 5, 2], [5, 0, 3]],
             [[1, 1, 0], [1, 2, 0], [2, 2, 0], [2, 1, 0]],
             [[3, 3, 0], [3, 4, 0], [4, 4, 0], [4, 3, 0]]]);
      });

      it('can read MultiPoint geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <Point>' +
            '        <coordinates>1,2,3</coordinates>' +
            '      </Point>' +
            '      <Point>' +
            '        <coordinates>4,5,6</coordinates>' +
            '      </Point>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.MultiPoint);
        expect(g.getCoordinates()).to.eql([[1, 2, 3], [4, 5, 6]]);
      });

      it('can read MultiLineString geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <LineString>' +
            '        <coordinates>1,2,3 4,5,6</coordinates>' +
            '      </LineString>' +
            '      <LineString>' +
            '        <coordinates>7,8,9 10,11,12</coordinates>' +
            '      </LineString>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.MultiLineString);
        expect(g.getCoordinates()).to.eql(
            [[[1, 2, 3], [4, 5, 6]], [[7, 8, 9], [10, 11, 12]]]);
      });

      it('can read MultiPolygon geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>3,0,0 3,1,0 4,1,0 4,0,0</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.MultiPolygon);
        expect(g.getCoordinates()).to.eql(
            [[[[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
             [[[3, 0, 0], [3, 1, 0], [4, 1, 0], [4, 0, 0]]]]);
      });

      it('can read empty GeometryCollection geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.GeometryCollection);
        expect(g.getGeometries()).to.be.empty();
      });

      it('can read heterogenous GeometryCollection geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <Point>' +
            '        <coordinates>1,2,3</coordinates>' +
            '      </Point>' +
            '      <LineString>' +
            '        <coordinates>1,2,3 4,5,6</coordinates>' +
            '      </LineString>' +
            '      <LinearRing>' +
            '        <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
            '      </LinearRing>' +
            '      <Polygon>' +
            '        <outerBoundaryIs>' +
            '          <LinearRing>' +
            '            <coordinates>0,0,0 0,1,0 1,1,0 1,0,0</coordinates>' +
            '          </LinearRing>' +
            '        </outerBoundaryIs>' +
            '      </Polygon>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.GeometryCollection);
        var gs = g.getGeometries();
        expect(gs).to.have.length(4);
        expect(gs[0]).to.be.an(ol.geom.Point);
        expect(gs[1]).to.be.an(ol.geom.LineString);
        expect(gs[2]).to.be.an(ol.geom.Polygon);
        expect(gs[3]).to.be.an(ol.geom.Polygon);
      });

      it('can read nested GeometryCollection geometries', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <MultiGeometry>' +
            '      </MultiGeometry>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.GeometryCollection);
        var gs = g.getGeometries();
        expect(gs).to.have.length(1);
        expect(gs[0]).to.be.an(ol.geom.GeometryCollection);
      });

      it('can read gx:Track', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2"' +
            '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
            '  <Placemark>' +
            '    <gx:Track>' +
            '      <when>2014-01-06T19:38:55Z</when>' +
            '      <when>2014-01-06T19:39:03Z</when>' +
            '      <when>2014-01-06T19:39:10Z</when>' +
            '      <gx:coord>8.1 46.1 1909.9</gx:coord>' +
            '      <gx:coord>8.2 46.2 1925.2</gx:coord>' +
            '      <gx:coord>8.3 46.3 1926.2</gx:coord>' +
            '    </gx:Track>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.LineString);
      });

      it('can read gx:MultiTrack', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2"' +
            '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
            '  <Placemark>' +
            '    <gx:MultiTrack>' +
            '      <gx:Track>' +
            '        <when>2014-01-06T19:38:55Z</when>' +
            '        <gx:coord>8.1 46.1 1909.9</gx:coord>' +
            '      </gx:Track>' +
            '      <gx:Track>' +
            '        <when>2014-01-06T19:38:55Z</when>' +
            '        <when>2014-01-06T19:39:10Z</when>' +
            '        <gx:coord>8.1 46.1 1909.9</gx:coord>' +
            '        <gx:coord>8.2 46.2 1925.2</gx:coord>' +
            '      </gx:Track>' +
            '    </gx:MultiTrack>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.MultiLineString);
        var gs = g.getLineStrings();
        expect(gs).to.have.length(2);
        expect(gs[0]).to.be.an(ol.geom.LineString);
      });

      it('can read dateTime', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2"' +
            '     xmlns:gx="http://www.google.com/kml/ext/2.2">' +
            '  <Placemark>' +
            '    <gx:Track>' +
            '      <when>2014</when>' +
            '      <when>2014-02</when>' +
            '      <when>2014-02-06</when>' +
            '      <when>2014-02-06T19:39:03Z</when>' +
            '      <when>2014-02-06T19:39:10+03:00</when>' +
            '      <gx:coord>8.1 46.1 1909.9</gx:coord>' +
            '      <gx:coord>8.2 46.2 1925.2</gx:coord>' +
            '      <gx:coord>8.3 46.3 1926.2</gx:coord>' +
            '      <gx:coord>8.4 46.4 1927.2</gx:coord>' +
            '      <gx:coord>8.5 46.5 1928.2</gx:coord>' +
            '    </gx:Track>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        var f = fs[0];
        var g = f.getGeometry();
        var flatCoordinates = g.flatCoordinates;
        expect(flatCoordinates[3]).to.be.eql(Date.UTC(2014, 0, 1, 0, 0, 0));
        expect(flatCoordinates[7]).to.be.eql(Date.UTC(2014, 1, 1, 0, 0, 0));
        expect(flatCoordinates[11]).to.be.eql(Date.UTC(2014, 1, 6, 0, 0, 0));
        expect(flatCoordinates[15]).to.be.eql(Date.UTC(2014, 1, 6, 19, 39, 3));
        expect(flatCoordinates[19]).to.be.eql(
            Date.UTC(2014, 1, 6, 19, 39, 10) + 3 * 60
        );
      });

    });

    describe('attributes', function() {

      it('can read boolean attributes', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <open>1</open>' +
            '    <visibility>0</visibility>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('open')).to.be(true);
        expect(f.get('visibility')).to.be(false);
      });

      it('can read string attributes', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <address>My address</address>' +
            '    <description>My description</description>' +
            '    <name>My name</name>' +
            '    <phoneNumber>My phone number</phoneNumber>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('address')).to.be('My address');
        expect(f.get('description')).to.be('My description');
        expect(f.get('name')).to.be('My name');
        expect(f.get('phoneNumber')).to.be('My phone number');
      });

      it('strips leading and trailing whitespace in strings', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <description>\n\nMy  description\n\n</description>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('description')).to.be('My  description');
      });

      it('can read CDATA sections in strings', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <name><![CDATA[My name in CDATA]]></name>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('name')).to.be('My name in CDATA');
      });

      it('strips leading and trailing whitespace around CDATA', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <name>\n\n<![CDATA[My name in CDATA]]>\n\n</name>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('name')).to.be('My name in CDATA');
      });

    });

    describe('extended data', function() {

      it('can read ExtendedData', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
            '    <ExtendedData>' +
            '      <Data name="foo">' +
            '        <value>bar</value>' +
            '      </Data>' +
            '    </ExtendedData>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('foo')).to.be('bar');
      });

      it('can read SchemaData', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark xmlns="http://earth.google.com/kml/2.2">' +
            '    <ExtendedData>' +
            '      <SchemaData schemaUrl="#mySchema">' +
            '        <SimpleData name="capital">London</SimpleData>' +
            '        <SimpleData name="population">60000000</SimpleData>' +
            '      </SchemaData>' +
            '    </ExtendedData>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('capital')).to.be('London');
        expect(f.get('population')).to.be('60000000');
      });
    });

    describe('styles', function() {

      it('applies the default style if no style is defined', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        expect(style.getFill()).to.be(ol.format.KML.DEFAULT_FILL_STYLE_);
        expect(style.getFill().getColor()).to.eql([255, 255, 255, 1]);
        expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
        // FIXME check image style
        expect(style.getStroke()).to.be(ol.format.KML.DEFAULT_STROKE_STYLE_);
        expect(style.getStroke().getColor()).to.eql([255, 255, 255, 1]);
        expect(style.getStroke().getWidth()).to.be(1);
      });

      it('can read a feature\'s IconStyle', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <IconStyle>' +
            '        <Icon>' +
            '          <href>http://foo.png</href>' +
            '        </Icon>' +
            '      </IconStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        expect(style.getFill()).to.be(ol.format.KML.DEFAULT_FILL_STYLE_);
        expect(style.getStroke()).to.be(ol.format.KML.DEFAULT_STROKE_STYLE_);
        var imageStyle = style.getImage();
        expect(imageStyle).to.be.an(ol.style.Icon);
        expect(imageStyle.getSrc()).to.eql('http://foo.png');
        expect(imageStyle.getAnchor()).to.be(null);
        expect(imageStyle.getRotation()).to.eql(0);
        expect(imageStyle.getSize()).to.be(null);
        expect(style.getText()).to.be(null);
        expect(style.getZIndex()).to.be(undefined);
      });

      it('can read a feature\'s LineStyle', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <LineStyle>' +
            '        <color>12345678</color>' +
            '        <width>9</width>' +
            '      </LineStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        expect(style.getFill()).to.be(ol.format.KML.DEFAULT_FILL_STYLE_);
        expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
        var strokeStyle = style.getStroke();
        expect(strokeStyle).to.be.an(ol.style.Stroke);
        expect(strokeStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
        expect(strokeStyle.getWidth()).to.be(9);
        expect(style.getText()).to.be(null);
        expect(style.getZIndex()).to.be(undefined);
      });

      it('can read a feature\'s PolyStyle', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        var fillStyle = style.getFill();
        expect(fillStyle).to.be.an(ol.style.Fill);
        expect(fillStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
        expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
        expect(style.getStroke()).to.be(ol.format.KML.DEFAULT_STROKE_STYLE_);
        expect(style.getText()).to.be(null);
        expect(style.getZIndex()).to.be(undefined);
      });

      it('can read a feature\'s LineStyle and PolyStyle', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <LineStyle>' +
            '        <color>12345678</color>' +
            '        <width>9</width>' +
            '      </LineStyle>' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        var fillStyle = style.getFill();
        expect(fillStyle).to.be.an(ol.style.Fill);
        expect(fillStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
        expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
        var strokeStyle = style.getStroke();
        expect(strokeStyle).to.be.an(ol.style.Stroke);
        expect(strokeStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
        expect(strokeStyle.getWidth()).to.be(9);
        expect(style.getText()).to.be(null);
        expect(style.getZIndex()).to.be(undefined);
      });

      it('disables the fill when fill is \'0\'', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <LineStyle>' +
            '        <color>12345678</color>' +
            '        <width>9</width>' +
            '      </LineStyle>' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '        <fill>0</fill>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        expect(style.getFill()).to.be(null);
        expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
        var strokeStyle = style.getStroke();
        expect(strokeStyle).to.be.an(ol.style.Stroke);
        expect(strokeStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
        expect(strokeStyle.getWidth()).to.be(9);
        expect(style.getText()).to.be(null);
        expect(style.getZIndex()).to.be(undefined);
      });

      it('disables the stroke when outline is \'0\'', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '    <Style>' +
            '      <LineStyle>' +
            '        <color>12345678</color>' +
            '        <width>9</width>' +
            '      </LineStyle>' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '        <outline>0</outline>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        var fillStyle = style.getFill();
        expect(fillStyle).to.be.an(ol.style.Fill);
        expect(fillStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
        expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
        expect(style.getStroke()).to.be(null);
        expect(style.getText()).to.be(null);
        expect(style.getZIndex()).to.be(undefined);
      });

      it('disables both fill and stroke when fill and outline are \'0\'',
          function() {
            var text =
                '<kml xmlns="http://earth.google.com/kml/2.2">' +
                '  <Placemark>' +
                '    <Style>' +
                '      <LineStyle>' +
                '        <color>12345678</color>' +
                '        <width>9</width>' +
                '      </LineStyle>' +
                '      <PolyStyle>' +
                '        <color>12345678</color>' +
                '        <fill>0</fill>' +
                '        <outline>0</outline>' +
                '      </PolyStyle>' +
                '    </Style>' +
                '  </Placemark>' +
                '</kml>';
            var fs = format.readFeatures(text);
            expect(fs).to.have.length(1);
            var f = fs[0];
            expect(f).to.be.an(ol.Feature);
            var styleFunction = f.getStyleFunction();
            expect(styleFunction).not.to.be(undefined);
            var styleArray = styleFunction.call(f, 0);
            expect(styleArray).to.be.an(Array);
            expect(styleArray).to.have.length(1);
            var style = styleArray[0];
            expect(style).to.be.an(ol.style.Style);
            expect(style.getFill()).to.be(null);
            expect(style.getImage()).to.be(ol.format.KML.DEFAULT_IMAGE_STYLE_);
            expect(style.getStroke()).to.be(null);
            expect(style.getText()).to.be(null);
            expect(style.getZIndex()).to.be(undefined);
          });

    });

    describe('style maps', function() {

      it('can read a normal style', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark id="a">' +
            '      <StyleMap>' +
            '        <Pair>' +
            '          <key>normal</key>' +
            '          <Style>' +
            '            <PolyStyle>' +
            '              <color>00000000</color>' +
            '            </PolyStyle>' +
            '          </Style>' +
            '        </Pair>' +
            '      </StyleMap>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var s = styleArray[0];
        expect(s).to.be.an(ol.style.Style);
        expect(s.getFill()).not.to.be(null);
        expect(s.getFill().getColor()).to.eql([0, 0, 0, 0]);
      });

      it('ignores highlight styles', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark>' +
            '      <StyleMap>' +
            '        <Pair>' +
            '          <key>highlighted</key>' +
            '          <Style>' +
            '            <PolyStyle>' +
            '              <color>00000000</color>' +
            '            </PolyStyle>' +
            '          </Style>' +
            '        </Pair>' +
            '      </StyleMap>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var s = styleArray[0];
        expect(s).to.be.an(ol.style.Style);
        expect(s).to.be(ol.format.KML.DEFAULT_STYLE_);

      });

      it('uses normal styles instead of highlight styles', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark id="a">' +
            '      <StyleMap>' +
            '        <Pair>' +
            '          <key>normal</key>' +
            '          <Style>' +
            '            <PolyStyle>' +
            '              <color>00000000</color>' +
            '            </PolyStyle>' +
            '          </Style>' +
            '        </Pair>' +
            '        <Pair>' +
            '          <key>highlighted</key>' +
            '          <Style>' +
            '            <PolyStyle>' +
            '              <color>ffffffff</color>' +
            '            </PolyStyle>' +
            '          </Style>' +
            '        </Pair>' +
            '      </StyleMap>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var s = styleArray[0];
        expect(s).to.be.an(ol.style.Style);
        expect(s.getFill()).not.to.be(null);
        expect(s.getFill().getColor()).to.eql([0, 0, 0, 0]);
      });

      it('can read normal styleUrls', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Style id="foo">' +
            '      <PolyStyle>' +
            '        <color>00000000</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <StyleMap>' +
            '        <Pair>' +
            '          <key>normal</key>' +
            '          <styleUrl>#foo</styleUrl>' +
            '        </Pair>' +
            '      </StyleMap>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var s = styleArray[0];
        expect(s).to.be.an(ol.style.Style);
        expect(s.getFill()).not.to.be(null);
        expect(s.getFill().getColor()).to.eql([0, 0, 0, 0]);
      });

      it('ignores highlighted styleUrls', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Style id="foo">' +
            '      <PolyStyle>' +
            '        <color>00000000</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <StyleMap>' +
            '        <Pair>' +
            '          <key>highlighted</key>' +
            '          <styleUrl>#foo</styleUrl>' +
            '        </Pair>' +
            '      </StyleMap>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var s = styleArray[0];
        expect(s).to.be.an(ol.style.Style);
        expect(s).to.be(ol.format.KML.DEFAULT_STYLE_);
      });

      it('can use Styles in StyleMaps before they are defined', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <StyleMap id="fooMap">' +
            '      <Pair>' +
            '        <key>normal</key>' +
            '        <styleUrl>#foo</styleUrl>' +
            '       </Pair>' +
            '    </StyleMap>' +
            '    <Style id="foo">' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <styleUrl>#fooMap</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var s = styleArray[0];
        expect(s).to.be.an(ol.style.Style);
        expect(s.getFill()).not.to.be(null);
        expect(s.getFill().getColor()).to.eql([120, 86, 52, 18 / 255]);
      });

    });

    describe('shared styles', function() {

      it('can apply a shared style to a feature', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Style id="foo">' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <Placemark>' +
            '      <styleUrl>#foo</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        var fillStyle = style.getFill();
        expect(fillStyle).to.be.an(ol.style.Fill);
        expect(fillStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
      });

      it('can read a shared style from a Folder', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Folder>' +
            '      <Style id="foo">' +
            '        <PolyStyle>' +
            '          <color>12345678</color>' +
            '        </PolyStyle>' +
            '      </Style>' +
            '    </Folder>' +
            '    <Placemark>' +
            '      <styleUrl>#foo</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var styleFunction = f.getStyleFunction();
        expect(styleFunction).not.to.be(undefined);
        var styleArray = styleFunction.call(f, 0);
        expect(styleArray).to.be.an(Array);
        expect(styleArray).to.have.length(1);
        var style = styleArray[0];
        expect(style).to.be.an(ol.style.Style);
        var fillStyle = style.getFill();
        expect(fillStyle).to.be.an(ol.style.Fill);
        expect(fillStyle.getColor()).to.eql([0x78, 0x56, 0x34, 0x12 / 255]);
      });

      it('can apply a shared style to multiple features', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Style id="foo">' +
            '      <PolyStyle>' +
            '        <color>12345678</color>' +
            '      </PolyStyle>' +
            '    </Style>' +
            '    <Placemark id="a">' +
            '      <styleUrl>#foo</styleUrl>' +
            '    </Placemark>' +
            '    <Placemark id="b">' +
            '      <styleUrl>#foo</styleUrl>' +
            '    </Placemark>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(2);
        var f1 = fs[0];
        expect(f1).to.be.an(ol.Feature);
        var styleFunction1 = f1.getStyleFunction();
        expect(styleFunction1).not.to.be(undefined);
        var styleArray1 = styleFunction1.call(f1, 0);
        expect(styleArray1).to.be.an(Array);
        var f2 = fs[1];
        expect(f2).to.be.an(ol.Feature);
        var styleFunction2 = f2.getStyleFunction();
        expect(styleFunction2).not.to.be(undefined);
        var styleArray2 = styleFunction2.call(f2, 0);
        expect(styleArray2).to.be.an(Array);
        expect(styleArray1).to.be(styleArray2);
      });

    });

    describe('multiple features', function() {

      it('returns no features from an empty Document', function() {
        var text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '</Document>';
        var fs = format.readFeatures(text);
        expect(fs).to.be.empty();
      });

      it('can read a single feature from a Document', function() {
        var text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '  </Placemark>' +
            '</Document>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        expect(fs[0]).to.be.an(ol.Feature);
      });

      it('can read a multiple features from a Document', function() {
        var text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="1">' +
            '  </Placemark>' +
            '  <Placemark id="2">' +
            '  </Placemark>' +
            '</Document>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(2);
        expect(fs[0]).to.be.an(ol.Feature);
        expect(fs[0].getId()).to.be('1');
        expect(fs[1]).to.be.an(ol.Feature);
        expect(fs[1].getId()).to.be('2');
      });

      it('returns no features from an empty Folder', function() {
        var text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '</Folder>';
        var fs = format.readFeatures(text);
        expect(fs).to.be.empty();
      });

      it('can read a single feature from a Folder', function() {
        var text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark>' +
            '  </Placemark>' +
            '</Folder>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        expect(fs[0]).to.be.an(ol.Feature);
      });

      it('can read a multiple features from a Folder', function() {
        var text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark id="1">' +
            '  </Placemark>' +
            '  <Placemark id="2">' +
            '  </Placemark>' +
            '</Folder>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(2);
        expect(fs[0]).to.be.an(ol.Feature);
        expect(fs[0].getId()).to.be('1');
        expect(fs[1]).to.be.an(ol.Feature);
        expect(fs[1].getId()).to.be('2');
      });

      it('can read features from Folders nested in Documents', function() {
        var text =
            '<Document xmlns="http://earth.google.com/kml/2.2">' +
            '  <Folder>' +
            '    <Placemark>' +
            '    </Placemark>' +
            '  </Folder>' +
            '</Document>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        expect(fs[0]).to.be.an(ol.Feature);
      });

      it('can read features from Folders nested in Folders', function() {
        var text =
            '<Folder xmlns="http://earth.google.com/kml/2.2">' +
            '  <Folder>' +
            '    <Placemark>' +
            '    </Placemark>' +
            '  </Folder>' +
            '</Folder>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        expect(fs[0]).to.be.an(ol.Feature);
      });

      it('can read a single feature', function() {
        var text =
            '<Placemark xmlns="http://earth.google.com/kml/2.2">' +
            '</Placemark>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(1);
        expect(fs[0]).to.be.an(ol.Feature);
      });

      it('can read features at multiple levels', function() {
        var text =
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Document>' +
            '    <Placemark id="a"/>' +
            '    <Folder>' +
            '      <Placemark id="b"/>' +
            '      <Folder>' +
            '        <Placemark id="c"/>' +
            '      </Folder>' +
            '      <Placemark id="d"/>' +
            '    </Folder>' +
            '    <Placemark id="e"/>' +
            '  </Document>' +
            '</kml>';
        var fs = format.readFeatures(text);
        expect(fs).to.have.length(5);
        expect(fs[0]).to.be.an(ol.Feature);
        expect(fs[0].getId()).to.be('a');
        expect(fs[1]).to.be.an(ol.Feature);
        expect(fs[1].getId()).to.be('b');
        expect(fs[2]).to.be.an(ol.Feature);
        expect(fs[2].getId()).to.be('c');
        expect(fs[3]).to.be.an(ol.Feature);
        expect(fs[3].getId()).to.be('d');
        expect(fs[4]).to.be.an(ol.Feature);
        expect(fs[4].getId()).to.be('e');
      });

      it('supports common namespaces', function() {
        expect(format.readFeatures(
            '<kml xmlns="http://earth.google.com/kml/2.0">' +
            '  <Placemark/>' +
            '</kml>')).to.have.length(1);
        expect(format.readFeatures(
            '<kml xmlns="http://earth.google.com/kml/2.2">' +
            '  <Placemark/>' +
            '</kml>')).to.have.length(1);
        expect(format.readFeatures(
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark/>' +
            '</kml>')).to.have.length(1);
      });

      it('ignores unknown namespaces', function() {
        expect(format.readFeatures(
            '<kml xmlns="http://example.com/notkml/1.0">' +
            '  <Placemark/>' +
            '</kml>')).to.be.empty();
      });

    });

    describe('error handling', function() {

      it('should ignore invalid coordinates', function() {
        var doc = goog.dom.xml.loadXml('<coordinates>INVALID</coordinates>');
        var node = doc.firstChild;
        expect(ol.format.KML.readFlatCoordinates_(node)).to.be(undefined);
      });

      it('should ignore Points with invalid coordinates', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Point>' +
            '      <coordinates>INVALID COORDINATES</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.getGeometry()).to.be(null);
      });

      it('should ignore LineStrings with invalid coordinates', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Point>' +
            '      <coordinates>INVALID COORDINATES</coordinates>' +
            '    </Point>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.getGeometry()).to.be(null);
      });

      it('should ignore Polygons with no rings', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Polygon>' +
            '      <coordinates>INVALID COORDINATES</coordinates>' +
            '    </Polygon>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.getGeometry()).to.be(null);
      });

      it('should ignore Polygons with no outer ring', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <Polygon>' +
            '      <innerRingIs>' +
            '        <LinearRing>' +
            '          <coordinates>1,2,3 4,5,6 7,8,9</coordinates>' +
            '        </LinearRing>' +
            '      </innerRingIs>' +
            '    </Polygon>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.getGeometry()).to.be(null);
      });

      it('should ignore geometries with invalid coordinates', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <MultiGeometry>' +
            '      <Point>' +
            '        <coordinates>INVALID COORDINATES</coordinates>' +
            '      </Point>' +
            '    </MultiGeometry>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        var g = f.getGeometry();
        expect(g).to.be.an(ol.geom.GeometryCollection);
        expect(g.getGeometries()).to.be.empty();
      });

      it('should ignore invalid booleans', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark>' +
            '    <visibility>foo</visibility>' +
            '  </Placemark>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(1);
        var f = fs[0];
        expect(f).to.be.an(ol.Feature);
        expect(f.get('visibility')).to.be(undefined);
      });

      it('parse all valid features in a Folder, without error', function() {
        var kml =
            '<kml xmlns="http://www.opengis.net/kml/2.2">' +
            '  <Placemark id="a"/>' +
            '  <Folder>' +
            '    <Placemark id="b"/>' +
            '    <Placemark id="c">' +
            '      <visibility>foo</visibility>' +
            '    </Placemark>' +
            '    <Placemark id="d"/>' +
            '  </Folder>' +
            '  <Placemark id="e"/>' +
            '</kml>';
        var fs = format.readFeatures(kml);
        expect(fs).to.be.an(Array);
        expect(fs).to.have.length(5);
        expect(fs[0]).to.be.an(ol.Feature);
        expect(fs[0].getId()).to.be('a');
        expect(fs[1]).to.be.an(ol.Feature);
        expect(fs[1].getId()).to.be('b');
        expect(fs[2]).to.be.an(ol.Feature);
        expect(fs[2].getId()).to.be('c');
        expect(fs[3]).to.be.an(ol.Feature);
        expect(fs[3].getId()).to.be('d');
        expect(fs[4]).to.be.an(ol.Feature);
        expect(fs[4].getId()).to.be('e');
      });

    });

  });

  describe('when parsing states.kml', function() {

    var features;
    before(function(done) {
      afterLoadText('spec/ol/format/kml/states.kml', function(xml) {
        try {
          features = format.readFeatures(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('creates 50 features', function() {
      expect(features).to.have.length(50);
    });

    it('creates features with heterogenous geometry collections', function() {
      // FIXME decide if we should instead create features with multiple geoms
      var feature = features[0];
      expect(feature).to.be.an(ol.Feature);
      var geometry = feature.getGeometry();
      expect(geometry).to.be.an(ol.geom.GeometryCollection);
    });

    it('creates a Point and a MultiPolygon for Alaska', function() {
      var alaska = goog.array.find(features, function(feature) {
        return feature.get('name') === 'Alaska';
      });
      expect(alaska).to.be.an(ol.Feature);
      var geometry = alaska.getGeometry();
      expect(geometry).to.be.an(ol.geom.GeometryCollection);
      var components = geometry.getGeometries();
      expect(components).to.have.length(2);
      expect(components[0]).to.be.an(ol.geom.Point);
      expect(components[1]).to.be.an(ol.geom.MultiPolygon);
    });

  });

  describe('#readName', function() {

    it('returns undefined if there is no name', function() {
      var kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <Folder>' +
          '     <Placemark/>' +
          '    </Folder>' +
          '  </Document>' +
          '</kml>';
      expect(format.readName(kml)).to.be(undefined);
    });

    it('returns the name of the first Document', function() {
      var kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <name>Document name</name>' +
          '  </Document>' +
          '</kml>';
      expect(format.readName(kml)).to.be('Document name');
    });

    it('returns the name of the first Folder', function() {
      var kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Folder>' +
          '    <name>Folder name</name>' +
          '  </Folder>' +
          '</kml>';
      expect(format.readName(kml)).to.be('Folder name');
    });

    it('returns the name of the first Placemark', function() {
      var kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Placemark>' +
          '    <name>Placemark name</name>' +
          '  </Placemark>' +
          '</kml>';
      expect(format.readName(kml)).to.be('Placemark name');
    });

    it('searches breadth-first', function() {
      var kml =
          '<kml xmlns="http://www.opengis.net/kml/2.2">' +
          '  <Document>' +
          '    <Placemark>' +
          '      <name>Placemark name</name>' +
          '    </Placemark>' +
          '    <name>Document name</name>' +
          '  </Document>' +
          '</kml>';
      expect(format.readName(kml)).to.be('Document name');
    });

  });

});


goog.require('goog.array');
goog.require('goog.dom.xml');
goog.require('ol.Feature');
goog.require('ol.format.KML');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.style.Fill');
goog.require('ol.style.Icon');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
