goog.provide('ol.test.parser.ogc.WMSCapabilities_v1_1_1_WMSC');

describe('ol.parser.ogc.wmscapabilities_v1_1_1_wmsc', function() {

  var parser = new ol.parser.ogc.WMSCapabilities({
    profile: 'WMSC',
    allowFallback: true
  });

  describe('test read', function() {
    it('Test read', function() {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1_WMSC/wmsc.xml';
      afterLoadXml(url, function(xml) {
        var obj, tilesets, tileset;
        obj = parser.read(xml);
        tilesets = obj.capability.vendorSpecific.tileSets;
        tileset = tilesets[0];
        expect(tilesets.length).to.eql(2);
        var bbox = [-13697515.466796875, 5165920.118906248,
          -13619243.94984375, 5244191.635859374];
        expect(tileset.bbox['EPSG:900913'].bbox).to.eql(bbox);
        expect(tileset.format).to.eql('image/png');
        expect(tileset.height).to.eql(256);
        expect(tileset.width).to.eql(256);
        expect(tileset.layers).to.eql('medford:hydro');
        expect(tileset.srs['EPSG:900913']).to.be.ok();
        var resolutions = [156543.03390625, 78271.516953125, 39135.7584765625,
          19567.87923828125, 9783.939619140625, 4891.9698095703125,
          2445.9849047851562, 1222.9924523925781, 611.4962261962891,
          305.74811309814453, 152.87405654907226, 76.43702827453613,
          38.218514137268066, 19.109257068634033, 9.554628534317017,
          4.777314267158508, 2.388657133579254, 1.194328566789627,
          0.5971642833948135, 0.29858214169740677, 0.14929107084870338,
          0.07464553542435169, 0.037322767712175846, 0.018661383856087923,
          0.009330691928043961, 0.004665345964021981];
        expect(tileset.resolutions).to.eql(resolutions);
        expect(tileset.styles).to.eql('');
      });
    });
  });

  describe('test fallback', function() {
    it('Test fallback', function() {
      var url = 'spec/ol/parser/ogc/xml/wmscapabilities_v1_1_1_WMSC/' +
          'fallback.xml';
      afterLoadXml(url, function(xml) {
        var obj;
        obj = parser.read(xml);
        expect(obj.capability.layers.length).to.eql(2);
      });
    });
  });

});

goog.require('goog.net.XhrIo');
goog.require('ol.parser.ogc.WMSCapabilities');
