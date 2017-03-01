goog.provide('ol.test.format.WMSGetFeatureInfo');

goog.require('ol.format.WMSGetFeatureInfo');


describe('ol.format.WMSGetFeatureInfo', function() {

  describe('#readFormat', function() {

    describe('read Features', function() {

      var features;

      before(function(done) {
        proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
        afterLoadText('spec/ol/format/wms/getfeatureinfo.xml', function(data) {
          try {
            features = new ol.format.WMSGetFeatureInfo().readFeatures(data);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      after(function() {
        proj4.defs('urn:x-ogc:def:crs:EPSG:4326', undefined);
      });

      it('creates 3 features', function() {
        expect(features).to.have.length(3);
      });

      it('creates a feature for 1071', function() {
        var feature = features[0];
        expect(feature.getId()).to.be(undefined);
        expect(feature.get('FID')).to.equal('1071');
        expect(feature.get('NO_CAMPAGNE')).to.equal('1020050');
      });

      it('read boundedBy but no geometry', function() {
        var feature = features[0];
        expect(feature.getGeometry()).to.be(undefined);
        expect(feature.get('boundedBy')).to.eql(
            [-531138.686422, 5386348.414671, -117252.819653, 6144475.186022]);
      });

      it('read empty response', function() {
        // read empty response
        var text = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<msGMLOutput xmlns:gml="http://www.opengis.net/gml"' +
            '  xmlns:xlink="http://www.w3.org/1999/xlink"' +
            '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '  <AAA64_layer>' +
            '  </AAA64_layer>' +
            '</msGMLOutput>';
        var features = new ol.format.WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).to.be(0);
      });

      it('read empty attributes', function() {
        var text =
            '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<msGMLOutput ' +
            '   xmlns:gml="http://www.opengis.net/gml"' +
            '   xmlns:xlink="http://www.w3.org/1999/xlink"' +
            '   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '  <AAA64_layer>' +
            '    <AAA64_feature>' +
            '      <gml:boundedBy>' +
            '        <gml:Box srsName="EPSG:4326">' +
            '        <gml:coordinates>' +
            '        107397.266000,460681.063000 116568.188000,480609.250000' +
            '        </gml:coordinates>' +
            '        </gml:Box>' +
            '      </gml:boundedBy>' +
            '      <FOO>bar</FOO>' +
            '      <EMPTY></EMPTY>' +
            '    </AAA64_feature>' +
            '  </AAA64_layer>' +
            '</msGMLOutput>';
        var features = new ol.format.WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).to.be(1);
        expect(features[0].get('FOO')).to.be('bar');
        // FIXME is that really wanted ?
        expect(features[0].get('EMPTY')).to.be(undefined);
      });

      it('read features from multiple layers', function() {
        var text =
            '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<msGMLOutput ' +
            '  xmlns:gml="http://www.opengis.net/gml"' +
            '  xmlns:xlink="http://www.w3.org/1999/xlink"' +
            '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '  <AAA64_layer>' +
            '   <AAA64_feature>' +
            '     <gml:boundedBy>' +
            '       <gml:Box srsName="EPSG:4326">' +
            '       <gml:coordinates>' +
            '       129799.109000,467950.250000 133199.906000,468904.063000' +
            '       </gml:coordinates>' +
            '       </gml:Box>' +
            '     </gml:boundedBy>' +
            '     <OBJECTID>287</OBJECTID>' +
            '     <ROUTE>N403</ROUTE>' +
            '     <ROUTE_CH>#N403</ROUTE_CH>' +
            '     <COUNT>1</COUNT>' +
            '     <BEHEERDER>P</BEHEERDER>' +
            '     <LENGTH>4091.25</LENGTH>' +
            '     <SHAPE>&lt;shape&gt;</SHAPE>' +
            '     <SE_ANNO_CAD_DATA>&lt;null&gt;</SE_ANNO_CAD_DATA>' +
            '   </AAA64_feature>' +
            '  </AAA64_layer>' +
            '  <AAA62_layer>' +
            '   <AAA62_feature>' +
            '     <gml:boundedBy>' +
            '       <gml:Box srsName="EPSG:4326">' +
            '        <gml:coordinates>' +
            '        129936.000000,468362.000000 131686.000000,473119.000000' +
            '        </gml:coordinates>' +
            '       </gml:Box>' +
            '     </gml:boundedBy>' +
            '     <OBJECTID>1251</OBJECTID>' +
            '     <VWK_ID>1515</VWK_ID>' +
            '     <VWK_BEGDTM>00:00:00 01/01/1998</VWK_BEGDTM>' +
            '     <VWJ_ID_BEG>1472</VWJ_ID_BEG>' +
            '     <VWJ_ID_END>1309</VWJ_ID_END>' +
            '     <VAKTYPE>D</VAKTYPE>' +
            '     <VRT_CODE>227</VRT_CODE>' +
            '     <VRT_NAAM>Vecht</VRT_NAAM>' +
            '     <VWG_NR>2</VWG_NR>' +
            '     <VWG_NAAM>Vecht</VWG_NAAM>' +
            '     <BEGKM>18.25</BEGKM>' +
            '     <ENDKM>23.995</ENDKM>' +
            '     <LENGTH>5745.09</LENGTH>' +
            '     <SHAPE>&lt;shape&gt;</SHAPE>' +
            '     <SE_ANNO_CAD_DATA>&lt;null&gt;</SE_ANNO_CAD_DATA>' +
            '   </AAA62_feature>' +
            '  </AAA62_layer>' +
            '</msGMLOutput>';
        var features = new ol.format.WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).to.be(2);
        expect(features[0].get('OBJECTID')).to.be('287');
        expect(features[1].get('OBJECTID')).to.be('1251');
        var aaa64Features = new ol.format.WMSGetFeatureInfo({
          layers: ['AAA64']
        }).readFeatures(text);
        expect(aaa64Features.length).to.be(1);
        var allFeatures = new ol.format.WMSGetFeatureInfo({
          layers: ['AAA64', 'AAA62']
        }).readFeatures(text);
        expect(allFeatures.length).to.be(2);
        var dummyFeatures = new ol.format.WMSGetFeatureInfo({
          layers: ['foo', 'bar']
        }).readFeatures(text);
        expect(dummyFeatures.length).to.be(0);
      });

      it('read geoserver’s response', function() {
        var text =
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<wfs:FeatureCollection xmlns="http://www.opengis.net/wfs"' +
            '  xmlns:wfs="http://www.opengis.net/wfs"' +
            '   xmlns:opengeo="http://opengeo.org"' +
            '   xmlns:gml="http://www.opengis.net/gml"' +
            '   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
            '   xsi:schemaLocation="http://opengeo.org ' +
            '   http://demo.opengeo.org:80/geoserver/wfs?service=WFS&amp;' +
            'version=1.0.0&amp;request=DescribeFeatureType&amp;' +
            'typeName=opengeo:roads http://www.opengis.net/wfs ' +
            '   http://demo.opengeo.org:80/geoserver/schemas/wfs/1.0.0/' +
            'WFS-basic.xsd">' +
            '  <gml:boundedBy>' +
            '    <gml:Box' +
            ' srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
            '      <gml:coordinates xmlns:gml="http://www.opengis.net/gml"' +
            '        decimal="." cs="," ts=" ">' +
            '591943.9375,4925605 593045.625,4925845' +
            '      </gml:coordinates>' +
            '    </gml:Box>' +
            '  </gml:boundedBy>' +
            '  <gml:featureMember>' +
            '    <opengeo:roads fid="roads.90">' +
            '      <opengeo:cat>3</opengeo:cat>' +
            '      <opengeo:label>secondary highway, hard surface' +
            '      </opengeo:label>' +
            '      <opengeo:the_geom>' +
            '        <gml:MultiLineString' +
            '  srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
            '        <gml:lineStringMember>' +
            '        <gml:LineString>' +
            '        <gml:coordinates xmlns:gml="http://www.opengis.net/gml"' +
            ' decimal="." cs="," ts=" ">' +
            '593045.60746465,4925605.0059156 593024.32382915,4925606.79305411' +
            ' 592907.54863574,4925624.85647524 592687.35111096,' +
            '4925670.76834012 592430.76279218,4925678.79393165' +
            ' 592285.97636109,4925715.70811767 592173.39165655,' +
            '4925761.83511156 592071.1753393,4925793.95523514' +
            ' 591985.96972625,4925831.59842486' +
            ' 591943.98769455,4925844.93220071' +
            '        </gml:coordinates>' +
            '        </gml:LineString>' +
            '        </gml:lineStringMember>' +
            '        </gml:MultiLineString>' +
            '      </opengeo:the_geom>' +
            '    </opengeo:roads>' +
            '  </gml:featureMember>' +
            '</wfs:FeatureCollection>';
        var features = new ol.format.WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).to.be(1);
        expect(features[0].get('cat')).to.be('3');
        expect(features[0].getGeometry().getType()).to.be('MultiLineString');
      });

    });
  });
});
