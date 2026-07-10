import {assert} from 'chai';
import ImageState from '../../../../../src/ol/ImageState.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import {
  getForViewAndSize,
  getHeight,
  getWidth,
} from '../../../../../src/ol/extent.js';
import Image from '../../../../../src/ol/layer/Image.js';
import {fromLonLat, get as getProjection} from '../../../../../src/ol/proj.js';
import OGCMap from '../../../../../src/ol/source/OGCMap.js';

describe('ol/source/OGCMap', function () {
  let extent, pixelRatio, options, resolution, projection;
  beforeEach(function () {
    extent = [10, 20, 30, 40];
    pixelRatio = 1;
    projection = getProjection('EPSG:4326');
    resolution = 0.1;
    options = {
      ratio: 1,
      url: new URL('/ogcapi/map', window.location.href).toString(),
      params: {
        'param': 'test',
      },
    };
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      const source = new OGCMap(options);
      const setParams = source.getParams();
      assert.deepEqual(setParams, {param: 'test'});
    });

    it('verify on adding a param', function () {
      const source = new OGCMap(options);
      source.updateParams({'test': 'value'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {param: 'test', test: 'value'});
      assert.deepEqual(options.params, {param: 'test'});
    });

    it('verify on update a param', function () {
      const source = new OGCMap(options);
      source.updateParams({'param': 'newValue'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'param': 'newValue'});
      assert.deepEqual(options.params, {'param': 'test'});
    });
  });

  describe('#setParams', function () {
    it('sets new parameters', function () {
      const before = {test: 'before', foo: 'bar'};
      const source = new OGCMap({params: before});
      source.setParams({test: 'after'});

      const params = source.getParams();
      assert.deepEqual(params, {test: 'after'});

      assert.deepEqual(before, {test: 'before', foo: 'bar'});
    });

    it('sets new parameters and applies them on the next image load', function () {
      const viewExtent = [10, 20, 30.1, 39.9];
      const source = new OGCMap({
        ...options,
        params: {
          ...options.params,
          f: 'image/jpeg',
        },
      });
      let image = source.getImage(
        viewExtent,
        resolution,
        pixelRatio,
        projection,
      );
      image.load();
      let uri = new URL(image.getImage().src);
      assert.strictEqual(uri.searchParams.get('f'), 'image/jpeg');

      source.setParams({
        ...options.params,
        f: 'image/png',
      });
      image = source.getImage(viewExtent, resolution, pixelRatio, projection);
      image.load();
      uri = new URL(image.getImage().src);
      assert.strictEqual(uri.searchParams.get('f'), 'image/png');
    });
  });

  describe('#getImage', function () {
    it('creates an image with the expected URL', function () {
      [1, 1.5].forEach(function (ratio) {
        options.ratio = ratio;
        const source = new OGCMap(options);
        const viewExtent = [10, 20, 30.1, 39.9];
        const viewWidth = getWidth(viewExtent);
        const viewHeight = getHeight(viewExtent);
        const image = source.getImage(
          viewExtent,
          resolution,
          pixelRatio,
          projection,
        );
        image.load();
        const uri = new URL(image.getImage().src);
        const queryData = uri.searchParams;
        const imageWidth = Number(queryData.get('width'));
        const imageHeight = Number(queryData.get('height'));
        const bbox = queryData.get('bbox').split(',').map(Number);
        const bboxAspectRatio = (bbox[3] - bbox[1]) / (bbox[2] - bbox[0]);
        const imageAspectRatio = imageWidth / imageHeight;
        const marginWidth = Math.ceil(
          ((ratio - 1) * viewWidth) / resolution / 2,
        );
        const marginHeight = Math.ceil(
          ((ratio - 1) * viewHeight) / resolution / 2,
        );

        assert.strictEqual(
          imageWidth,
          Math.round(viewWidth / resolution) + 2 * marginWidth,
        );
        assert.strictEqual(
          imageHeight,
          Math.round(viewHeight / resolution) + 2 * marginHeight,
        );
        assert.approximately(bboxAspectRatio, imageAspectRatio, 1e-12);
      });
    });

    it('uses correct width, height and mm-per-pixel for HiDPI devices', function () {
      pixelRatio = 2;
      const source = new OGCMap(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      const width = Number(queryData.get('width'));
      const height = Number(queryData.get('height'));
      assert.strictEqual(width, 400);
      assert.strictEqual(height, 400);
      const mmPerPixel = Number(queryData.get('mm-per-pixel'));
      assert.strictEqual(mmPerPixel, 0.28 / 2);
    });

    it('requests integer width and height', function () {
      options.ratio = 1.5;
      const source = new OGCMap(options);
      const image = source.getImage(
        [10, 20, 30.1, 39.9],
        resolution,
        pixelRatio,
        projection,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      const width = parseFloat(queryData.get('width'));
      const height = parseFloat(queryData.get('height'));
      assert.strictEqual(width, Math.round(width));
      assert.strictEqual(height, Math.round(height));
    });

    it('does not request extra pixels due to floating point issues', function () {
      const source = new OGCMap({
        url: new URL('/wms', window.location.href).toString(),
        ratio: 1,
      });

      const mapSize = [1110, 670];
      const rotation = 0;
      const resolution = 354.64216525539024;
      const center = [1224885.7248147277, 6681822.177576577];
      const extent = getForViewAndSize(center, resolution, rotation, mapSize);
      const projection = getProjection('EPSG:3857');
      const image = source.getImage(extent, resolution, 1, projection);
      image.load();
      const params = new URL(image.getImage().src).searchParams;

      const imageWidth = Number(params.get('width'));
      const imageHeight = Number(params.get('height'));
      assert.strictEqual(imageWidth, mapSize[0]);
      assert.strictEqual(imageHeight, mapSize[1]);
    });

    it('sets width and height to match the aspect ratio of bbox', function () {
      const source = new OGCMap(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/ogcapi/map');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('bbox'), '20,10,40,30');
      assert.strictEqual(queryData.get('crs'), 'EPSG:4326');
      assert.strictEqual(queryData.get('bbox-crs'), 'EPSG:4326');
      assert.strictEqual(queryData.get('height'), '200');
      assert.strictEqual(queryData.get('width'), '200');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it('sets crs and bbox-crs to match the projection', function () {
      const source = new OGCMap(options);
      const image1 = source.getImage(
        extent,
        resolution,
        pixelRatio,
        projection,
      );
      image1.load();
      const uri1 = new URL(image1.getImage().src);
      const queryData1 = uri1.searchParams;
      assert.strictEqual(queryData1.get('bbox'), '20,10,40,30');
      assert.strictEqual(queryData1.get('crs'), 'EPSG:4326');
      assert.strictEqual(queryData1.get('bbox-crs'), 'EPSG:4326');

      const projection2 = getProjection('EPSG:3857');
      const image2 = source.getImage(
        extent,
        resolution,
        pixelRatio,
        projection2,
      );
      image2.load();
      const uri2 = new URL(image2.getImage().src);
      const queryData2 = uri2.searchParams;
      assert.strictEqual(queryData2.get('bbox'), '10,20,30,40');
      assert.strictEqual(queryData2.get('crs'), 'EPSG:3857');
      assert.strictEqual(queryData2.get('bbox-crs'), 'EPSG:3857');

      const projection3 = getProjection('EPSG:900913');
      const image3 = source.getImage(
        extent,
        resolution,
        pixelRatio,
        projection3,
      );
      image3.load();
      const uri3 = new URL(image3.getImage().src);
      const queryData3 = uri3.searchParams;
      assert.strictEqual(queryData3.get('bbox'), '10,20,30,40');
      assert.strictEqual(queryData3.get('crs'), 'EPSG:900913');
      assert.strictEqual(queryData3.get('bbox-crs'), 'EPSG:900913');
    });

    it('changes the bbox order for EN axis orientations', function () {
      const source = new OGCMap(options);
      projection = getProjection('CRS:84');
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('bbox'), '10,20,30,40');
    });

    it('creates an image with a custom imageLoadFunction', function () {
      const imageLoadFunction = vi.fn();
      options.imageLoadFunction = imageLoadFunction;
      const source = new OGCMap(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      assert.isAbove(imageLoadFunction.mock.calls.length, 0);
      assert.deepEqual(imageLoadFunction.mock.calls[0][0], image);
      assert.strictEqual(
        imageLoadFunction.mock.calls[0][1],
        window.location.origin +
          '/ogcapi/map?param=test&width=200&height=200&crs=EPSG%3A4326&bbox-crs=EPSG%3A4326&bbox=20%2C10%2C40%2C30',
      );
    });

    it('returns same image for consecutive calls with same args', function () {
      const extent = [10.01, 20, 30.01, 40];
      const source = new OGCMap(options);
      const image1 = source.getImage(
        extent,
        resolution,
        pixelRatio,
        projection,
      );
      const image2 = source.getImage(
        extent,
        resolution,
        pixelRatio,
        projection,
      );
      assert.equal(image1, image2);
    });

    it('returns same image for calls with similar extents', () =>
      new Promise((resolve, reject) => {
        options.ratio = 1.5;
        const source = new OGCMap(options);
        let image1 = undefined;
        let image2 = undefined;
        let extent = [10.01, 20, 30.01, 40];
        image1 = source.getImage(extent, resolution, pixelRatio, projection);
        source.on('imageloadend', function onloadend() {
          source.un('imageloadend', onloadend);
          extent = [10.01, 20.1, 30.01, 40.1];
          image2 = source.getImage(extent, resolution, pixelRatio, projection);
          try {
            assert.equal(image1, image2);
            resolve();
          } catch (e) {
            reject(e);
            return;
          }
        });
        image1.load();
      }));

    it('calculates correct image size with ratio', function () {
      options.ratio = 1.5;
      const source = new OGCMap(options);
      const extent = [10, 5, 30, 45];
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const size = [
        Number(uri.searchParams.get('width')),
        Number(uri.searchParams.get('height')),
      ];
      assert.deepEqual(size, [300, 600]);
    });
  });

  describe('#refresh()', function () {
    let map, source;
    let callCount = 0;
    beforeEach(
      () =>
        new Promise((resolve) => {
          source = new OGCMap(options);
          source.setImageLoadFunction(function (image) {
            ++callCount;
            image.state = ImageState.LOADED;
            source.loading = false;
          });
          const target = document.createElement('div');
          target.style.width = '100px';
          target.style.height = '100px';
          document.body.appendChild(target);
          map = new Map({
            target: target,
            layers: [
              new Image({
                source: source,
              }),
            ],
            view: new View({
              center: [0, 0],
              zoom: 0,
            }),
          });
          map.once('rendercomplete', function () {
            callCount = 0;
            resolve();
          });
        }),
    );

    afterEach(function () {
      disposeMap(map);
    });

    it('reloads from server', () =>
      new Promise((resolve) => {
        map.once('rendercomplete', function () {
          assert.strictEqual(callCount, 1);
          resolve();
        });
        source.refresh();
      }));
  });

  describe('reprojection', function () {
    let map, source;
    const queryData = [];
    beforeEach(function () {
      const options = {
        ratio: 1,
        url: new URL('/ogciapi/map', window.location.href).toString(),
        projection: 'EPSG:4326',
      };
      source = new OGCMap(options);
      source.setImageLoadFunction(function (image, src) {
        queryData.push(new URL(src).searchParams);
        image.state = ImageState.LOADED;
        source.loading = false;
      });
      const target = document.createElement('div');
      target.style.width = '256px';
      target.style.height = '256px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new Image({
            source: source,
          }),
        ],
        view: new View({
          zoom: 0,
        }),
      });
    });

    afterEach(function () {
      disposeMap(map);
      queryData.length = 0;
      getProjection('EPSG:3857').setGlobal(true);
      getProjection('EPSG:4326').setGlobal(true);
    });

    it('loads wrapped extents when both projections are global', () =>
      new Promise((resolve) => {
        map.once('rendercomplete', function () {
          assert.strictEqual(queryData.length, 1);
          assert.strictEqual(
            queryData[0].get('bbox'),
            '-85.078125,181,85.078125,541',
          );
          assert.strictEqual(queryData[0].get('width'), '256');
          assert.strictEqual(queryData[0].get('height'), '121');
          resolve();
        });
        map.getView().setCenter(fromLonLat([361, 0]));
      }));

    it('does not load outside extent when view projection is not global', () =>
      new Promise((resolve) => {
        getProjection('EPSG:3857').setGlobal(false);
        map.once('rendercomplete', function () {
          assert.strictEqual(queryData.length, 0);
          resolve();
        });
        map.getView().setCenter(fromLonLat([361, 0]));
      }));

    it('does not load outside extent when source projection is not global', () =>
      new Promise((resolve) => {
        getProjection('EPSG:4326').setGlobal(false);
        map.once('rendercomplete', function () {
          assert.strictEqual(queryData.length, 0);
          resolve();
        });
        map.getView().setCenter(fromLonLat([361, 0]));
      }));
  });
});
