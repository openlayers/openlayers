import WMSCapabilities from '../../../../src/ol/format/WMSCapabilities.js';

describe('ol.format.WMSCapabilities', () => {

  describe('when parsing ogcsample.xml', () => {

    const parser = new WMSCapabilities();
    let capabilities;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wms/ogcsample.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('can read version', () => {
      expect(capabilities.version).toEqual('1.3.0');
    });

    test('can read Service section', () => {
      // FIXME not all fields are tested
      const service = capabilities.Service;
      const contact = service.ContactInformation;

      expect(service.Name).toEqual('WMS');
      expect(service.Title).toEqual('Acme Corp. Map Server');
      expect(service.KeywordList).toEqual(['bird', 'roadrunner', 'ambush']);
      expect(service.OnlineResource).toEqual('http://hostname/');
      expect(service.Fees).toEqual('none');
      expect(service.AccessConstraints).toEqual('none');
      expect(service.LayerLimit).toEqual(16);
      expect(service.MaxWidth).toEqual(2048);
      expect(service.MaxHeight).toEqual(2048);

      expect(contact.ContactPosition).toEqual('Computer Scientist');
      expect(contact.ContactPersonPrimary).toEqual({
        ContactPerson: 'Jeff Smith',
        ContactOrganization: 'NASA'
      });
    });

    test('can read Capability.Exception', () => {
      const exception = capabilities.Capability.Exception;

      expect(exception).toEqual(['XML', 'INIMAGE', 'BLANK']);
    });

    test('can read Capability.Request.GetCapabilities', () => {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      expect(getCapabilities.Format).toEqual(['text/xml']);
      expect(getCapabilities.DCPType.length).toEqual(1);
      const http = getCapabilities.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).toEqual('http://hostname/path?');
      expect(http.Post.OnlineResource).toEqual('http://hostname/path?');
    });

    test('can read Capability.Request.GetFeatureInfo', () => {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      expect(getFeatureInfo.Format).toEqual(['text/xml', 'text/plain', 'text/html']);
      expect(getFeatureInfo.DCPType.length).toEqual(1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).toEqual('http://hostname/path?');
    });

    test('can read Capability.Request.GetMap', () => {
      const getMap = capabilities.Capability.Request.GetMap;

      expect(getMap.Format).toEqual(['image/gif', 'image/png', 'image/jpeg']);
      expect(getMap.DCPType.length).toEqual(1);
      const http = getMap.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).toEqual('http://hostname/path?');
    });

    test('can read Capability.Layer', () => {
      const layer = capabilities.Capability.Layer;

      expect(layer.Title).toEqual('Acme Corp. Map Server');
      expect(layer.Name).toBe(undefined);
      expect(layer.CRS).toEqual(['CRS:84']);
      expect(layer.AuthorityURL).toEqual([{
        name: 'DIF_ID',
        OnlineResource: 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html'
      }]);
      expect(layer.BoundingBox).toEqual([{
        crs: 'CRS:84',
        extent: [-1, -1, 1, 1],
        res: [0, 0]
      }]);

      expect(layer.Layer.length).toEqual(4);
      expect(layer.Layer[0].Name).toEqual('ROADS_RIVERS');
      expect(layer.Layer[0].Title).toEqual('Roads and Rivers');
      expect(layer.Layer[0].CRS).toEqual(['EPSG:26986', 'CRS:84']);
      expect(layer.Layer[0].Identifier).toEqual(['123456']);
      expect(layer.Layer[0].BoundingBox).toEqual([{
        crs: 'CRS:84',
        extent: [-71.63, 41.75, -70.78, 42.9],
        res: [0.01, 0.01]
      }, {
        crs: 'EPSG:26986',
        extent: [189000, 834000, 285000, 962000],
        res: [1, 1]
      }]);
      expect(layer.Layer[0].EX_GeographicBoundingBox).toEqual([-71.63, 41.75, -70.78, 42.9]);
      expect(layer.Layer[0].Style).toEqual([{
        Name: 'USGS',
        Title: 'USGS Topo Map Style',
        Abstract: 'Features are shown in a style like that used in USGS ' +
            'topographic maps.',
        StyleSheetURL: {
          Format: 'text/xsl',
          OnlineResource: 'http://www.university.edu/stylesheets/usgs.xsl'
        },
        LegendURL: [{
          Format: 'image/gif',
          OnlineResource: 'http://www.university.edu/legends/usgs.gif',
          size: [72, 72]
        }]
      }]);
      expect(layer.Layer[0].FeatureListURL).toEqual([{
        Format: 'XML',
        OnlineResource: 'http://www.university.edu/data/roads_rivers.gml'
      }]);
      expect(layer.Layer[0].Attribution).toEqual({
        Title: 'State College University',
        OnlineResource: 'http://www.university.edu/',
        LogoURL: {
          Format: 'image/gif',
          OnlineResource: 'http://www.university.edu/icons/logo.gif',
          size: [100, 100]
        }
      });

    });


  });
});
