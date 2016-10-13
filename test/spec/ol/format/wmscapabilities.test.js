goog.provide('ol.test.format.WMSCapabilities');

goog.require('ol.format.WMSCapabilities');

describe('ol.format.WMSCapabilities', function() {

  describe('when parsing ogcsample.xml', function() {

    var parser = new ol.format.WMSCapabilities();
    var capabilities;
    before(function(done) {
      afterLoadText('spec/ol/format/wms/ogcsample.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read version', function() {
      expect(capabilities.version).to.eql('1.3.0');
    });

    it('can read Service section', function() {
      // FIXME not all fields are tested
      var service = capabilities.Service;
      var contact = service.ContactInformation;

      expect(service.Name).to.eql('WMS');
      expect(service.Title).to.eql('Acme Corp. Map Server');
      expect(service.KeywordList).to.eql(['bird', 'roadrunner', 'ambush']);
      expect(service.OnlineResource).to.eql('http://hostname/');
      expect(service.Fees).to.eql('none');
      expect(service.AccessConstraints).to.eql('none');
      expect(service.LayerLimit).to.eql(16);
      expect(service.MaxWidth).to.eql(2048);
      expect(service.MaxHeight).to.eql(2048);

      expect(contact.ContactPosition).to.eql('Computer Scientist');
      expect(contact.ContactPersonPrimary).to.eql({
        ContactPerson: 'Jeff Smith',
        ContactOrganization: 'NASA'
      });
    });

    it('can read Capability.Exception', function() {
      var exception = capabilities.Capability.Exception;

      expect(exception).to.eql(['XML', 'INIMAGE', 'BLANK']);
    });

    it('can read Capability.Request.GetCapabilities', function() {
      var getCapabilities = capabilities.Capability.Request.GetCapabilities;

      expect(getCapabilities.Format).to.eql(['text/xml']);
      expect(getCapabilities.DCPType.length).to.eql(1);
      var http = getCapabilities.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
      expect(http.Post.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Request.GetFeatureInfo', function() {
      var getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      expect(getFeatureInfo.Format).to.eql(
          ['text/xml', 'text/plain', 'text/html']);
      expect(getFeatureInfo.DCPType.length).to.eql(1);
      var http = getFeatureInfo.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Request.GetMap', function() {
      var getMap = capabilities.Capability.Request.GetMap;

      expect(getMap.Format).to.eql(['image/gif', 'image/png', 'image/jpeg']);
      expect(getMap.DCPType.length).to.eql(1);
      var http = getMap.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Layer', function() {
      var layer = capabilities.Capability.Layer;

      expect(layer.Title).to.eql('Acme Corp. Map Server');
      expect(layer.Name).to.be(undefined);
      expect(layer.CRS).to.eql(['CRS:84']);
      expect(layer.AuthorityURL).to.eql([{
        name: 'DIF_ID',
        OnlineResource: 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html'
      }]);
      expect(layer.BoundingBox).to.eql([{
        crs: 'CRS:84',
        extent: [-1, -1, 1, 1],
        res: [0, 0]
      }]);

      expect(layer.Layer.length).to.eql(4);
      expect(layer.Layer[0].Name).to.eql('ROADS_RIVERS');
      expect(layer.Layer[0].Title).to.eql('Roads and Rivers');
      expect(layer.Layer[0].CRS).to.eql(['EPSG:26986', 'CRS:84']);
      expect(layer.Layer[0].Identifier).to.eql(['123456']);
      expect(layer.Layer[0].BoundingBox).to.eql([{
        crs: 'CRS:84',
        extent: [-71.63, 41.75, -70.78, 42.9],
        res: [0.01, 0.01]
      }, {
        crs: 'EPSG:26986',
        extent: [189000, 834000, 285000, 962000],
        res: [1, 1]
      }]);
      expect(layer.Layer[0].EX_GeographicBoundingBox).to.eql(
          [-71.63, 41.75, -70.78, 42.9]);
      expect(layer.Layer[0].Style).to.eql([{
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
      expect(layer.Layer[0].FeatureListURL).to.eql([{
        Format: 'XML',
        OnlineResource: 'http://www.university.edu/data/roads_rivers.gml'
      }]);
      expect(layer.Layer[0].Attribution).to.eql({
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
