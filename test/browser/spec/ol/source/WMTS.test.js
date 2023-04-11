import Projection from '../../../../../src/ol/proj/Projection.js';
import WMTS, {
  optionsFromCapabilities,
} from '../../../../../src/ol/source/WMTS.js';
import WMTSCapabilities from '../../../../../src/ol/format/WMTSCapabilities.js';
import WMTSTileGrid from '../../../../../src/ol/tilegrid/WMTS.js';
import {getBottomLeft, getTopRight} from '../../../../../src/ol/extent.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

describe('ol/source/WMTS', function () {
  describe('when creating options from capabilities', function () {
    const parser = new WMTSCapabilities();
    let capabilities, content;
    before(function (done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function (xml) {
        try {
          content = xml;
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('returns null if the layer was not found in the capabilities', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'invalid',
      });

      expect(options).to.be(null);
    });

    it('passes the crossOrigin option', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857',
        crossOrigin: '',
      });

      expect(options.crossOrigin).to.be.eql('');
    });

    it('can create KVP options from spec/ol/format/wmts/ogcsample.xml', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857',
      });

      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?'
      );

      expect(options.layer).to.be.eql('BlueMarbleNextGeneration');

      expect(options.matrixSet).to.be.eql('google3857');

      expect(options.format).to.be.eql('image/jpeg');

      expect(options.projection).to.be.a(Projection);
      expect(options.projection).to.be.eql(getProjection('EPSG:3857'));

      expect(options.requestEncoding).to.be.eql('KVP');

      expect(options.tileGrid).to.be.a(WMTSTileGrid);

      expect(options.style).to.be.eql('DarkBlue');

      expect(options.dimensions).to.eql({Time: '20110805'});

      expect(options.crossOrigin).to.be(undefined);
    });

    it('can create REST options from spec/ol/format/wmts/ogcsample.xml', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857',
        requestEncoding: 'REST',
      });

      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'http://www.example.com/wmts/coastlines/{TileMatrix}/{TileRow}/{TileCol}.png'
      );

      expect(options.layer).to.be.eql('BlueMarbleNextGeneration');

      expect(options.matrixSet).to.be.eql('google3857');

      expect(options.format).to.be.eql('image/png');

      expect(options.projection).to.be.a(Projection);
      expect(options.projection).to.be.eql(getProjection('EPSG:3857'));

      expect(options.requestEncoding).to.be.eql('REST');

      expect(options.tileGrid).to.be.a(WMTSTileGrid);

      expect(options.style).to.be.eql('DarkBlue');

      expect(options.dimensions).to.eql({Time: '20110805'});
    });

    it('can find a MatrixSet by SRS identifier', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        projection: 'EPSG:3857',
        requestEncoding: 'REST',
      });

      expect(options.matrixSet).to.be.eql('google3857');
      expect(options.projection.getCode()).to.be.eql('EPSG:3857');
    });

    it('can find a MatrixSet by equivalent SRS identifier', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        projection: 'EPSG:900913',
        requestEncoding: 'REST',
      });

      expect(options.matrixSet).to.be.eql('google3857');
      expect(options.projection.getCode()).to.be.eql('EPSG:900913');
    });

    it('can find the default MatrixSet', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        requestEncoding: 'REST',
      });

      expect(options.matrixSet).to.be.eql('BigWorldPixel');
      expect(options.projection.getCode()).to.be.eql(
        'urn:ogc:def:crs:OGC:1.3:CRS84'
      );
    });

    it("uses the projection of the default MatrixSet if the config's projection is not supported", function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        projection: new Projection({
          code: 'EPSG:2056',
          units: 'm',
        }),
      });

      expect(options.matrixSet).to.be.eql('BigWorldPixel');
      expect(options.projection.getCode()).to.be.eql(
        'urn:ogc:def:crs:OGC:1.3:CRS84'
      );
    });

    it('uses extent of tile matrix instead of projection extent', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857subset',
      });

      // Since google3857subset defines subset of space defined by the google3857 matrix set:
      // - top left corner: -10000000, 10000000
      // - calculated grid extent: [-10000000, 9999694.25188686, -9999694.25188686, 10000000]
      // then the tile grid extent is only a part of the full projection extent.

      const gridExtent = options.tileGrid.getExtent();
      const gridBottomLeft = getBottomLeft(gridExtent);
      const gridTopRight = getTopRight(gridExtent);
      expect(Math.round(gridBottomLeft[0])).to.be.eql(-10000000);
      expect(Math.round(gridBottomLeft[1])).to.be.eql(9999847);
      expect(Math.round(gridTopRight[0])).to.be.eql(-9999847);
      expect(Math.round(gridTopRight[1])).to.be.eql(10000000);

      const projExtent = options.projection.getExtent();
      const projBottomLeft = getBottomLeft(projExtent);
      const projTopRight = getTopRight(projExtent);
      expect(Math.round(projBottomLeft[0])).to.be.eql(-20037508);
      expect(Math.round(projBottomLeft[1])).to.be.eql(-20037508);
      expect(Math.round(projTopRight[0])).to.be.eql(20037508);
      expect(Math.round(projTopRight[1])).to.be.eql(20037508);
    });

    it("doesn't fail if the GetCap doesn't contains Constraint tags", function () {
      const tmpXml = content.replace(
        /<ows:Constraint[\s\S]*?<\/ows:Constraint>/g,
        ''
      );
      const tmpCapabilities = parser.read(tmpXml);
      expect(
        tmpCapabilities['OperationsMetadata']['GetTile']['DCP']['HTTP'][
          'Get'
        ][0]['Constraint']
      ).to.be(undefined);
      const options = optionsFromCapabilities(tmpCapabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857',
      });
      expect(options.layer).to.be.eql('BlueMarbleNextGeneration');
      expect(options.matrixSet).to.be.eql('google3857');
    });

    it("set KVP as default request encoding if the GetCap doesn't contains Constraint and ResourceUrl tags", function () {
      let tmpXml = content.replace(
        /<ows:Constraint[\s\S]*?<\/ows:Constraint>/g,
        ''
      );
      tmpXml = tmpXml.replace(/<ResourceURL[\s\S]*?"\/>/g, '');

      const tmpCapabilities = parser.read(tmpXml);
      expect(
        tmpCapabilities['OperationsMetadata']['GetTile']['DCP']['HTTP'][
          'Get'
        ][0]['Constraint']
      ).to.be(undefined);
      expect(tmpCapabilities['Contents']['Layer'][0]['ResourceURL']).to.be(
        undefined
      );
      const options = optionsFromCapabilities(tmpCapabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857',
      });
      expect(options.layer).to.be.eql('BlueMarbleNextGeneration');
      expect(options.matrixSet).to.be.eql('google3857');
      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?'
      );
    });
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new WMTS({});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new WMTS({interpolate: false});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('when creating tileUrlFunction', function () {
    const defaultTileGrid = new WMTSTileGrid({
      origin: [-20037508.342789244, 20037508.342789244],
      resolutions: [
        559082264.029 * 0.28e-3,
        279541132.015 * 0.28e-3,
        139770566.007 * 0.28e-3,
      ],
      matrixIds: [0, 1, 2],
    });

    it('can replace lowercase REST parameters', function () {
      const source = new WMTS({
        layer: 'layer',
        style: 'default',
        urls: [
          'http://host/{layer}/{style}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg',
        ],
        matrixSet: 'EPSG:3857',
        requestEncoding: 'REST',
        tileGrid: defaultTileGrid,
      });

      const projection = getProjection('EPSG:3857');
      const url = source.tileUrlFunction(
        source.getTileCoordForTileUrlFunction([1, 1, 1]),
        1,
        projection
      );
      expect(url).to.be.eql('http://host/layer/default/EPSG:3857/1/1/1.jpg');
    });

    it('can replace camelcase REST parameters', function () {
      const source = new WMTS({
        layer: 'layer',
        style: 'default',
        urls: [
          'http://host/{Layer}/{Style}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg',
        ],
        matrixSet: 'EPSG:3857',
        requestEncoding: 'REST',
        tileGrid: defaultTileGrid,
      });

      const projection = getProjection('EPSG:3857');
      const url = source.tileUrlFunction(
        source.getTileCoordForTileUrlFunction([1, 1, 1]),
        1,
        projection
      );
      expect(url).to.be.eql('http://host/layer/default/EPSG:3857/1/1/1.jpg');
    });

    it('can replace dimensions', function () {
      const source = new WMTS({
        layer: 'layer',
        style: 'default',
        dimensions: {'Time': 42},
        urls: [
          'http://host/{Layer}/{Style}/{Time}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg',
        ],
        matrixSet: 'EPSG:3857',
        requestEncoding: 'REST',
        tileGrid: defaultTileGrid,
      });

      const projection = getProjection('EPSG:3857');
      const url = source.tileUrlFunction(
        source.getTileCoordForTileUrlFunction([1, 1, 1]),
        1,
        projection
      );
      expect(url).to.be.eql('http://host/layer/default/42/EPSG:3857/1/1/1.jpg');
      expect(source.getKey()).to.be.eql(
        'http://host/{Layer}/{Style}/{Time}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg/Time-42'
      );
    });
  });

  describe('when creating options from Esri capabilities', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText('spec/ol/format/wmts/arcgis.xml', function (xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    it('can create KVP options from spec/ol/format/wmts/arcgis.xml', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'Demographics_USA_Population_Density',
        requestEncoding: 'KVP',
        matrixSet: 'default028mm',
      });

      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'https://services.arcgisonline.com/arcgis/rest/services/' +
          'Demographics/USA_Population_Density/MapServer/WMTS?'
      );
    });

    it('can create REST options from spec/ol/format/wmts/arcgis.xml', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'Demographics_USA_Population_Density',
        matrixSet: 'default028mm',
      });

      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'https://services.arcgisonline.com/arcgis/rest/services/' +
          'Demographics/USA_Population_Density/MapServer/WMTS/' +
          'tile/1.0.0/Demographics_USA_Population_Density/' +
          '{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png'
      );
    });
  });

  describe('when creating options from wgs84 capabilities', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wmts/capabilities_wgs84.xml',
        function (xml) {
          try {
            capabilities = parser.read(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('returns correct bounding box', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'baselayer',
        matrixSet: 'inspire_quad',
        requestEncoding: 'REST',
      });

      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'https://example.com/wmts/baselayer/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png'
      );

      expect(options.layer).to.be.eql('baselayer');

      expect(options.matrixSet).to.be.eql('inspire_quad');

      expect(options.format).to.be.eql('image/png');

      expect(options.projection).to.be.a(Projection);
      expect(options.projection).to.be.eql(getProjection('EPSG:4326'));

      expect(options.requestEncoding).to.be.eql('REST');

      expect(options.tileGrid).to.be.a(WMTSTileGrid);
      expect(options.style).to.be.eql('default');

      const extent = options.tileGrid.getExtent();

      // compare with delta, due to rounding not the exact bounding box is returned...
      const expectDelta = (value, expected) =>
        expect(Math.abs(value - expected)).to.below(1e-10);

      expectDelta(extent[0], -180);
      expectDelta(extent[1], -90);
      expectDelta(extent[2], 180);
      expectDelta(extent[3], 90);
    });
  });
  describe('when creating options from wgs84 capabilities with BoundingBox', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wmts/capabilities_wgs84_with_boundingbox.xml',
        function (xml) {
          try {
            capabilities = parser.read(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('returns correct bounding box when the layer has BoundingBox', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'bmaphidpi',
        matrixSet: 'google3857',
        style: 'normal',
      });

      expect(options.layer).to.be.eql('bmaphidpi');

      expect(options.matrixSet).to.be.eql('google3857');

      expect(options.format).to.be.eql('image/jpeg');

      expect(options.requestEncoding).to.be.eql('REST');

      expect(options.tileGrid).to.be.a(WMTSTileGrid);
      expect(options.style).to.be.eql('normal');

      expect(options.projection).to.be.a(Projection);
      expect(options.projection).to.be.eql(getProjection('EPSG:3857'));

      const expectedMatrixSetExtend = [977650, 5838030, 1913530, 6281290];
      const extent = options.tileGrid.getExtent();

      // compare with delta, due to rounding not the exact bounding box is returned...
      const expectDelta = (value, expected) =>
        expect(Math.abs(value - expected)).to.below(1e-1);
      expectDelta(extent[0], expectedMatrixSetExtend[0]);
      expectDelta(extent[1], expectedMatrixSetExtend[1]);
      expectDelta(extent[2], expectedMatrixSetExtend[2]);
      expectDelta(extent[3], expectedMatrixSetExtend[3]);
    });
  });

  describe('when creating options from epsg:4326 capabilities with BoundingBox', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wmts/capabilities_epsg4326_with_boundingbox.xml',
        function (xml) {
          try {
            capabilities = parser.read(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('returns correct bounding box when the layer has BoundingBox', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 's2cloudless-2020',
      });

      const extent = options.tileGrid.getExtent();
      expect(extent).to.eql([-180, -90, 180, 90]);
    });
  });

  describe('set wrap x by bounding box if available', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wmts/capabilities_wrapx.xml',
        function (xml) {
          try {
            capabilities = parser.read(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('sets wrapx when no bounding box is set', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'no-bb',
        matrixSet: 'EPSG:3857',
        crossOrigin: 'anonymous',
      });
      expect(options.wrapX).to.be(true);
    });
    it('sets wrapx when only wgs 84 bb is set', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'only-wgs84-bb',
        matrixSet: 'EPSG:3857',
        crossOrigin: 'anonymous',
      });
      expect(options.wrapX).to.be(true);
    });
    it('does not set wrapx when wgs84 bb is set', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'no-wrap-wgs84-bb',
        matrixSet: 'EPSG:3857',
        crossOrigin: 'anonymous',
      });
      expect(options.wrapX).to.be(false);
    });
    it('does not set wrapx when tile matrix does not wrap', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'no-wrap-tm',
        matrixSet: 'EPSG:3857',
        crossOrigin: 'anonymous',
      });
      expect(options.wrapX).to.be(false);
    });
  });
  describe('when creating options from capabilities with TileMatrixSetLink', function () {
    const parser = new WMTSCapabilities();
    let capabilities;
    before(function (done) {
      afterLoadText(
        'spec/ol/format/wmts/capabilities_with_tilematrixsetlink.xml',
        function (xml) {
          try {
            capabilities = parser.read(xml);
          } catch (e) {
            done(e);
          }
          done();
        }
      );
    });

    it('returns correct bounding box for a layer', function () {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'mean_atlas_land',
        matrixSet: 'inspire_quad',
        requestEncoding: 'REST',
      });

      expect(options.urls).to.be.an('array');
      expect(options.urls).to.have.length(1);
      expect(options.urls[0]).to.be.eql(
        'https://example.com/wmts/mean_atlas_land/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png'
      );

      expect(options.layer).to.be.eql('mean_atlas_land');

      expect(options.matrixSet).to.be.eql('inspire_quad');

      expect(options.format).to.be.eql('image/png');

      expect(options.projection).to.be.a(Projection);
      expect(options.projection).to.be.eql(getProjection('EPSG:4326'));

      expect(options.requestEncoding).to.be.eql('REST');

      expect(options.tileGrid).to.be.a(WMTSTileGrid);
      expect(options.style).to.be.eql('default');

      const extent = options.tileGrid.getExtent();

      // calculate with of one tile, this will be used as tolerance for result extent
      const tile_width =
        ((68247.34668319306 * 0.00028) /
          getProjection('EPSG:4326').getMetersPerUnit()) *
        256;

      // compare with delta, due to rounding not the exact bounding box is returned...
      const expectDelta = (value, expected) =>
        expect(Math.abs(value - expected)).to.below(tile_width + 1e-10);

      expectDelta(extent[0], -36);
      expectDelta(extent[1], 15);
      expectDelta(extent[2], 43);
      expectDelta(extent[3], 90);
    });
  });

  describe('#setUrls()', function () {
    it('sets the URL for the source', function () {
      const source = new WMTS({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/',
      ];
      source.setUrls(urls);

      expect(source.getUrls()).to.eql(urls);
    });

    it('updates the key for the source', function () {
      const source = new WMTS({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/',
      ];
      source.setUrls(urls);

      expect(source.getKey()).to.eql(urls.join('\n'));
    });

    it('generates the correct tileUrlFunction during application of setUrl()', function () {
      const projection = getProjection('EPSG:3857');
      const source = new WMTS({
        projection: projection,
        requestEncoding: 'REST',
        urls: [
          'http://1.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
          'http://2.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
        ],
        tileGrid: new WMTSTileGrid({
          matrixIds: [0, 1, 2, 3, 4, 5, 6, 7],
          origin: [2690000, 1285000],
          resolutions: [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250],
        }),
      });

      const urls = [
        'https://a.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpg',
        'https://b.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpg',
      ];
      source.setUrls(urls);
      const tileUrl1 = source.tileUrlFunction([2, 9, -5], 1, projection);
      expect(tileUrl1).to.match(/https\:\/\/[ab]\.example\.com\/2\/-5\/9\.jpg/);
    });
  });

  describe('url option', function () {
    it('expands url template', function () {
      const tileSource = new WMTS({
        url: '{1-3}',
      });

      const urls = tileSource.getUrls();
      expect(urls).to.eql(['1', '2', '3']);
    });
  });

  describe('#getUrls', function () {
    let sourceOptions;
    let source;

    beforeEach(function () {
      sourceOptions = {
        layer: 'layer',
        style: 'default',
        matrixSet: 'foo',
        requestEncoding: 'REST',
        tileGrid: new WMTSTileGrid({
          origin: [0, 0],
          resolutions: [],
          matrixIds: [],
        }),
      };
    });

    describe('using a "url" option', function () {
      beforeEach(function () {
        sourceOptions.url = 'some_wmts_url';
        source = new WMTS(sourceOptions);
      });

      it('returns the WMTS URLs', function () {
        const urls = source.getUrls();
        expect(urls).to.be.eql(['some_wmts_url']);
      });
    });

    describe('using a "urls" option', function () {
      beforeEach(function () {
        sourceOptions.urls = ['some_wmts_url1', 'some_wmts_url2'];
        source = new WMTS(sourceOptions);
      });

      it('returns the WMTS URLs', function () {
        const urls = source.getUrls();
        expect(urls).to.be.eql(['some_wmts_url1', 'some_wmts_url2']);
      });
    });
  });

  describe('#getRequestEncoding', function () {
    let source;

    beforeEach(function () {
      source = new WMTS({
        layer: 'layer',
        style: 'default',
        matrixSet: 'foo',
        requestEncoding: 'REST',
        tileGrid: new WMTSTileGrid({
          origin: [0, 0],
          resolutions: [],
          matrixIds: [],
        }),
      });
    });

    it('returns the request encoding', function () {
      const requestEncoding = source.getRequestEncoding();
      expect(requestEncoding).to.be.eql('REST');
    });
  });
});
