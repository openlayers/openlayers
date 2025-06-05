import WMSCapabilities from '../../../../../src/ol/format/WMSCapabilities.js';

describe('ol.format.WMSCapabilities', function () {
  describe('when parsing ogcsample.xml (v1.3.0)', function () {
    const parser = new WMSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wms/ogcsample130.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read version', function () {
      expect(capabilities.version).to.eql('1.3.0');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      expect(service.Name).to.eql('WMS');
      expect(service.Title).to.eql('Acme Corp. Map Server');
      expect(service.KeywordList).to.eql(['bird', 'roadrunner', 'ambush']);
      expect(service.OnlineResource).to.eql('http://hostname/');
      expect(service.Fees).to.eql('none');
      expect(service.AccessConstraints).to.eql('none');
      expect(service.LayerLimit).to.eql(16);
      expect(service.MaxWidth).to.eql(2048);
      expect(service.MaxHeight).to.eql(2048);

      const contact = service.ContactInformation;
      expect(contact.ContactPosition).to.eql('Computer Scientist');
      expect(contact.ContactPersonPrimary).to.eql({
        ContactPerson: 'Jeff Smith',
        ContactOrganization: 'NASA',
      });
      expect(contact.ContactAddress).to.eql({
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      expect(contact.ContactVoiceTelephone).to.eql('+1 301 555-1212');
      expect(contact.ContactElectronicMailAddress).to.eql('user@host.com');
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      expect(exception).to.eql(['XML', 'INIMAGE', 'BLANK']);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      expect(getCapabilities.Format).to.eql(['text/xml']);
      expect(getCapabilities.DCPType.length).to.eql(1);
      const http = getCapabilities.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
      expect(http.Post.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      expect(getFeatureInfo.Format).to.eql([
        'text/xml',
        'text/plain',
        'text/html',
      ]);
      expect(getFeatureInfo.DCPType.length).to.eql(1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      expect(getMap.Format).to.eql(['image/gif', 'image/png', 'image/jpeg']);
      expect(getMap.DCPType.length).to.eql(1);
      const http = getMap.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
    });

    it('should not have the SLD nodes', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      const getLegendGraphic = capabilities.Capability.Request.getLegendGraphic;
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      expect(describeLayer).to.eql(undefined);
      expect(getLegendGraphic).to.eql(undefined);
      expect(userDefinedSymbolization).to.eql(undefined);
    });

    it('can read Capability.Layer', function () {
      const layer = capabilities.Capability.Layer;
      expect(layer.Title).to.eql('Acme Corp. Map Server');
      expect(layer.Name).to.be(undefined);
      expect(layer.CRS).to.eql(['CRS:84']);
      expect(layer.AuthorityURL).to.eql([
        {
          name: 'DIF_ID',
          OnlineResource: 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
        },
      ]);
      expect(layer.BoundingBox).to.eql([
        {
          crs: 'CRS:84',
          extent: [-1, -1, 1, 1],
          res: [0, 0],
        },
      ]);

      expect(layer.Layer.length).to.eql(4);
      expect(layer.Layer[0].Name).to.eql('ROADS_RIVERS');
      expect(layer.Layer[0].Title).to.eql('Roads and Rivers');
      expect(layer.Layer[0].CRS).to.eql(['EPSG:26986', 'CRS:84']);
      expect(layer.Layer[0].Identifier).to.eql(['123456']);
      expect(layer.Layer[0].BoundingBox).to.eql([
        {
          crs: 'CRS:84',
          extent: [-71.63, 41.75, -70.78, 42.9],
          res: [0.01, 0.01],
        },
        {
          crs: 'EPSG:26986',
          extent: [189000, 834000, 285000, 962000],
          res: [1, 1],
        },
      ]);
      expect(layer.Layer[0].EX_GeographicBoundingBox).to.eql([
        -71.63, 41.75, -70.78, 42.9,
      ]);
      expect(layer.Layer[0].Style).to.eql([
        {
          Name: 'USGS',
          Title: 'USGS Topo Map Style',
          Abstract:
            'Features are shown in a style like that used in USGS ' +
            'topographic maps.',
          StyleSheetURL: {
            Format: 'text/xsl',
            OnlineResource: 'http://www.university.edu/stylesheets/usgs.xsl',
          },
          LegendURL: [
            {
              Format: 'image/gif',
              OnlineResource: 'http://www.university.edu/legends/usgs.gif',
              size: [72, 72],
            },
          ],
        },
      ]);
      expect(layer.Layer[0].FeatureListURL).to.eql([
        {
          Format: 'XML',
          OnlineResource: 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      expect(layer.Layer[0].Attribution).to.eql({
        Title: 'State College University',
        OnlineResource: 'http://www.university.edu/',
        LogoURL: {
          Format: 'image/gif',
          OnlineResource: 'http://www.university.edu/icons/logo.gif',
          size: [100, 100],
        },
      });
    });
  });

  describe('when parsing ogcsample.xml (v1.3.0) with SLD', function () {
    const parser = new WMSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wms/ogcsample130_sld.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read version', function () {
      expect(capabilities.version).to.eql('1.3.0');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      expect(service.Name).to.eql('WMS');
      expect(service.Title).to.eql('Acme Corp. Map Server');
      expect(service.KeywordList).to.eql(['bird', 'roadrunner', 'ambush']);
      expect(service.OnlineResource).to.eql('http://hostname/');
      expect(service.Fees).to.eql('none');
      expect(service.AccessConstraints).to.eql('none');
      expect(service.LayerLimit).to.eql(16);
      expect(service.MaxWidth).to.eql(2048);
      expect(service.MaxHeight).to.eql(2048);

      const contact = service.ContactInformation;
      expect(contact.ContactPosition).to.eql('Computer Scientist');
      expect(contact.ContactPersonPrimary).to.eql({
        ContactPerson: 'Jeff Smith',
        ContactOrganization: 'NASA',
      });
      expect(contact.ContactAddress).to.eql({
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      expect(contact.ContactVoiceTelephone).to.eql('+1 301 555-1212');
      expect(contact.ContactElectronicMailAddress).to.eql('user@host.com');
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      expect(exception).to.eql(['XML', 'INIMAGE', 'BLANK']);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      expect(getCapabilities.Format).to.eql(['text/xml']);
      expect(getCapabilities.DCPType.length).to.eql(1);
      const http = getCapabilities.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
      expect(http.Post.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      expect(getFeatureInfo.Format).to.eql([
        'text/xml',
        'text/plain',
        'text/html',
      ]);
      expect(getFeatureInfo.DCPType.length).to.eql(1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      expect(getMap.Format).to.eql(['image/gif', 'image/png', 'image/jpeg']);
      expect(getMap.DCPType.length).to.eql(1);
      const http = getMap.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname/path?');
    });

    it('can read the Capability.Request.GetLegendGraphic', function () {
      const getLegendGraphic = capabilities.Capability.Request.GetLegendGraphic;
      expect(getLegendGraphic).to.not.eql(undefined);
      expect(getLegendGraphic.Format).to.eql([
        'image/png',
        'image/png; mode=8bit',
        'image/jpeg',
        'image/vnd.jpeg-png',
        'image/vnd.jpeg-png8',
      ]);
      expect(getLegendGraphic.DCPType[0].HTTP.Get.OnlineResource).to.eql(
        'http://hostname/path?',
      );
      expect(getLegendGraphic.DCPType[0].HTTP.Post.OnlineResource).to.eql(
        'http://hostname/path?',
      );
    });

    it('can read the Capability.Request.DescribeLayer', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      expect(describeLayer).to.not.eql(undefined);
      expect(describeLayer.Format).to.eql(['application/vnd.ogc.gml']);
      expect(describeLayer.DCPType[0].HTTP.Get.OnlineResource).to.eql(
        'http://hostname/path?',
      );
    });

    it('can read the Capability.UserDefinedSymbolization', function () {
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      expect(userDefinedSymbolization.SupportSLD).to.eql(true);
      expect(userDefinedSymbolization.UserStyle).to.eql(true);
      expect(userDefinedSymbolization.UserLayer).to.eql(false);
      expect(userDefinedSymbolization.RemoteWFS).to.eql(false);
      expect(userDefinedSymbolization.InlineFeatureData).to.eql(false);
      expect(userDefinedSymbolization.RemoteWCS).to.eql(false);
    });

    it('can read Capability.Layer', function () {
      const layer = capabilities.Capability.Layer;
      expect(layer.Title).to.eql('Acme Corp. Map Server');
      expect(layer.Name).to.be(undefined);
      expect(layer.CRS).to.eql(['CRS:84']);
      expect(layer.AuthorityURL).to.eql([
        {
          name: 'DIF_ID',
          OnlineResource: 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
        },
      ]);
      expect(layer.BoundingBox).to.eql([
        {
          crs: 'CRS:84',
          extent: [-1, -1, 1, 1],
          res: [0, 0],
        },
      ]);

      expect(layer.Layer.length).to.eql(4);
      expect(layer.Layer[0].Name).to.eql('ROADS_RIVERS');
      expect(layer.Layer[0].Title).to.eql('Roads and Rivers');
      expect(layer.Layer[0].CRS).to.eql(['EPSG:26986', 'CRS:84']);
      expect(layer.Layer[0].Identifier).to.eql(['123456']);
      expect(layer.Layer[0].BoundingBox).to.eql([
        {
          crs: 'CRS:84',
          extent: [-71.63, 41.75, -70.78, 42.9],
          res: [0.01, 0.01],
        },
        {
          crs: 'EPSG:26986',
          extent: [189000, 834000, 285000, 962000],
          res: [1, 1],
        },
      ]);
      expect(layer.Layer[0].EX_GeographicBoundingBox).to.eql([
        -71.63, 41.75, -70.78, 42.9,
      ]);
      expect(layer.Layer[0].Style).to.eql([
        {
          Name: 'USGS',
          Title: 'USGS Topo Map Style',
          Abstract:
            'Features are shown in a style like that used in USGS ' +
            'topographic maps.',
          StyleSheetURL: {
            Format: 'text/xsl',
            OnlineResource: 'http://www.university.edu/stylesheets/usgs.xsl',
          },
          LegendURL: [
            {
              Format: 'image/gif',
              OnlineResource: 'http://www.university.edu/legends/usgs.gif',
              size: [72, 72],
            },
          ],
        },
      ]);
      expect(layer.Layer[0].FeatureListURL).to.eql([
        {
          Format: 'XML',
          OnlineResource: 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      expect(layer.Layer[0].Attribution).to.eql({
        Title: 'State College University',
        OnlineResource: 'http://www.university.edu/',
        LogoURL: {
          Format: 'image/gif',
          OnlineResource: 'http://www.university.edu/icons/logo.gif',
          size: [100, 100],
        },
      });
    });
  });

  describe('when parsing ogcsample.xml (v1.1.1)', function () {
    const parser = new WMSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wms/ogcsample111.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read version', function () {
      expect(capabilities.version).to.eql('1.1.1');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      expect(service.Name).to.eql('OGC:WMS');
      expect(service.Title).to.eql('Acme Corp. Map Server');
      expect(service.Abstract).to.eql(
        'WMT Map Server maintained by Acme Corporation. Contact: webmaster@wmt.acme.com.\n      High-quality maps showing roadrunner nests and possible ambush locations.',
      );
      expect(service.KeywordList).to.eql(['bird', 'roadrunner', 'ambush']);
      expect(service.OnlineResource).to.eql('http://hostname/');
      expect(service.Fees).to.eql('none');
      expect(service.AccessConstraints).to.eql('none');

      const contact = service.ContactInformation;
      expect(contact.ContactPosition).to.eql('Computer Scientist');
      expect(contact.ContactPersonPrimary).to.eql({
        ContactPerson: 'Jeff deLaBeaujardiere',
        ContactOrganization: 'NASA',
      });
      expect(contact.ContactAddress).to.eql({
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center, Code 933',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      expect(contact.ContactVoiceTelephone).to.eql('+1 301 286-1569');
      expect(contact.ContactFacsimileTelephone).to.eql('+1 301 286-1777');
      expect(contact.ContactElectronicMailAddress).to.eql(
        'delabeau@iniki.gsfc.nasa.gov',
      );
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      expect(exception).to.eql([
        'application/vnd.ogc.se_xml',
        'application/vnd.ogc.se_inimage',
        'application/vnd.ogc.se_blank',
      ]);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      expect(getCapabilities.Format).to.eql(['application/vnd.ogc.wms_xml']);
      expect(getCapabilities.DCPType.length).to.eql(1);
      const http = getCapabilities.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname:port/path');
      expect(http.Post.OnlineResource).to.eql('http://hostname:port/path');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      expect(getFeatureInfo.Format).to.eql([
        'application/vnd.ogc.gml',
        'text/plain',
        'text/html',
      ]);
      expect(getFeatureInfo.DCPType.length).to.eql(1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname:port/path');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      expect(getMap.Format).to.eql(['image/gif', 'image/png', 'image/jpeg']);
      expect(getMap.DCPType.length).to.eql(1);
      const http = getMap.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname:port/path');
    });

    it('should not have the SLD nodes', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      const getLegendGraphic = capabilities.Capability.Request.getLegendGraphic;
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      expect(describeLayer).to.eql(undefined);
      expect(getLegendGraphic).to.eql(undefined);
      expect(userDefinedSymbolization).to.eql(undefined);
    });

    it('can read Capability.Layer', function () {
      const layerCapability = capabilities.Capability.Layer;
      expect(layerCapability.Title).to.eql('Acme Corp. Map Server');
      expect(layerCapability.SRS).to.eql(['EPSG:4326']);
      expect(layerCapability.AuthorityURL).to.eql([
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      const layers = layerCapability.Layer;
      expect(layers.length).to.eql(4);
      const layer = layers[0];

      expect(layer.Name).to.eql('ROADS_RIVERS');
      expect(layer.Title).to.eql('Roads and Rivers');
      expect(layer.SRS).to.eql(['EPSG:26986', 'EPSG:4326']);
      expect(layer.queryable).to.eql(false);
      expect(layer.cascaded).to.eql(undefined);
      expect(layer.opaque).to.eql(false);
      expect(layer.noSubsets).to.eql(false);
      expect(layer.fixedWidth).to.eql(undefined);
      expect(layer.fixedHeight).to.eql(undefined);
      expect(layer.Extent).to.eql(undefined);
      expect(layer.Identifier).to.eql(['123456']);

      expect(layer.LatLonBoundingBox).to.eql({
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      expect(layer.BoundingBox).to.eql([
        {
          'extent': [-71.63, 41.75, -70.78, 42.9],
          'res': [0.01, 0.01],
          'srs': 'EPSG:4326',
        },
        {
          'extent': [189000, 834000, 285000, 962000],
          'res': [1, 1],
          'srs': 'EPSG:26986',
        },
      ]);
      expect(layer.FeatureListURL).to.eql([
        {
          'Format': 'application/vnd.ogc.se_xml"',
          'OnlineResource': 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      expect(layer.AuthorityURL).to.eql([
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      expect(layer.ScaleHint).to.eql([
        {
          'min': 4000,
          'max': 35000,
        },
      ]);

      const attribution = layer.Attribution;
      expect(attribution.Title).to.eql('State College University');
      expect(attribution.OnlineResource).to.eql('http://www.university.edu/');
      expect(attribution.LogoURL).to.eql({
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      expect(layer.Style.length).to.eql(1);
      const style = layer.Style[0];
      expect(style.Name).to.eql('USGS');
      expect(style.Title).to.eql('USGS Topo Map Style');
      expect(style.Abstract).to.eql(
        'Features are shown in a style like that used in USGS topographic maps.',
      );
      expect(style.LegendURL).to.eql([
        {
          'Format': 'image/gif',
          'OnlineResource': 'http://www.university.edu/legends/usgs.gif',
          'size': [72, 72],
        },
      ]);
      expect(style.StyleSheetURL).to.eql({
        'Format': 'text/xsl',
        'OnlineResource': 'http://www.university.edu/stylesheets/usgs.xsl',
      });

      expect(layer.Layer.length).to.eql(2);
      const subLayer = layer.Layer[0];

      expect(subLayer.Name).to.eql('ROADS_1M');
      expect(subLayer.Title).to.eql('Roads at 1:1M scale');
      expect(subLayer.Abstract).to.eql('Roads at a scale of 1 to 1 million.');
      expect(subLayer.KeywordList).to.eql(['road', 'transportation', 'atlas']);
      expect(subLayer.Identifier).to.eql(['123456']);
      expect(subLayer.SRS).to.eql(['EPSG:26986']);
      expect(subLayer.queryable).to.eql(true);
      expect(subLayer.cascaded).to.eql(undefined);
      expect(subLayer.opaque).to.eql(false);
      expect(subLayer.noSubsets).to.eql(false);
      expect(subLayer.fixedWidth).to.eql(undefined);
      expect(subLayer.fixedHeight).to.eql(undefined);
      expect(subLayer.Extent).to.eql(undefined);

      expect(subLayer.LatLonBoundingBox).to.eql({
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      expect(subLayer.BoundingBox).to.eql([
        {
          'extent': [-71.63, 41.75, -70.78, 42.9],
          'res': [0.01, 0.01],
          'srs': 'EPSG:4326',
        },
        {
          'extent': [189000, 834000, 285000, 962000],
          'res': [1, 1],
          'srs': 'EPSG:26986',
        },
      ]);
      expect(subLayer.ScaleHint).to.eql([
        {
          'min': 4000,
          'max': 35000,
        },
      ]);
      expect(subLayer.MetadataURL).to.eql([
        {
          'Format': 'text/plain',
          'OnlineResource': 'http://www.university.edu/metadata/roads.txt',
          'type': 'FGDC',
        },
        {
          'Format': 'text/xml',
          'OnlineResource': 'http://www.university.edu/metadata/roads.xml',
          'type': 'FGDC',
        },
      ]);
      const subLayerAttribution = subLayer.Attribution;
      expect(subLayerAttribution.Title).to.eql('State College University');
      expect(subLayerAttribution.OnlineResource).to.eql(
        'http://www.university.edu/',
      );
      expect(subLayerAttribution.LogoURL).to.eql({
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      expect(subLayer.Style.length).to.eql(2);
      const subLayerStyle = subLayer.Style[0];
      expect(subLayerStyle.Name).to.eql('ATLAS');
      expect(subLayerStyle.Title).to.eql('Road atlas style');
      expect(subLayerStyle.Abstract).to.eql(
        'Roads are shown in a style like that used in a commercial road atlas.',
      );
      expect(subLayerStyle.LegendURL).to.eql([
        {
          'Format': 'image/gif',
          'OnlineResource': 'http://www.university.edu/legends/atlas.gif',
          'size': [72, 72],
        },
      ]);
    });
  });

  describe('when parsing ogcsample.xml (v1.1.1) with SLD', function () {
    const parser = new WMSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wms/ogcsample111_sld.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read version', function () {
      expect(capabilities.version).to.eql('1.1.1');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      expect(service.Name).to.eql('OGC:WMS');
      expect(service.Title).to.eql('Acme Corp. Map Server');
      expect(service.Abstract).to.eql(
        'WMT Map Server maintained by Acme Corporation. Contact: webmaster@wmt.acme.com.\n      High-quality maps showing roadrunner nests and possible ambush locations.',
      );
      expect(service.KeywordList).to.eql(['bird', 'roadrunner', 'ambush']);
      expect(service.OnlineResource).to.eql('http://hostname/');
      expect(service.Fees).to.eql('none');
      expect(service.AccessConstraints).to.eql('none');

      const contact = service.ContactInformation;
      expect(contact.ContactPosition).to.eql('Computer Scientist');
      expect(contact.ContactPersonPrimary).to.eql({
        ContactPerson: 'Jeff deLaBeaujardiere',
        ContactOrganization: 'NASA',
      });
      expect(contact.ContactAddress).to.eql({
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center, Code 933',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      expect(contact.ContactVoiceTelephone).to.eql('+1 301 286-1569');
      expect(contact.ContactFacsimileTelephone).to.eql('+1 301 286-1777');
      expect(contact.ContactElectronicMailAddress).to.eql(
        'delabeau@iniki.gsfc.nasa.gov',
      );
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      expect(exception).to.eql([
        'application/vnd.ogc.se_xml',
        'application/vnd.ogc.se_inimage',
        'application/vnd.ogc.se_blank',
      ]);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      expect(getCapabilities.Format).to.eql(['application/vnd.ogc.wms_xml']);
      expect(getCapabilities.DCPType.length).to.eql(1);
      const http = getCapabilities.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname:port/path');
      expect(http.Post.OnlineResource).to.eql('http://hostname:port/path');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      expect(getFeatureInfo.Format).to.eql([
        'application/vnd.ogc.gml',
        'text/plain',
        'text/html',
      ]);
      expect(getFeatureInfo.DCPType.length).to.eql(1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname:port/path');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      expect(getMap.Format).to.eql(['image/gif', 'image/png', 'image/jpeg']);
      expect(getMap.DCPType.length).to.eql(1);
      const http = getMap.DCPType[0].HTTP;
      expect(http.Get.OnlineResource).to.eql('http://hostname:port/path');
    });

    it('can read the Capability.Request.GetLegendGraphic', function () {
      const getLegendGraphic = capabilities.Capability.Request.GetLegendGraphic;
      expect(getLegendGraphic).to.not.eql(undefined);
      expect(getLegendGraphic.Format).to.eql([
        'image/png',
        'image/png; mode=8bit',
        'image/jpeg',
        'image/vnd.jpeg-png',
        'image/vnd.jpeg-png8',
      ]);
      expect(getLegendGraphic.DCPType[0].HTTP.Get.OnlineResource).to.eql(
        'http://hostname:port/path',
      );
      expect(getLegendGraphic.DCPType[0].HTTP.Post.OnlineResource).to.eql(
        'http://hostname:port/path',
      );
    });

    it('can read the Capability.Request.DescribeLayer', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      expect(describeLayer).to.not.eql(undefined);
      expect(describeLayer.Format).to.eql(['application/vnd.ogc.gml']);
      expect(describeLayer.DCPType[0].HTTP.Get.OnlineResource).to.eql(
        'http://hostname:port/path',
      );
    });

    it('can read the Capability.UserDefinedSymbolization', function () {
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      expect(userDefinedSymbolization.SupportSLD).to.eql(true);
      expect(userDefinedSymbolization.UserStyle).to.eql(true);
      expect(userDefinedSymbolization.UserLayer).to.eql(false);
      expect(userDefinedSymbolization.RemoteWFS).to.eql(false);
      expect(userDefinedSymbolization.InlineFeatureData).to.eql(false);
      expect(userDefinedSymbolization.RemoteWCS).to.eql(false);
    });

    it('can read Capability.Layer', function () {
      const layerCapability = capabilities.Capability.Layer;
      expect(layerCapability.Title).to.eql('Acme Corp. Map Server');
      expect(layerCapability.SRS).to.eql(['EPSG:4326']);
      expect(layerCapability.AuthorityURL).to.eql([
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      const layers = layerCapability.Layer;
      expect(layers.length).to.eql(4);
      const layer = layers[0];

      expect(layer.Name).to.eql('ROADS_RIVERS');
      expect(layer.Title).to.eql('Roads and Rivers');
      expect(layer.SRS).to.eql(['EPSG:26986', 'EPSG:4326']);
      expect(layer.queryable).to.eql(false);
      expect(layer.cascaded).to.eql(undefined);
      expect(layer.opaque).to.eql(false);
      expect(layer.noSubsets).to.eql(false);
      expect(layer.fixedWidth).to.eql(undefined);
      expect(layer.fixedHeight).to.eql(undefined);
      expect(layer.Extent).to.eql(undefined);
      expect(layer.Identifier).to.eql(['123456']);

      expect(layer.LatLonBoundingBox).to.eql({
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      expect(layer.BoundingBox).to.eql([
        {
          'extent': [-71.63, 41.75, -70.78, 42.9],
          'res': [0.01, 0.01],
          'srs': 'EPSG:4326',
        },
        {
          'extent': [189000, 834000, 285000, 962000],
          'res': [1, 1],
          'srs': 'EPSG:26986',
        },
      ]);
      expect(layer.FeatureListURL).to.eql([
        {
          'Format': 'application/vnd.ogc.se_xml"',
          'OnlineResource': 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      expect(layer.AuthorityURL).to.eql([
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      expect(layer.ScaleHint).to.eql([
        {
          'min': 4000,
          'max': 35000,
        },
      ]);

      const attribution = layer.Attribution;
      expect(attribution.Title).to.eql('State College University');
      expect(attribution.OnlineResource).to.eql('http://www.university.edu/');
      expect(attribution.LogoURL).to.eql({
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      expect(layer.Style.length).to.eql(1);
      const style = layer.Style[0];
      expect(style.Name).to.eql('USGS');
      expect(style.Title).to.eql('USGS Topo Map Style');
      expect(style.Abstract).to.eql(
        'Features are shown in a style like that used in USGS topographic maps.',
      );
      expect(style.LegendURL).to.eql([
        {
          'Format': 'image/gif',
          'OnlineResource': 'http://www.university.edu/legends/usgs.gif',
          'size': [72, 72],
        },
      ]);
      expect(style.StyleSheetURL).to.eql({
        'Format': 'text/xsl',
        'OnlineResource': 'http://www.university.edu/stylesheets/usgs.xsl',
      });

      expect(layer.Layer.length).to.eql(2);
      const subLayer = layer.Layer[0];

      expect(subLayer.Name).to.eql('ROADS_1M');
      expect(subLayer.Title).to.eql('Roads at 1:1M scale');
      expect(subLayer.Abstract).to.eql('Roads at a scale of 1 to 1 million.');
      expect(subLayer.KeywordList).to.eql(['road', 'transportation', 'atlas']);
      expect(subLayer.Identifier).to.eql(['123456']);
      expect(subLayer.SRS).to.eql(['EPSG:26986']);
      expect(subLayer.queryable).to.eql(true);
      expect(subLayer.cascaded).to.eql(undefined);
      expect(subLayer.opaque).to.eql(false);
      expect(subLayer.noSubsets).to.eql(false);
      expect(subLayer.fixedWidth).to.eql(undefined);
      expect(subLayer.fixedHeight).to.eql(undefined);
      expect(subLayer.Extent).to.eql(undefined);

      expect(subLayer.LatLonBoundingBox).to.eql({
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      expect(subLayer.BoundingBox).to.eql([
        {
          'extent': [-71.63, 41.75, -70.78, 42.9],
          'res': [0.01, 0.01],
          'srs': 'EPSG:4326',
        },
        {
          'extent': [189000, 834000, 285000, 962000],
          'res': [1, 1],
          'srs': 'EPSG:26986',
        },
      ]);
      expect(subLayer.ScaleHint).to.eql([
        {
          'min': 4000,
          'max': 35000,
        },
      ]);
      expect(subLayer.MetadataURL).to.eql([
        {
          'Format': 'text/plain',
          'OnlineResource': 'http://www.university.edu/metadata/roads.txt',
          'type': 'FGDC',
        },
        {
          'Format': 'text/xml',
          'OnlineResource': 'http://www.university.edu/metadata/roads.xml',
          'type': 'FGDC',
        },
      ]);
      const subLayerAttribution = subLayer.Attribution;
      expect(subLayerAttribution.Title).to.eql('State College University');
      expect(subLayerAttribution.OnlineResource).to.eql(
        'http://www.university.edu/',
      );
      expect(subLayerAttribution.LogoURL).to.eql({
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      expect(subLayer.Style.length).to.eql(2);
      const subLayerStyle = subLayer.Style[0];
      expect(subLayerStyle.Name).to.eql('ATLAS');
      expect(subLayerStyle.Title).to.eql('Road atlas style');
      expect(subLayerStyle.Abstract).to.eql(
        'Roads are shown in a style like that used in a commercial road atlas.',
      );
      expect(subLayerStyle.LegendURL).to.eql([
        {
          'Format': 'image/gif',
          'OnlineResource': 'http://www.university.edu/legends/atlas.gif',
          'size': [72, 72],
        },
      ]);
    });
  });
});

describe('ol.format.WMSCapabilities', function () {
  describe('when parsing singlelayer.xml', function () {
    const parser = new WMSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wms/singlelayer.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can read version', function () {
      expect(capabilities.version).to.eql('1.3.0');
    });

    it('can read Service section', function () {
      // FIXME not all fields are tested
      const service = capabilities.Service;

      expect(service.Name).to.eql('WMS');
      expect(service.Title).to.eql('Acme Corp. Map Server');
    });

    it('can read Capability.Layer', function () {
      const layer = capabilities.Capability.Layer;

      expect(layer.Title).to.eql('Roads at 1:1M scale');
      expect(layer.Name).to.be('ROADS_1M');
      expect(layer.queryable).to.be(true);
    });
  });
});
