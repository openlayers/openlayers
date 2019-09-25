import WMTSCapabilities from '../../../../src/ol/format/WMTSCapabilities.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import Projection from '../../../../src/ol/proj/Projection.js';
import WMTSTileGrid from '../../../../src/ol/tilegrid/WMTS.js';
import WMTS, {optionsFromCapabilities} from '../../../../src/ol/source/WMTS.js';


describe('ol.source.WMTS', () => {

  describe('when creating options from capabilities', () => {
    const parser = new WMTSCapabilities();
    let capabilities, content;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wmts/ogcsample.xml', function(xml) {
        try {
          content = xml;
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test(
      'returns null if the layer was not found in the capabilities',
      () => {
        const options = optionsFromCapabilities(capabilities, {
          layer: 'invalid'
        });

        expect(options).toBe(null);
      }
    );

    test('passes the crossOrigin option', () => {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        matrixSet: 'google3857',
        crossOrigin: ''
      });

      expect(options.crossOrigin).toEqual('');
    });

    test(
      'can create KVP options from spec/ol/format/wmts/ogcsample.xml',
      () => {
        const options = optionsFromCapabilities(
          capabilities,
          {layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857'});

        expect(options.urls).toBeInstanceOf(Array);
        expect(options.urls).toHaveLength(1);
        expect(options.urls[0]).toEqual('http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?');

        expect(options.layer).toEqual('BlueMarbleNextGeneration');

        expect(options.matrixSet).toEqual('google3857');

        expect(options.format).toEqual('image/jpeg');

        expect(options.projection).toBeInstanceOf(Projection);
        expect(options.projection).toEqual(getProjection('EPSG:3857'));

        expect(options.requestEncoding).toEqual('KVP');

        expect(options.tileGrid).toBeInstanceOf(WMTSTileGrid);

        expect(options.style).toEqual('DarkBlue');

        expect(options.dimensions).toEqual({Time: '20110805'});

        expect(options.crossOrigin).toBe(undefined);

      }
    );

    test(
      'can create REST options from spec/ol/format/wmts/ogcsample.xml',
      () => {
        const options = optionsFromCapabilities(capabilities, {
          layer: 'BlueMarbleNextGeneration',
          matrixSet: 'google3857',
          requestEncoding: 'REST'
        });

        expect(options.urls).toBeInstanceOf(Array);
        expect(options.urls).toHaveLength(1);
        expect(options.urls[0]).toEqual(
          'http://www.example.com/wmts/coastlines/{TileMatrix}/{TileRow}/{TileCol}.png'
        );

        expect(options.layer).toEqual('BlueMarbleNextGeneration');

        expect(options.matrixSet).toEqual('google3857');

        expect(options.format).toEqual('image/png');

        expect(options.projection).toBeInstanceOf(Projection);
        expect(options.projection).toEqual(getProjection('EPSG:3857'));

        expect(options.requestEncoding).toEqual('REST');

        expect(options.tileGrid).toBeInstanceOf(WMTSTileGrid);

        expect(options.style).toEqual('DarkBlue');

        expect(options.dimensions).toEqual({Time: '20110805'});

      }
    );

    test('can find a MatrixSet by SRS identifier', () => {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        projection: 'EPSG:3857',
        requestEncoding: 'REST'
      });

      expect(options.matrixSet).toEqual('google3857');
      expect(options.projection.getCode()).toEqual('EPSG:3857');
    });

    test('can find a MatrixSet by equivalent SRS identifier', () => {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        projection: 'EPSG:900913',
        requestEncoding: 'REST'
      });

      expect(options.matrixSet).toEqual('google3857');
      expect(options.projection.getCode()).toEqual('EPSG:900913');
    });

    test('can find the default MatrixSet', () => {
      const options = optionsFromCapabilities(capabilities, {
        layer: 'BlueMarbleNextGeneration',
        requestEncoding: 'REST'
      });

      expect(options.matrixSet).toEqual('BigWorldPixel');
      expect(options.projection.getCode()).toEqual('urn:ogc:def:crs:OGC:1.3:CRS84');
    });

    test(
      'uses the projection of the default MatrixSet if the config\'s projection is not supported',
      () => {
        const options = optionsFromCapabilities(capabilities, {
          layer: 'BlueMarbleNextGeneration',
          projection: new Projection({
            code: 'EPSG:2056',
            units: 'm'
          })
        });

        expect(options.matrixSet).toEqual('BigWorldPixel');
        expect(options.projection.getCode()).toEqual('urn:ogc:def:crs:OGC:1.3:CRS84');
      }
    );

    test(
      'doesn\'t fail if the GetCap doesn\'t contains Constraint tags',
      () => {
        const tmpXml = content.replace(/<ows:Constraint[\s\S]*?<\/ows:Constraint>/g, '');
        const tmpCapabilities = parser.read(tmpXml);
        expect(tmpCapabilities['OperationsMetadata']['GetTile']['DCP']['HTTP']['Get'][0]['Constraint']).toBe(undefined);
        const options = optionsFromCapabilities(tmpCapabilities,
          {layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857'});
        expect(options.layer).toEqual('BlueMarbleNextGeneration');
        expect(options.matrixSet).toEqual('google3857');
      }
    );

    test(
      'set KVP as default request encoding if the GetCap doesn\'t contains Constraint and ResourceUrl tags',
      () => {
        let tmpXml = content.replace(/<ows:Constraint[\s\S]*?<\/ows:Constraint>/g, '');
        tmpXml = tmpXml.replace(/<ResourceURL[\s\S]*?"\/>/g, '');

        const tmpCapabilities = parser.read(tmpXml);
        expect(tmpCapabilities['OperationsMetadata']['GetTile']['DCP']['HTTP']['Get'][0]['Constraint']).toBe(undefined);
        expect(tmpCapabilities['Contents']['Layer'][0]['ResourceURL']).toBe(undefined);
        const options = optionsFromCapabilities(tmpCapabilities,
          {layer: 'BlueMarbleNextGeneration', matrixSet: 'google3857'});
        expect(options.layer).toEqual('BlueMarbleNextGeneration');
        expect(options.matrixSet).toEqual('google3857');
        expect(options.urls).toBeInstanceOf(Array);
        expect(options.urls).toHaveLength(1);
        expect(options.urls[0]).toEqual('http://www.maps.bob/cgi-bin/MiraMon5_0.cgi?');
      }
    );
  });

  describe('when creating tileUrlFunction', () => {
    const defaultTileGrid = new WMTSTileGrid({
      origin: [-20037508.342789244, 20037508.342789244],
      resolutions: [559082264.029 * 0.28E-3,
        279541132.015 * 0.28E-3,
        139770566.007 * 0.28E-3],
      matrixIds: [0, 1, 2]
    });

    test('can replace lowercase REST parameters', () => {
      const source = new WMTS({
        layer: 'layer',
        style: 'default',
        urls: ['http://host/{layer}/{style}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg'],
        matrixSet: 'EPSG:3857',
        requestEncoding: 'REST',
        tileGrid: defaultTileGrid
      });

      const projection = getProjection('EPSG:3857');
      const url = source.tileUrlFunction(
        source.getTileCoordForTileUrlFunction([1, 1, 1]), 1, projection);
      expect(url).toEqual('http://host/layer/default/EPSG:3857/1/1/1.jpg');
    });

    test('can replace camelcase REST parameters', () => {
      const source = new WMTS({
        layer: 'layer',
        style: 'default',
        urls: ['http://host/{Layer}/{Style}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg'],
        matrixSet: 'EPSG:3857',
        requestEncoding: 'REST',
        tileGrid: defaultTileGrid
      });

      const projection = getProjection('EPSG:3857');
      const url = source.tileUrlFunction(
        source.getTileCoordForTileUrlFunction([1, 1, 1]), 1, projection);
      expect(url).toEqual('http://host/layer/default/EPSG:3857/1/1/1.jpg');
    });

    test('can replace dimensions', () => {
      const source = new WMTS({
        layer: 'layer',
        style: 'default',
        dimensions: {'Time': 42},
        urls: ['http://host/{Layer}/{Style}/{Time}/{tilematrixset}/{TileMatrix}/{TileCol}/{TileRow}.jpg'],
        matrixSet: 'EPSG:3857',
        requestEncoding: 'REST',
        tileGrid: defaultTileGrid
      });

      const projection = getProjection('EPSG:3857');
      const url = source.tileUrlFunction(
        source.getTileCoordForTileUrlFunction([1, 1, 1]), 1, projection);
      expect(url).toEqual('http://host/layer/default/42/EPSG:3857/1/1/1.jpg');
    });
  });

  describe('when creating options from Esri capabilities', () => {
    const parser = new WMTSCapabilities();
    let capabilities;
    beforeAll(function(done) {
      afterLoadText('spec/ol/format/wmts/arcgis.xml', function(xml) {
        try {
          capabilities = parser.read(xml);
        } catch (e) {
          done(e);
        }
        done();
      });
    });

    test('can create KVP options from spec/ol/format/wmts/arcgis.xml', () => {
      const options = optionsFromCapabilities(
        capabilities, {
          layer: 'Demographics_USA_Population_Density',
          requestEncoding: 'KVP',
          matrixSet: 'default028mm'
        });

      expect(options.urls).toBeInstanceOf(Array);
      expect(options.urls).toHaveLength(1);
      expect(options.urls[0]).toEqual('https://services.arcgisonline.com/arcgis/rest/services/' +
         'Demographics/USA_Population_Density/MapServer/WMTS?');
    });

    test(
      'can create REST options from spec/ol/format/wmts/arcgis.xml',
      () => {
        const options = optionsFromCapabilities(
          capabilities, {
            layer: 'Demographics_USA_Population_Density',
            matrixSet: 'default028mm'
          });

        expect(options.urls).toBeInstanceOf(Array);
        expect(options.urls).toHaveLength(1);
        expect(options.urls[0]).toEqual('https://services.arcgisonline.com/arcgis/rest/services/' +
           'Demographics/USA_Population_Density/MapServer/WMTS/' +
           'tile/1.0.0/Demographics_USA_Population_Density/' +
           '{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png');
      }
    );
  });

  describe('#setUrls()', () => {
    test('sets the URL for the source', () => {
      const source = new WMTS({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/'
      ];
      source.setUrls(urls);

      expect(source.getUrls()).toEqual(urls);
    });

    test('updates the key for the source', () => {
      const source = new WMTS({});

      const urls = [
        'https://a.example.com/',
        'https://b.example.com/',
        'https://c.example.com/'
      ];
      source.setUrls(urls);

      expect(source.getKey()).toEqual(urls.join('\n'));
    });

    test(
      'generates the correct tileUrlFunction during application of setUrl()',
      () => {
        const projection = getProjection('EPSG:3857');
        const source = new WMTS({
          projection: projection,
          requestEncoding: 'REST',
          urls: [
            'http://1.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
            'http://2.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpeg'
          ],
          tileGrid: new WMTSTileGrid({
            matrixIds: [0, 1, 2, 3, 4, 5, 6, 7],
            origin: [2690000, 1285000],
            resolutions: [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250]
          })
        });

        const urls = [
          'https://a.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpg',
          'https://b.example.com/{TileMatrix}/{TileRow}/{TileCol}.jpg'
        ];
        source.setUrls(urls);
        const tileUrl1 = source.tileUrlFunction([2, 9, -5], 1, projection);
        expect(tileUrl1).toMatch(/https\:\/\/[ab]\.example\.com\/2\/-5\/9\.jpg/);
      }
    );
  });

  describe('url option', () => {
    test('expands url template', () => {
      const tileSource = new WMTS({
        url: '{1-3}'
      });

      const urls = tileSource.getUrls();
      expect(urls).toEqual(['1', '2', '3']);
    });
  });

  describe('#getUrls', () => {

    let sourceOptions;
    let source;

    beforeEach(() => {
      sourceOptions = {
        layer: 'layer',
        style: 'default',
        matrixSet: 'foo',
        requestEncoding: 'REST',
        tileGrid: new WMTSTileGrid({
          origin: [0, 0],
          resolutions: [],
          matrixIds: []
        })
      };
    });

    describe('using a "url" option', () => {
      beforeEach(() => {
        sourceOptions.url = 'some_wmts_url';
        source = new WMTS(sourceOptions);
      });

      test('returns the WMTS URLs', () => {
        const urls = source.getUrls();
        expect(urls).toEqual(['some_wmts_url']);
      });

    });

    describe('using a "urls" option', () => {
      beforeEach(() => {
        sourceOptions.urls = ['some_wmts_url1', 'some_wmts_url2'];
        source = new WMTS(sourceOptions);
      });

      test('returns the WMTS URLs', () => {
        const urls = source.getUrls();
        expect(urls).toEqual(['some_wmts_url1', 'some_wmts_url2']);
      });

    });

  });

  describe('#getRequestEncoding', () => {

    let source;

    beforeEach(() => {
      source = new WMTS({
        layer: 'layer',
        style: 'default',
        matrixSet: 'foo',
        requestEncoding: 'REST',
        tileGrid: new WMTSTileGrid({
          origin: [0, 0],
          resolutions: [],
          matrixIds: []
        })
      });
    });

    test('returns the request encoding', () => {
      const requestEncoding = source.getRequestEncoding();
      expect(requestEncoding).toEqual('REST');
    });

  });

});
