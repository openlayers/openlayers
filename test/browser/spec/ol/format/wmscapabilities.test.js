import {assert} from 'chai';
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
      assert.deepEqual(capabilities.version, '1.3.0');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      assert.deepEqual(service.Name, 'WMS');
      assert.deepEqual(service.Title, 'Acme Corp. Map Server');
      assert.deepEqual(service.KeywordList, ['bird', 'roadrunner', 'ambush']);
      assert.deepEqual(service.OnlineResource, 'http://hostname/');
      assert.deepEqual(service.Fees, 'none');
      assert.deepEqual(service.AccessConstraints, 'none');
      assert.deepEqual(service.LayerLimit, 16);
      assert.deepEqual(service.MaxWidth, 2048);
      assert.deepEqual(service.MaxHeight, 2048);

      const contact = service.ContactInformation;
      assert.deepEqual(contact.ContactPosition, 'Computer Scientist');
      assert.deepEqual(contact.ContactPersonPrimary, {
        ContactPerson: 'Jeff Smith',
        ContactOrganization: 'NASA',
      });
      assert.deepEqual(contact.ContactAddress, {
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      assert.deepEqual(contact.ContactVoiceTelephone, '+1 301 555-1212');
      assert.deepEqual(contact.ContactElectronicMailAddress, 'user@host.com');
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      assert.deepEqual(exception, ['XML', 'INIMAGE', 'BLANK']);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      assert.deepEqual(getCapabilities.Format, ['text/xml']);
      assert.deepEqual(getCapabilities.DCPType.length, 1);
      const http = getCapabilities.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname/path?');
      assert.deepEqual(http.Post.OnlineResource, 'http://hostname/path?');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      assert.deepEqual(getFeatureInfo.Format, [
        'text/xml',
        'text/plain',
        'text/html',
      ]);
      assert.deepEqual(getFeatureInfo.DCPType.length, 1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname/path?');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      assert.deepEqual(getMap.Format, ['image/gif', 'image/png', 'image/jpeg']);
      assert.deepEqual(getMap.DCPType.length, 1);
      const http = getMap.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname/path?');
    });

    it('should not have the SLD nodes', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      const getLegendGraphic = capabilities.Capability.Request.getLegendGraphic;
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      assert.deepEqual(describeLayer, undefined);
      assert.deepEqual(getLegendGraphic, undefined);
      assert.deepEqual(userDefinedSymbolization, undefined);
    });

    it('can read Capability.Layer', function () {
      const layer = capabilities.Capability.Layer;
      assert.deepEqual(layer.Title, 'Acme Corp. Map Server');
      assert.strictEqual(layer.Name, undefined);
      assert.deepEqual(layer.CRS, ['CRS:84']);
      assert.deepEqual(layer.AuthorityURL, [
        {
          name: 'DIF_ID',
          OnlineResource: 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
        },
      ]);
      assert.deepEqual(layer.BoundingBox, [
        {
          crs: 'CRS:84',
          extent: [-1, -1, 1, 1],
          res: [0, 0],
        },
      ]);

      assert.deepEqual(layer.Layer.length, 4);
      assert.deepEqual(layer.Layer[0].Name, 'ROADS_RIVERS');
      assert.deepEqual(layer.Layer[0].Title, 'Roads and Rivers');
      assert.deepEqual(layer.Layer[0].CRS, ['EPSG:26986', 'CRS:84']);
      assert.deepEqual(layer.Layer[0].Identifier, ['123456']);
      assert.deepEqual(layer.Layer[0].BoundingBox, [
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
      assert.deepEqual(
        layer.Layer[0].EX_GeographicBoundingBox,
        [-71.63, 41.75, -70.78, 42.9],
      );
      assert.deepEqual(layer.Layer[0].Style, [
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
      assert.deepEqual(layer.Layer[0].FeatureListURL, [
        {
          Format: 'XML',
          OnlineResource: 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      assert.deepEqual(layer.Layer[0].Attribution, {
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
      assert.deepEqual(capabilities.version, '1.3.0');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      assert.deepEqual(service.Name, 'WMS');
      assert.deepEqual(service.Title, 'Acme Corp. Map Server');
      assert.deepEqual(service.KeywordList, ['bird', 'roadrunner', 'ambush']);
      assert.deepEqual(service.OnlineResource, 'http://hostname/');
      assert.deepEqual(service.Fees, 'none');
      assert.deepEqual(service.AccessConstraints, 'none');
      assert.deepEqual(service.LayerLimit, 16);
      assert.deepEqual(service.MaxWidth, 2048);
      assert.deepEqual(service.MaxHeight, 2048);

      const contact = service.ContactInformation;
      assert.deepEqual(contact.ContactPosition, 'Computer Scientist');
      assert.deepEqual(contact.ContactPersonPrimary, {
        ContactPerson: 'Jeff Smith',
        ContactOrganization: 'NASA',
      });
      assert.deepEqual(contact.ContactAddress, {
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      assert.deepEqual(contact.ContactVoiceTelephone, '+1 301 555-1212');
      assert.deepEqual(contact.ContactElectronicMailAddress, 'user@host.com');
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      assert.deepEqual(exception, ['XML', 'INIMAGE', 'BLANK']);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      assert.deepEqual(getCapabilities.Format, ['text/xml']);
      assert.deepEqual(getCapabilities.DCPType.length, 1);
      const http = getCapabilities.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname/path?');
      assert.deepEqual(http.Post.OnlineResource, 'http://hostname/path?');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      assert.deepEqual(getFeatureInfo.Format, [
        'text/xml',
        'text/plain',
        'text/html',
      ]);
      assert.deepEqual(getFeatureInfo.DCPType.length, 1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname/path?');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      assert.deepEqual(getMap.Format, ['image/gif', 'image/png', 'image/jpeg']);
      assert.deepEqual(getMap.DCPType.length, 1);
      const http = getMap.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname/path?');
    });

    it('can read the Capability.Request.GetLegendGraphic', function () {
      const getLegendGraphic = capabilities.Capability.Request.GetLegendGraphic;
      assert.notDeepEqual(getLegendGraphic, undefined);
      assert.deepEqual(getLegendGraphic.Format, [
        'image/png',
        'image/png; mode=8bit',
        'image/jpeg',
        'image/vnd.jpeg-png',
        'image/vnd.jpeg-png8',
      ]);
      assert.deepEqual(
        getLegendGraphic.DCPType[0].HTTP.Get.OnlineResource,
        'http://hostname/path?',
      );
      assert.deepEqual(
        getLegendGraphic.DCPType[0].HTTP.Post.OnlineResource,
        'http://hostname/path?',
      );
    });

    it('can read the Capability.Request.DescribeLayer', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      assert.notDeepEqual(describeLayer, undefined);
      assert.deepEqual(describeLayer.Format, ['application/vnd.ogc.gml']);
      assert.deepEqual(
        describeLayer.DCPType[0].HTTP.Get.OnlineResource,
        'http://hostname/path?',
      );
    });

    it('can read the Capability.UserDefinedSymbolization', function () {
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      assert.deepEqual(userDefinedSymbolization.SupportSLD, true);
      assert.deepEqual(userDefinedSymbolization.UserStyle, true);
      assert.deepEqual(userDefinedSymbolization.UserLayer, false);
      assert.deepEqual(userDefinedSymbolization.RemoteWFS, false);
      assert.deepEqual(userDefinedSymbolization.InlineFeatureData, false);
      assert.deepEqual(userDefinedSymbolization.RemoteWCS, false);
    });

    it('can read Capability.Layer', function () {
      const layer = capabilities.Capability.Layer;
      assert.deepEqual(layer.Title, 'Acme Corp. Map Server');
      assert.strictEqual(layer.Name, undefined);
      assert.deepEqual(layer.CRS, ['CRS:84']);
      assert.deepEqual(layer.AuthorityURL, [
        {
          name: 'DIF_ID',
          OnlineResource: 'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
        },
      ]);
      assert.deepEqual(layer.BoundingBox, [
        {
          crs: 'CRS:84',
          extent: [-1, -1, 1, 1],
          res: [0, 0],
        },
      ]);

      assert.deepEqual(layer.Layer.length, 4);
      assert.deepEqual(layer.Layer[0].Name, 'ROADS_RIVERS');
      assert.deepEqual(layer.Layer[0].Title, 'Roads and Rivers');
      assert.deepEqual(layer.Layer[0].CRS, ['EPSG:26986', 'CRS:84']);
      assert.deepEqual(layer.Layer[0].Identifier, ['123456']);
      assert.deepEqual(layer.Layer[0].BoundingBox, [
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
      assert.deepEqual(
        layer.Layer[0].EX_GeographicBoundingBox,
        [-71.63, 41.75, -70.78, 42.9],
      );
      assert.deepEqual(layer.Layer[0].Style, [
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
      assert.deepEqual(layer.Layer[0].FeatureListURL, [
        {
          Format: 'XML',
          OnlineResource: 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      assert.deepEqual(layer.Layer[0].Attribution, {
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
      assert.deepEqual(capabilities.version, '1.1.1');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      assert.deepEqual(service.Name, 'OGC:WMS');
      assert.deepEqual(service.Title, 'Acme Corp. Map Server');
      assert.deepEqual(
        service.Abstract,
        'WMT Map Server maintained by Acme Corporation. Contact: webmaster@wmt.acme.com.\n      High-quality maps showing roadrunner nests and possible ambush locations.',
      );
      assert.deepEqual(service.KeywordList, ['bird', 'roadrunner', 'ambush']);
      assert.deepEqual(service.OnlineResource, 'http://hostname/');
      assert.deepEqual(service.Fees, 'none');
      assert.deepEqual(service.AccessConstraints, 'none');

      const contact = service.ContactInformation;
      assert.deepEqual(contact.ContactPosition, 'Computer Scientist');
      assert.deepEqual(contact.ContactPersonPrimary, {
        ContactPerson: 'Jeff deLaBeaujardiere',
        ContactOrganization: 'NASA',
      });
      assert.deepEqual(contact.ContactAddress, {
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center, Code 933',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      assert.deepEqual(contact.ContactVoiceTelephone, '+1 301 286-1569');
      assert.deepEqual(contact.ContactFacsimileTelephone, '+1 301 286-1777');
      assert.deepEqual(
        contact.ContactElectronicMailAddress,
        'delabeau@iniki.gsfc.nasa.gov',
      );
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      assert.deepEqual(exception, [
        'application/vnd.ogc.se_xml',
        'application/vnd.ogc.se_inimage',
        'application/vnd.ogc.se_blank',
      ]);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      assert.deepEqual(getCapabilities.Format, ['application/vnd.ogc.wms_xml']);
      assert.deepEqual(getCapabilities.DCPType.length, 1);
      const http = getCapabilities.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname:port/path');
      assert.deepEqual(http.Post.OnlineResource, 'http://hostname:port/path');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      assert.deepEqual(getFeatureInfo.Format, [
        'application/vnd.ogc.gml',
        'text/plain',
        'text/html',
      ]);
      assert.deepEqual(getFeatureInfo.DCPType.length, 1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname:port/path');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      assert.deepEqual(getMap.Format, ['image/gif', 'image/png', 'image/jpeg']);
      assert.deepEqual(getMap.DCPType.length, 1);
      const http = getMap.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname:port/path');
    });

    it('should not have the SLD nodes', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      const getLegendGraphic = capabilities.Capability.Request.getLegendGraphic;
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      assert.deepEqual(describeLayer, undefined);
      assert.deepEqual(getLegendGraphic, undefined);
      assert.deepEqual(userDefinedSymbolization, undefined);
    });

    it('can read Capability.Layer', function () {
      const layerCapability = capabilities.Capability.Layer;
      assert.deepEqual(layerCapability.Title, 'Acme Corp. Map Server');
      assert.deepEqual(layerCapability.SRS, ['EPSG:4326']);
      assert.deepEqual(layerCapability.AuthorityURL, [
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      const layers = layerCapability.Layer;
      assert.deepEqual(layers.length, 4);
      const layer = layers[0];

      assert.deepEqual(layer.Name, 'ROADS_RIVERS');
      assert.deepEqual(layer.Title, 'Roads and Rivers');
      assert.deepEqual(layer.SRS, ['EPSG:26986', 'EPSG:4326']);
      assert.deepEqual(layer.queryable, false);
      assert.deepEqual(layer.cascaded, undefined);
      assert.deepEqual(layer.opaque, false);
      assert.deepEqual(layer.noSubsets, false);
      assert.deepEqual(layer.fixedWidth, undefined);
      assert.deepEqual(layer.fixedHeight, undefined);
      assert.deepEqual(layer.Extent, undefined);
      assert.deepEqual(layer.Identifier, ['123456']);

      assert.deepEqual(layer.LatLonBoundingBox, {
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      assert.deepEqual(layer.BoundingBox, [
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
      assert.deepEqual(layer.FeatureListURL, [
        {
          'Format': 'application/vnd.ogc.se_xml"',
          'OnlineResource': 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      assert.deepEqual(layer.AuthorityURL, [
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      assert.deepEqual(layer.ScaleHint, [
        {
          'min': 4000,
          'max': 35000,
        },
      ]);

      const attribution = layer.Attribution;
      assert.deepEqual(attribution.Title, 'State College University');
      assert.deepEqual(
        attribution.OnlineResource,
        'http://www.university.edu/',
      );
      assert.deepEqual(attribution.LogoURL, {
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      assert.deepEqual(layer.Style.length, 1);
      const style = layer.Style[0];
      assert.deepEqual(style.Name, 'USGS');
      assert.deepEqual(style.Title, 'USGS Topo Map Style');
      assert.deepEqual(
        style.Abstract,
        'Features are shown in a style like that used in USGS topographic maps.',
      );
      assert.deepEqual(style.LegendURL, [
        {
          'Format': 'image/gif',
          'OnlineResource': 'http://www.university.edu/legends/usgs.gif',
          'size': [72, 72],
        },
      ]);
      assert.deepEqual(style.StyleSheetURL, {
        'Format': 'text/xsl',
        'OnlineResource': 'http://www.university.edu/stylesheets/usgs.xsl',
      });

      assert.deepEqual(layer.Layer.length, 2);
      const subLayer = layer.Layer[0];

      assert.deepEqual(subLayer.Name, 'ROADS_1M');
      assert.deepEqual(subLayer.Title, 'Roads at 1:1M scale');
      assert.deepEqual(
        subLayer.Abstract,
        'Roads at a scale of 1 to 1 million.',
      );
      assert.deepEqual(subLayer.KeywordList, [
        'road',
        'transportation',
        'atlas',
      ]);
      assert.deepEqual(subLayer.Identifier, ['123456']);
      assert.deepEqual(subLayer.SRS, ['EPSG:26986']);
      assert.deepEqual(subLayer.queryable, true);
      assert.deepEqual(subLayer.cascaded, undefined);
      assert.deepEqual(subLayer.opaque, false);
      assert.deepEqual(subLayer.noSubsets, false);
      assert.deepEqual(subLayer.fixedWidth, undefined);
      assert.deepEqual(subLayer.fixedHeight, undefined);
      assert.deepEqual(subLayer.Extent, undefined);

      assert.deepEqual(subLayer.LatLonBoundingBox, {
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      assert.deepEqual(subLayer.BoundingBox, [
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
      assert.deepEqual(subLayer.ScaleHint, [
        {
          'min': 4000,
          'max': 35000,
        },
      ]);
      assert.deepEqual(subLayer.MetadataURL, [
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
      assert.deepEqual(subLayerAttribution.Title, 'State College University');
      assert.deepEqual(
        subLayerAttribution.OnlineResource,
        'http://www.university.edu/',
      );
      assert.deepEqual(subLayerAttribution.LogoURL, {
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      assert.deepEqual(subLayer.Style.length, 2);
      const subLayerStyle = subLayer.Style[0];
      assert.deepEqual(subLayerStyle.Name, 'ATLAS');
      assert.deepEqual(subLayerStyle.Title, 'Road atlas style');
      assert.deepEqual(
        subLayerStyle.Abstract,
        'Roads are shown in a style like that used in a commercial road atlas.',
      );
      assert.deepEqual(subLayerStyle.LegendURL, [
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
      assert.deepEqual(capabilities.version, '1.1.1');
    });

    it('can read Service section', function () {
      const service = capabilities.Service;
      assert.deepEqual(service.Name, 'OGC:WMS');
      assert.deepEqual(service.Title, 'Acme Corp. Map Server');
      assert.deepEqual(
        service.Abstract,
        'WMT Map Server maintained by Acme Corporation. Contact: webmaster@wmt.acme.com.\n      High-quality maps showing roadrunner nests and possible ambush locations.',
      );
      assert.deepEqual(service.KeywordList, ['bird', 'roadrunner', 'ambush']);
      assert.deepEqual(service.OnlineResource, 'http://hostname/');
      assert.deepEqual(service.Fees, 'none');
      assert.deepEqual(service.AccessConstraints, 'none');

      const contact = service.ContactInformation;
      assert.deepEqual(contact.ContactPosition, 'Computer Scientist');
      assert.deepEqual(contact.ContactPersonPrimary, {
        ContactPerson: 'Jeff deLaBeaujardiere',
        ContactOrganization: 'NASA',
      });
      assert.deepEqual(contact.ContactAddress, {
        AddressType: 'postal',
        Address: 'NASA Goddard Space Flight Center, Code 933',
        City: 'Greenbelt',
        StateOrProvince: 'MD',
        PostCode: '20771',
        Country: 'USA',
      });
      assert.deepEqual(contact.ContactVoiceTelephone, '+1 301 286-1569');
      assert.deepEqual(contact.ContactFacsimileTelephone, '+1 301 286-1777');
      assert.deepEqual(
        contact.ContactElectronicMailAddress,
        'delabeau@iniki.gsfc.nasa.gov',
      );
    });

    it('can read Capability.Exception', function () {
      const exception = capabilities.Capability.Exception;

      assert.deepEqual(exception, [
        'application/vnd.ogc.se_xml',
        'application/vnd.ogc.se_inimage',
        'application/vnd.ogc.se_blank',
      ]);
    });

    it('can read Capability.Request.GetCapabilities', function () {
      const getCapabilities = capabilities.Capability.Request.GetCapabilities;

      assert.deepEqual(getCapabilities.Format, ['application/vnd.ogc.wms_xml']);
      assert.deepEqual(getCapabilities.DCPType.length, 1);
      const http = getCapabilities.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname:port/path');
      assert.deepEqual(http.Post.OnlineResource, 'http://hostname:port/path');
    });

    it('can read Capability.Request.GetFeatureInfo', function () {
      const getFeatureInfo = capabilities.Capability.Request.GetFeatureInfo;

      assert.deepEqual(getFeatureInfo.Format, [
        'application/vnd.ogc.gml',
        'text/plain',
        'text/html',
      ]);
      assert.deepEqual(getFeatureInfo.DCPType.length, 1);
      const http = getFeatureInfo.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname:port/path');
    });

    it('can read Capability.Request.GetMap', function () {
      const getMap = capabilities.Capability.Request.GetMap;

      assert.deepEqual(getMap.Format, ['image/gif', 'image/png', 'image/jpeg']);
      assert.deepEqual(getMap.DCPType.length, 1);
      const http = getMap.DCPType[0].HTTP;
      assert.deepEqual(http.Get.OnlineResource, 'http://hostname:port/path');
    });

    it('can read the Capability.Request.GetLegendGraphic', function () {
      const getLegendGraphic = capabilities.Capability.Request.GetLegendGraphic;
      assert.notDeepEqual(getLegendGraphic, undefined);
      assert.deepEqual(getLegendGraphic.Format, [
        'image/png',
        'image/png; mode=8bit',
        'image/jpeg',
        'image/vnd.jpeg-png',
        'image/vnd.jpeg-png8',
      ]);
      assert.deepEqual(
        getLegendGraphic.DCPType[0].HTTP.Get.OnlineResource,
        'http://hostname:port/path',
      );
      assert.deepEqual(
        getLegendGraphic.DCPType[0].HTTP.Post.OnlineResource,
        'http://hostname:port/path',
      );
    });

    it('can read the Capability.Request.DescribeLayer', function () {
      const describeLayer = capabilities.Capability.Request.DescribeLayer;
      assert.notDeepEqual(describeLayer, undefined);
      assert.deepEqual(describeLayer.Format, ['application/vnd.ogc.gml']);
      assert.deepEqual(
        describeLayer.DCPType[0].HTTP.Get.OnlineResource,
        'http://hostname:port/path',
      );
    });

    it('can read the Capability.UserDefinedSymbolization', function () {
      const userDefinedSymbolization =
        capabilities.Capability.UserDefinedSymbolization;
      assert.deepEqual(userDefinedSymbolization.SupportSLD, true);
      assert.deepEqual(userDefinedSymbolization.UserStyle, true);
      assert.deepEqual(userDefinedSymbolization.UserLayer, false);
      assert.deepEqual(userDefinedSymbolization.RemoteWFS, false);
      assert.deepEqual(userDefinedSymbolization.InlineFeatureData, false);
      assert.deepEqual(userDefinedSymbolization.RemoteWCS, false);
    });

    it('can read Capability.Layer', function () {
      const layerCapability = capabilities.Capability.Layer;
      assert.deepEqual(layerCapability.Title, 'Acme Corp. Map Server');
      assert.deepEqual(layerCapability.SRS, ['EPSG:4326']);
      assert.deepEqual(layerCapability.AuthorityURL, [
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      const layers = layerCapability.Layer;
      assert.deepEqual(layers.length, 4);
      const layer = layers[0];

      assert.deepEqual(layer.Name, 'ROADS_RIVERS');
      assert.deepEqual(layer.Title, 'Roads and Rivers');
      assert.deepEqual(layer.SRS, ['EPSG:26986', 'EPSG:4326']);
      assert.deepEqual(layer.queryable, false);
      assert.deepEqual(layer.cascaded, undefined);
      assert.deepEqual(layer.opaque, false);
      assert.deepEqual(layer.noSubsets, false);
      assert.deepEqual(layer.fixedWidth, undefined);
      assert.deepEqual(layer.fixedHeight, undefined);
      assert.deepEqual(layer.Extent, undefined);
      assert.deepEqual(layer.Identifier, ['123456']);

      assert.deepEqual(layer.LatLonBoundingBox, {
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      assert.deepEqual(layer.BoundingBox, [
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
      assert.deepEqual(layer.FeatureListURL, [
        {
          'Format': 'application/vnd.ogc.se_xml"',
          'OnlineResource': 'http://www.university.edu/data/roads_rivers.gml',
        },
      ]);
      assert.deepEqual(layer.AuthorityURL, [
        {
          'OnlineResource':
            'http://gcmd.gsfc.nasa.gov/difguide/whatisadif.html',
          'name': 'DIF_ID',
        },
      ]);
      assert.deepEqual(layer.ScaleHint, [
        {
          'min': 4000,
          'max': 35000,
        },
      ]);

      const attribution = layer.Attribution;
      assert.deepEqual(attribution.Title, 'State College University');
      assert.deepEqual(
        attribution.OnlineResource,
        'http://www.university.edu/',
      );
      assert.deepEqual(attribution.LogoURL, {
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      assert.deepEqual(layer.Style.length, 1);
      const style = layer.Style[0];
      assert.deepEqual(style.Name, 'USGS');
      assert.deepEqual(style.Title, 'USGS Topo Map Style');
      assert.deepEqual(
        style.Abstract,
        'Features are shown in a style like that used in USGS topographic maps.',
      );
      assert.deepEqual(style.LegendURL, [
        {
          'Format': 'image/gif',
          'OnlineResource': 'http://www.university.edu/legends/usgs.gif',
          'size': [72, 72],
        },
      ]);
      assert.deepEqual(style.StyleSheetURL, {
        'Format': 'text/xsl',
        'OnlineResource': 'http://www.university.edu/stylesheets/usgs.xsl',
      });

      assert.deepEqual(layer.Layer.length, 2);
      const subLayer = layer.Layer[0];

      assert.deepEqual(subLayer.Name, 'ROADS_1M');
      assert.deepEqual(subLayer.Title, 'Roads at 1:1M scale');
      assert.deepEqual(
        subLayer.Abstract,
        'Roads at a scale of 1 to 1 million.',
      );
      assert.deepEqual(subLayer.KeywordList, [
        'road',
        'transportation',
        'atlas',
      ]);
      assert.deepEqual(subLayer.Identifier, ['123456']);
      assert.deepEqual(subLayer.SRS, ['EPSG:26986']);
      assert.deepEqual(subLayer.queryable, true);
      assert.deepEqual(subLayer.cascaded, undefined);
      assert.deepEqual(subLayer.opaque, false);
      assert.deepEqual(subLayer.noSubsets, false);
      assert.deepEqual(subLayer.fixedWidth, undefined);
      assert.deepEqual(subLayer.fixedHeight, undefined);
      assert.deepEqual(subLayer.Extent, undefined);

      assert.deepEqual(subLayer.LatLonBoundingBox, {
        'extent': [-71.63, 41.75, -70.78, 42.9],
        'res': [undefined, undefined],
      });
      assert.deepEqual(subLayer.BoundingBox, [
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
      assert.deepEqual(subLayer.ScaleHint, [
        {
          'min': 4000,
          'max': 35000,
        },
      ]);
      assert.deepEqual(subLayer.MetadataURL, [
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
      assert.deepEqual(subLayerAttribution.Title, 'State College University');
      assert.deepEqual(
        subLayerAttribution.OnlineResource,
        'http://www.university.edu/',
      );
      assert.deepEqual(subLayerAttribution.LogoURL, {
        'Format': 'image/gif',
        'OnlineResource': 'http://www.university.edu/icons/logo.gif',
        'size': [100, 100],
      });

      assert.deepEqual(subLayer.Style.length, 2);
      const subLayerStyle = subLayer.Style[0];
      assert.deepEqual(subLayerStyle.Name, 'ATLAS');
      assert.deepEqual(subLayerStyle.Title, 'Road atlas style');
      assert.deepEqual(
        subLayerStyle.Abstract,
        'Roads are shown in a style like that used in a commercial road atlas.',
      );
      assert.deepEqual(subLayerStyle.LegendURL, [
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
      assert.deepEqual(capabilities.version, '1.3.0');
    });

    it('can read Service section', function () {
      // FIXME not all fields are tested
      const service = capabilities.Service;

      assert.deepEqual(service.Name, 'WMS');
      assert.deepEqual(service.Title, 'Acme Corp. Map Server');
    });

    it('can read Capability.Layer', function () {
      const layer = capabilities.Capability.Layer;

      assert.deepEqual(layer.Title, 'Roads at 1:1M scale');
      assert.strictEqual(layer.Name, 'ROADS_1M');
      assert.strictEqual(layer.queryable, true);
    });
  });
});
