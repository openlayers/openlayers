import ImageTile from '../../../../src/ol/ImageTile.js';
import TileArcGISRest from '../../../../src/ol/source/TileArcGISRest.js';
import {get as getProjection} from '../../../../src/ol/proj.js';


describe('ol.source.TileArcGISRest', () => {

  let options;
  beforeEach(() => {
    options = {
      params: {},
      url: 'http://example.com/MapServer'
    };
  });

  describe('#getTile', () => {

    test('returns a tile with the expected URL', () => {
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/MapServer/export');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('FORMAT')).toBe('PNG32');
      expect(queryData.get('SIZE')).toBe('256,256');
      expect(queryData.get('IMAGESR')).toBe('3857');
      expect(queryData.get('BBOXSR')).toBe('3857');
      expect(queryData.get('TRANSPARENT')).toBe('true');

    });

    test('returns a non floating point DPI value', () => {
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1.12, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).toBe('101');
    });

    test('takes DPI from params if specified', () => {
      options.params.DPI = 96;
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1.12, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).toBe('108');
      delete options.params.DPI;
    });

    test('returns a tile with the expected URL with url list', () => {

      options.urls = ['http://test1.com/MapServer', 'http://test2.com/MapServer'];
      const source = new TileArcGISRest(options);

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toMatch(/test[12]\.com/);
      expect(uri.pathname).toBe('/MapServer/export');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('FORMAT')).toBe('PNG32');
      expect(queryData.get('SIZE')).toBe('256,256');
      expect(queryData.get('IMAGESR')).toBe('3857');
      expect(queryData.get('BBOXSR')).toBe('3857');
      expect(queryData.get('TRANSPARENT')).toBe('true');

    });

    test('returns a tile with the expected URL for ImageServer', () => {
      options.url = 'http://example.com/ImageServer';
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      expect(tile).toBeInstanceOf(ImageTile);
      const uri = new URL(tile.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/ImageServer/exportImage');
      const queryData = uri.searchParams;
      const bbox = queryData.get('BBOX').split(',').map(parseFloat);
      expect(bbox[0]).roughlyEqual(-10018754.171394622, 1e-9);
      expect(bbox[1]).roughlyEqual(-15028131.257091936, 1e-9);
      expect(bbox[2]).roughlyEqual(-5009377.085697311, 1e-9);
      expect(bbox[3]).roughlyEqual(-10018754.171394624, 1e-9);
      expect(queryData.get('FORMAT')).toBe('PNG32');
      expect(queryData.get('SIZE')).toBe('256,256');
      expect(queryData.get('IMAGESR')).toBe('3857');
      expect(queryData.get('BBOXSR')).toBe('3857');
      expect(queryData.get('TRANSPARENT')).toBe('true');
    });

    test('allows various parameters to be overridden', () => {
      options.params.FORMAT = 'png';
      options.params.TRANSPARENT = false;
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('png');
      expect(queryData.get('TRANSPARENT')).toBe('false');
    });

    test('allows adding rest option', () => {
      options.params.LAYERS = 'show:1,3,4';
      const source = new TileArcGISRest(options);
      const tile = source.getTile(3, 2, 2, 1, getProjection('EPSG:4326'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('LAYERS')).toBe('show:1,3,4');
    });
  });

  describe('#updateParams', () => {

    test('add a new param', () => {
      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).toBe('value');
    });

    test('updates an existing param', () => {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const tile = source.getTile(3, 2, 6, 1, getProjection('EPSG:3857'));
      const uri = new URL(tile.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).toBe('newValue');
    });

  });

  describe('#getParams', () => {

    test('verify getting a param', () => {
      options.params.TEST = 'value';
      const source = new TileArcGISRest(options);

      const setParams = source.getParams();

      expect(setParams).toEqual({TEST: 'value'});
    });

    test('verify on adding a param', () => {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST2': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).toEqual({TEST: 'value', TEST2: 'newValue'});
    });

    test('verify on update a param', () => {
      options.params.TEST = 'value';

      const source = new TileArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).toEqual({TEST: 'newValue'});
    });

  });

  describe('#getUrls', () => {

    test('verify getting array of urls', () => {
      options.urls = ['http://test.com/MapServer', 'http://test2.com/MapServer'];

      const source = new TileArcGISRest(options);

      const urls = source.getUrls();

      expect(urls).toEqual(['http://test.com/MapServer', 'http://test2.com/MapServer']);
    });


  });

  describe('#setUrls', () => {

    test('verify setting urls when not set yet', () => {

      const source = new TileArcGISRest(options);
      source.setUrls(['http://test.com/MapServer', 'http://test2.com/MapServer']);

      const urls = source.getUrls();

      expect(urls).toEqual(['http://test.com/MapServer', 'http://test2.com/MapServer']);
    });

    test('verify setting urls with existing list', () => {
      options.urls = ['http://test.com/MapServer', 'http://test2.com/MapServer'];

      const source = new TileArcGISRest(options);
      source.setUrls(['http://test3.com/MapServer', 'http://test4.com/MapServer']);

      const urls = source.getUrls();

      expect(urls).toEqual(['http://test3.com/MapServer', 'http://test4.com/MapServer']);
    });
  });

  describe('#setUrl', () => {

    test('verify setting url with no urls', () => {

      const source = new TileArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      const urls = source.getUrls();

      expect(urls).toEqual(['http://test.com/MapServer']);
    });

    test('verify setting url with list of urls', () => {
      options.urls = ['http://test.com/MapServer', 'http://test2.com/MapServer'];

      const source = new TileArcGISRest(options);
      source.setUrl('http://test3.com/MapServer');

      const urls = source.getUrls();

      expect(urls).toEqual(['http://test3.com/MapServer']);

      const tileUrl = source.tileUrlFunction([0, 0, 0], 1, getProjection('EPSG:4326'));
      expect(tileUrl.indexOf(urls[0])).toBe(0);
    });


  });

});
