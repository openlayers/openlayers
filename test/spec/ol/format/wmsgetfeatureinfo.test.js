import WMSGetFeatureInfo from '../../../../src/ol/format/WMSGetFeatureInfo.js';
import {addCommon, clearAllProjections} from '../../../../src/ol/proj.js';
import {register} from '../../../../src/ol/proj/proj4.js';


describe('ol.format.WMSGetFeatureInfo', () => {

  describe('#getLayers', () => {

    test('returns null if layers is undefined', () => {
      const format = new WMSGetFeatureInfo();
      expect(format.getLayers()).toBe(null);
    });

    test('returns the value provided in the layers option', () => {
      const format = new WMSGetFeatureInfo({
        layers: ['a', 'z']
      });
      expect(format.getLayers()).toEqual(['a', 'z']);
    });

  });

  describe('#readFormat', () => {

    describe('read Features', () => {

      let features;

      beforeAll(function(done) {
        proj4.defs('urn:x-ogc:def:crs:EPSG:4326', proj4.defs('EPSG:4326'));
        register(proj4);
        afterLoadText('spec/ol/format/wms/getfeatureinfo.xml', function(data) {
          try {
            features = new WMSGetFeatureInfo().readFeatures(data);
          } catch (e) {
            done(e);
          }
          done();
        });
      });

      afterAll(function() {
        delete proj4.defs['urn:x-ogc:def:crs:EPSG:4326'];
        clearAllProjections();
        addCommon();
      });

      test('creates 3 features', () => {
        expect(features).toHaveLength(3);
      });

      test('creates a feature for 1071', () => {
        const feature = features[0];
        expect(feature.getId()).toBe(undefined);
        expect(feature.get('FID')).toBe('1071');
        expect(feature.get('NO_CAMPAGNE')).toBe('1020050');
      });

      test('read boundedBy but no geometry', () => {
        const feature = features[0];
        expect(feature.getGeometry()).toBe(undefined);
        expect(feature.get('boundedBy')).toEqual([-531138.686422, 5386348.414671, -117252.819653, 6144475.186022]);
      });

      test('read empty response', () => {
        // read empty response
        const text = '<?xml version="1.0" encoding="ISO-8859-1"?>' +
            '<msGMLOutput xmlns:gml="http://www.opengis.net/gml"' +
            '  xmlns:xlink="http://www.w3.org/1999/xlink"' +
            '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '  <AAA64_layer>' +
            '  </AAA64_layer>' +
            '</msGMLOutput>';
        const features = new WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).toBe(0);
      });

      test('read empty attributes', () => {
        const text =
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
        const features = new WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).toBe(1);
        expect(features[0].get('FOO')).toBe('bar');
        expect(features[0].get('EMPTY')).toBe(undefined);
      });

      test('read features from multiple layers', () => {
        const text =
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
        const format = new WMSGetFeatureInfo();
        const features = format.readFeatures(text);
        expect(features.length).toBe(2);
        expect(features[0].get('OBJECTID')).toBe('287');
        expect(features[1].get('OBJECTID')).toBe('1251');
        format.setLayers(['AAA64']);
        const aaa64Features = format.readFeatures(text);
        expect(aaa64Features.length).toBe(1);
        format.setLayers(['AAA64', 'AAA62']);
        const allFeatures = format.readFeatures(text);
        expect(allFeatures.length).toBe(2);
        format.setLayers(['foo', 'bar']);
        const dummyFeatures = format.readFeatures(text);
        expect(dummyFeatures.length).toBe(0);
      });

      test('read geoserver’s response', () => {
        const text =
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
        const features = new WMSGetFeatureInfo().readFeatures(text);
        expect(features.length).toBe(1);
        expect(features[0].get('cat')).toBe('3');
        expect(features[0].getGeometry().getType()).toBe('MultiLineString');
      });

    });
  });
});
