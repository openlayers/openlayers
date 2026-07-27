import {assert} from 'chai';
import ImageState from '../../../../../src/ol/ImageState.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import ImageArcGISRest from '../../../../../src/ol/source/ImageArcGISRest.js';

describe('ol/source/ImageArcGISRest', function () {
  let pixelRatio, options, projection, proj3857, resolution;
  beforeEach(function () {
    pixelRatio = 1;
    projection = getProjection('EPSG:4326');
    proj3857 = getProjection('EPSG:3857');
    resolution = 0.1;
    options = {
      params: {},
      url: new URL('/MapServer', window.location.href).toString(),
    };
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new ImageArcGISRest(options);
      assert.strictEqual(source.getInterpolate(), true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new ImageArcGISRest(
        Object.assign({interpolate: false}, options),
      );
      assert.strictEqual(source.getInterpolate(), false);
    });
  });

  describe('#getImage', function () {
    it('returns a image with the expected URL', function () {
      const source = new ImageArcGISRest(options);
      const viewExtent = [3, 2, -7, 1];
      const image = source.getImage(
        viewExtent,
        resolution,
        pixelRatio,
        proj3857,
      );
      image.load();

      const uri = new URL(image.getImage().src);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/MapServer/export');

      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('size'), '150,16');
      assert.strictEqual(queryData.get('bbox'), '-9.5,0.7,5.5,2.3');
      assert.strictEqual(queryData.get('format'), 'png32');
      assert.strictEqual(queryData.get('imageSR'), '3857');
      assert.strictEqual(queryData.get('bboxSR'), '3857');
      assert.strictEqual(queryData.get('transparent'), 'true');
    });

    it('returns a non floating point dpi value', function () {
      const source = new ImageArcGISRest(options);
      const image = source.getImage(
        [3, 2, -7, 1.12],
        resolution,
        1.01,
        proj3857,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('dpi'), '91');
    });

    it('returns a image with the expected URL for ImageServer', function () {
      options.url = new URL('/ImageServer', window.location.href).toString();
      const source = new ImageArcGISRest(options);
      const image = source.getImage(
        [3, 2, -7, 1],
        resolution,
        pixelRatio,
        proj3857,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/ImageServer/exportImage');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('bbox'), '-9.5,0.7,5.5,2.3');
      assert.strictEqual(queryData.get('format'), 'png32');
      assert.strictEqual(queryData.get('imageSR'), '3857');
      assert.strictEqual(queryData.get('bboxSR'), '3857');
      assert.strictEqual(queryData.get('transparent'), 'true');
    });

    it('allows various parameters to be overridden', function () {
      options.params.format = 'png';
      options.params.transparent = false;
      const source = new ImageArcGISRest(options);
      const image = source.getImage(
        [3, 2, -3, 1],
        resolution,
        pixelRatio,
        projection,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('format'), 'png');
      assert.strictEqual(queryData.get('transparent'), 'false');
    });

    it('allows adding rest option', function () {
      options.params.LAYERS = 'show:1,3,4';
      const source = new ImageArcGISRest(options);
      const image = source.getImage(
        [3, 2, -3, 1],
        resolution,
        pixelRatio,
        proj3857,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('LAYERS'), 'show:1,3,4');
    });
  });

  describe('#updateParams', function () {
    let map;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('add a new param', function () {
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      const image = source.getImage(
        [3, 2, -7, 1],
        resolution,
        pixelRatio,
        proj3857,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TEST'), 'value');
    });

    it('updates an existing param', function () {
      options.params.TEST = 'value';

      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const image = source.getImage(
        [3, 2, -7, 1],
        resolution,
        pixelRatio,
        proj3857,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TEST'), 'newValue');
    });

    it('reloads from server', () =>
      new Promise((resolve) => {
        const srcs = [];
        options.params.TEST = 'value';
        const source = new ImageArcGISRest(options);
        source.setImageLoadFunction(function (image, src) {
          srcs.push(src);
          image.state = ImageState.LOADED;
          source.loading = false;
        });
        map.addLayer(new ImageLayer({source: source}));
        map.once('rendercomplete', function () {
          source.updateParams({'TEST': 'newValue'});
          map.once('rendercomplete', function () {
            assert.strictEqual(srcs.length, 2);
            assert.strictEqual(
              new URL(srcs[0]).searchParams.get('TEST'),
              'value',
            );
            assert.strictEqual(
              new URL(srcs[1]).searchParams.get('TEST'),
              'newValue',
            );
            resolve();
          });
        });
      }));
  });

  describe('#setParams', function () {
    let map;
    beforeEach(function () {
      const target = document.createElement('div');
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        view: new View({
          center: [0, 0],
          zoom: 0,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('allows params to be set', function () {
      const before = {test: 'before', foo: 'bar'};
      const source = new ImageArcGISRest({params: before});
      source.setParams({test: 'after'});

      const params = source.getParams();
      assert.deepEqual(params, {test: 'after'});

      assert.deepEqual(before, {test: 'before', foo: 'bar'});
    });

    it('reloads from server', () =>
      new Promise((resolve) => {
        const srcs = [];
        options.params.TEST = 'value';
        const source = new ImageArcGISRest(options);
        source.setImageLoadFunction(function (image, src) {
          srcs.push(src);
          image.state = ImageState.LOADED;
          source.loading = false;
        });
        map.addLayer(new ImageLayer({source: source}));
        map.once('rendercomplete', function () {
          source.setParams({'TEST': 'newValue'});
          map.once('rendercomplete', function () {
            assert.strictEqual(srcs.length, 2);
            assert.strictEqual(
              new URL(srcs[0]).searchParams.get('TEST'),
              'value',
            );
            assert.strictEqual(
              new URL(srcs[1]).searchParams.get('TEST'),
              'newValue',
            );
            resolve();
          });
        });
      }));
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);
      const setParams = source.getParams();
      assert.deepEqual(setParams, {TEST: 'value'});
    });

    it('verify on adding a param', function () {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST2': 'newValue'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {TEST: 'value', TEST2: 'newValue'});
      assert.deepEqual(options.params, {TEST: 'value'});
    });

    it('verify on update a param', function () {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {TEST: 'newValue'});
      assert.deepEqual(options.params, {TEST: 'value'});
    });
  });

  describe('#getUrl', function () {
    it('verify getting url', function () {
      options.url = 'http://test.com/MapServer';

      const source = new ImageArcGISRest(options);

      const url = source.getUrl();

      assert.deepEqual(url, 'http://test.com/MapServer');
    });
  });

  describe('#setUrl', function () {
    it('verify setting url when not set yet', function () {
      const source = new ImageArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      const url = source.getUrl();

      assert.deepEqual(url, 'http://test.com/MapServer');
    });

    it('verify setting url with existing url', function () {
      options.url = 'http://test.com/MapServer';

      const source = new ImageArcGISRest(options);
      source.setUrl('http://test2.com/MapServer');

      const url = source.getUrl();

      assert.deepEqual(url, 'http://test2.com/MapServer');
    });
  });
});
