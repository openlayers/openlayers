import ImageArcGISRest from '../../../../src/ol/source/ImageArcGISRest.js';
import {get as getProjection} from '../../../../src/ol/proj.js';


describe('ol.source.ImageArcGISRest', () => {

  let pixelRatio, options, projection, proj3857, resolution;
  beforeEach(() => {
    pixelRatio = 1;
    projection = getProjection('EPSG:4326');
    proj3857 = getProjection('EPSG:3857');
    resolution = 0.1;
    options = {
      params: {},
      url: 'http://example.com/MapServer'
    };
  });

  describe('#getImage', () => {

    test('returns a image with the expected URL', () => {
      const source = new ImageArcGISRest(options);
      const image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      const uri = new URL(image.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/MapServer/export');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('5.5,2.25,-9.5,0.75');
      expect(queryData.get('FORMAT')).toBe('PNG32');
      expect(queryData.get('IMAGESR')).toBe('3857');
      expect(queryData.get('BBOXSR')).toBe('3857');
      expect(queryData.get('TRANSPARENT')).toBe('true');

    });

    test('returns a non floating point DPI value', () => {
      const source = new ImageArcGISRest(options);
      const image = source.getImage([3, 2, -7, 1.12], resolution, 1.01, proj3857);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).toBe('91');
    });

    test('returns a image with the expected URL for ImageServer', () => {
      options.url = 'http://example.com/ImageServer';
      const source = new ImageArcGISRest(options);
      const image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      const uri = new URL(image.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/ImageServer/exportImage');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('5.5,2.25,-9.5,0.75');
      expect(queryData.get('FORMAT')).toBe('PNG32');
      expect(queryData.get('IMAGESR')).toBe('3857');
      expect(queryData.get('BBOXSR')).toBe('3857');
      expect(queryData.get('TRANSPARENT')).toBe('true');
    });

    test('allows various parameters to be overridden', () => {
      options.params.FORMAT = 'png';
      options.params.TRANSPARENT = false;
      const source = new ImageArcGISRest(options);
      const image = source.getImage([3, 2, -3, 1], resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('png');
      expect(queryData.get('TRANSPARENT')).toBe('false');
    });

    test('allows adding rest option', () => {
      options.params.LAYERS = 'show:1,3,4';
      const source = new ImageArcGISRest(options);
      const image = source.getImage([3, 2, -3, 1], resolution, pixelRatio, proj3857);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('LAYERS')).toBe('show:1,3,4');
    });
  });

  describe('#updateParams', () => {

    test('add a new param', () => {
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      const image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).toBe('value');
    });

    test('updates an existing param', () => {
      options.params.TEST = 'value';

      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const image = source.getImage([3, 2, -7, 1], resolution, pixelRatio, proj3857);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).toBe('newValue');
    });

  });

  describe('#getParams', () => {

    test('verify getting a param', () => {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);

      const setParams = source.getParams();

      expect(setParams).toEqual({TEST: 'value'});
    });

    test('verify on adding a param', () => {
      options.params.TEST = 'value';

      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST2': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).toEqual({TEST: 'value', TEST2: 'newValue'});
    });

    test('verify on update a param', () => {
      options.params.TEST = 'value';

      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).toEqual({TEST: 'newValue'});
    });

  });

  describe('#getUrl', () => {

    test('verify getting url', () => {
      options.url = 'http://test.com/MapServer';

      const source = new ImageArcGISRest(options);

      const url = source.getUrl();

      expect(url).toEqual('http://test.com/MapServer');
    });


  });

  describe('#setUrl', () => {

    test('verify setting url when not set yet', () => {

      const source = new ImageArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      const url = source.getUrl();

      expect(url).toEqual('http://test.com/MapServer');
    });

    test('verify setting url with existing url', () => {
      options.url = 'http://test.com/MapServer';

      const source = new ImageArcGISRest(options);
      source.setUrl('http://test2.com/MapServer');

      const url = source.getUrl();

      expect(url).toEqual('http://test2.com/MapServer');
    });
  });


});
