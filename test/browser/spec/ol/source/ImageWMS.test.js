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
import ImageWMS from '../../../../../src/ol/source/ImageWMS.js';

describe('ol/source/ImageWMS', function () {
  let extent, pixelRatio, options, optionsReproj, resolution, projection;
  beforeEach(function () {
    extent = [10, 20, 30, 40];
    pixelRatio = 1;
    projection = getProjection('EPSG:4326');
    resolution = 0.1;
    options = {
      params: {
        'LAYERS': 'layer',
      },
      ratio: 1,
      url: new URL('/wms', window.location.href).toString(),
    };
    optionsReproj = {
      params: {
        'LAYERS': 'layer',
      },
      ratio: 1,
      url: new URL('/wms', window.location.href).toString(),
      projection: 'EPSG:3857',
    };
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      const source = new ImageWMS(options);
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'LAYERS': 'layer'});
    });

    it('verify on adding a param', function () {
      const source = new ImageWMS(options);
      source.updateParams({'TEST': 'value'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'LAYERS': 'layer', TEST: 'value'});
      assert.deepEqual(options.params, {'LAYERS': 'layer'});
    });

    it('verify on update a param', function () {
      const source = new ImageWMS(options);
      source.updateParams({'LAYERS': 'newLayer'});
      const setParams = source.getParams();
      assert.deepEqual(setParams, {'LAYERS': 'newLayer'});
      assert.deepEqual(options.params, {'LAYERS': 'layer'});
    });
  });

  describe('#setParams', function () {
    it('sets new parameters', function () {
      const before = {test: 'before', foo: 'bar'};
      const source = new ImageWMS({params: before});
      source.setParams({test: 'after'});

      const params = source.getParams();
      assert.deepEqual(params, {test: 'after'});

      assert.deepEqual(before, {test: 'before', foo: 'bar'});
    });

    it('sets new parameters and applies them on the next image load', function () {
      const viewExtent = [10, 20, 30.1, 39.9];
      const source = new ImageWMS({
        ...options,
        params: {
          ...options.params,
          FORMAT: 'image/jpeg',
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
      assert.strictEqual(uri.searchParams.get('FORMAT'), 'image/jpeg');

      source.setParams({
        ...options.params,
        FORMAT: 'image/png',
      });
      image = source.getImage(viewExtent, resolution, pixelRatio, projection);
      image.load();
      uri = new URL(image.getImage().src);
      assert.strictEqual(uri.searchParams.get('FORMAT'), 'image/png');
    });
  });

  describe('#getImage', function () {
    it('creates an image with the expected URL', function () {
      [1, 1.5].forEach(function (ratio) {
        options.ratio = ratio;
        const source = new ImageWMS(options);
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
        const imageWidth = Number(queryData.get('WIDTH'));
        const imageHeight = Number(queryData.get('HEIGHT'));
        const bbox = queryData.get('BBOX').split(',').map(Number);
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

    it('uses correct WIDTH and HEIGHT for HiDPI devices', function () {
      pixelRatio = 2;
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      const width = Number(queryData.get('WIDTH'));
      const height = Number(queryData.get('HEIGHT'));
      assert.strictEqual(width, 400);
      assert.strictEqual(height, 400);
    });

    it('requests integer WIDTH and HEIGHT', function () {
      options.ratio = 1.5;
      const source = new ImageWMS(options);
      const image = source.getImage(
        [10, 20, 30.1, 39.9],
        resolution,
        pixelRatio,
        projection,
      );
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      const width = parseFloat(queryData.get('WIDTH'));
      const height = parseFloat(queryData.get('HEIGHT'));
      assert.strictEqual(width, Math.round(width));
      assert.strictEqual(height, Math.round(height));
    });

    it('does not request extra pixels due to floating point issues', function () {
      const source = new ImageWMS({
        params: {LAYERS: 'layer'},
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

      const imageWidth = Number(params.get('WIDTH'));
      const imageHeight = Number(params.get('HEIGHT'));
      assert.strictEqual(imageWidth, mapSize[0]);
      assert.strictEqual(imageHeight, mapSize[1]);
    });

    it('sets WIDTH and HEIGHT to match the aspect ratio of BBOX', function () {
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '20,10,40,30');
      assert.strictEqual(queryData.get('CRS'), 'EPSG:4326');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '200');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetMap');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '200');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it('sets CRS to match the projection', function () {
      const source = new ImageWMS(options);
      const image1 = source.getImage(
        extent,
        resolution,
        pixelRatio,
        projection,
      );
      image1.load();
      const uri1 = new URL(image1.getImage().src);
      const queryData1 = uri1.searchParams;
      assert.strictEqual(queryData1.get('BBOX'), '20,10,40,30');
      assert.strictEqual(queryData1.get('CRS'), 'EPSG:4326');

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
      assert.strictEqual(queryData2.get('BBOX'), '10,20,30,40');
      assert.strictEqual(queryData2.get('CRS'), 'EPSG:3857');

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
      assert.strictEqual(queryData3.get('BBOX'), '10,20,30,40');
      assert.strictEqual(queryData3.get('CRS'), 'EPSG:900913');
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function () {
      options.params.VERSION = '1.2';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('CRS'), null);
      assert.strictEqual(queryData.get('SRS'), 'EPSG:4326');
    });

    it('allows various parameters to be overridden', function () {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT'), 'image/jpeg');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'false');
    });

    it('valid TRANSPARENT default value', function () {
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
    });

    it('valid TRANSPARENT override value', function () {
      options.params.TRANSPARENT = 'FALSE';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('TRANSPARENT'), 'FALSE');
    });

    it('does not add a STYLES= option if one is specified', function () {
      options.params.STYLES = 'foo';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('STYLES'), 'foo');
    });

    it('changes the BBOX order for EN axis orientations', function () {
      const source = new ImageWMS(options);
      projection = getProjection('CRS:84');
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '10,20,30,40');
    });

    it('uses EN BBOX order if version < 1.3', function () {
      options.params.VERSION = '1.1.0';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '10,20,30,40');
    });

    it('sets MAP_RESOLUTION when the server is MapServer', function () {
      options.serverType = 'mapserver';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('MAP_RESOLUTION'), '180');
    });

    it('sets FORMAT_OPTIONS when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT_OPTIONS'), 'dpi:180');
    });

    it('extends FORMAT_OPTIONS if it is already present', function () {
      options.serverType = 'geoserver';
      options.params.FORMAT_OPTIONS = 'param1:value1';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(
        queryData.get('FORMAT_OPTIONS'),
        'param1:value1;dpi:180',
      );
    });

    it('rounds FORMAT_OPTIONS to an integer when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      pixelRatio = 1.325;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT_OPTIONS'), 'dpi:119');
    });

    it('sets DPI when the server is QGIS', function () {
      options.serverType = 'qgis';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('DPI'), '180');
    });

    it('creates an image with a custom imageLoadFunction', function () {
      const imageLoadFunction = vi.fn();
      options.imageLoadFunction = imageLoadFunction;
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      assert.isAbove(imageLoadFunction.mock.calls.length, 0);
      assert.deepEqual(imageLoadFunction.mock.calls[0][0], image);
      assert.strictEqual(
        imageLoadFunction.mock.calls[0][1],
        window.location.origin +
          '/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=TRUE&LAYERS=layer&WIDTH=200&HEIGHT=200&CRS=EPSG%3A4326&BBOX=20%2C10%2C40%2C30',
      );
    });

    it('returns same image for consecutive calls with same args', function () {
      const extent = [10.01, 20, 30.01, 40];
      const source = new ImageWMS(options);
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
        const source = new ImageWMS(options);
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
      const source = new ImageWMS(options);
      const extent = [10, 5, 30, 45];
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const size = [
        Number(uri.searchParams.get('WIDTH')),
        Number(uri.searchParams.get('HEIGHT')),
      ];
      assert.deepEqual(size, [300, 600]);
    });
  });

  describe('#getFeatureInfoUrl', function () {
    it('returns the expected GetFeatureInfo URL', function () {
      const source = new ImageWMS(options);
      const url = source.getFeatureInfoUrl([20, 30], resolution, projection, {
        INFO_FORMAT: 'text/plain',
      });
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '24.95,14.95,35.05,25.05');
      assert.strictEqual(queryData.get('CRS'), 'EPSG:4326');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '101');
      assert.strictEqual(queryData.get('I'), '50');
      assert.strictEqual(queryData.get('J'), '50');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('QUERY_LAYERS'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetFeatureInfo');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '101');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it("returns the expected GetFeatureInfo URL when source's projection is different from the parameter", function () {
      const source = new ImageWMS(optionsReproj);
      const url = source.getFeatureInfoUrl([20, 30], resolution, projection, {
        INFO_FORMAT: 'text/plain',
      });
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(
        queryData.get('BBOX'),
        '1577259.402312431,2854419.4299513334,2875520.229418512,4152680.2570574144',
      );
      assert.strictEqual(queryData.get('CRS'), 'EPSG:3857');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '101');
      assert.strictEqual(queryData.get('I'), '50');
      assert.strictEqual(queryData.get('J'), '50');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('QUERY_LAYERS'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetFeatureInfo');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '101');
      assert.isEmpty(uri.hash.replace('#', ''));
    });

    it('sets the QUERY_LAYERS param as expected', function () {
      const source = new ImageWMS(options);
      const url = source.getFeatureInfoUrl([20, 30], resolution, projection, {
        INFO_FORMAT: 'text/plain',
        QUERY_LAYERS: 'foo,bar',
      });
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('BBOX'), '24.95,14.95,35.05,25.05');
      assert.strictEqual(queryData.get('CRS'), 'EPSG:4326');
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('HEIGHT'), '101');
      assert.strictEqual(queryData.get('I'), '50');
      assert.strictEqual(queryData.get('J'), '50');
      assert.strictEqual(queryData.get('LAYERS'), 'layer');
      assert.strictEqual(queryData.get('QUERY_LAYERS'), 'foo,bar');
      assert.strictEqual(queryData.get('REQUEST'), 'GetFeatureInfo');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('SRS'), null);
      assert.strictEqual(queryData.get('STYLES'), '');
      assert.strictEqual(queryData.get('TRANSPARENT'), 'TRUE');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('WIDTH'), '101');
      assert.isEmpty(uri.hash.replace('#', ''));
    });
  });

  describe('#getLegendUrl', function () {
    it('returns the GetLegendGraphic url as expected', function () {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl(resolution);
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT'), 'image/png');
      assert.strictEqual(queryData.get('LAYER'), 'layer');
      assert.strictEqual(queryData.get('REQUEST'), 'GetLegendGraphic');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('SCALE'), '357.14285714285717');
    });

    it('does not include SCALE if no resolution was provided', function () {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl();
      const uri = new URL(url);
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('SCALE'), null);
    });

    it('adds additional params as expected', function () {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl(resolution, {
        STYLE: 'STYLE_VALUE',
        FEATURETYPE: 'FEATURETYPE_VALUE',
        RULE: 'RULE_VALUE',
        SLD: 'SLD_VALUE',
        SLD_BODY: 'SLD_BODY_VALUE',
        FORMAT: 'FORMAT_VALUE',
        WIDTH: 'WIDTH_VALUE',
        HEIGHT: 'HEIGHT_VALUE',
        EXCEPTIONS: 'EXCEPTIONS_VALUE',
        LANGUAGE: 'LANGUAGE_VALUE',
        LAYER: 'LAYER_VALUE',
      });
      const uri = new URL(url);
      assert.strictEqual(uri.protocol, 'http:');
      assert.strictEqual(uri.hostname, window.location.hostname);
      assert.strictEqual(uri.pathname, '/wms');
      const queryData = uri.searchParams;
      assert.strictEqual(queryData.get('FORMAT'), 'FORMAT_VALUE');
      assert.strictEqual(queryData.get('LAYER'), 'LAYER_VALUE');
      assert.strictEqual(queryData.get('REQUEST'), 'GetLegendGraphic');
      assert.strictEqual(queryData.get('SERVICE'), 'WMS');
      assert.strictEqual(queryData.get('VERSION'), '1.3.0');
      assert.strictEqual(queryData.get('SCALE'), '357.14285714285717');
      assert.strictEqual(queryData.get('STYLE'), 'STYLE_VALUE');
      assert.strictEqual(queryData.get('FEATURETYPE'), 'FEATURETYPE_VALUE');
      assert.strictEqual(queryData.get('RULE'), 'RULE_VALUE');
      assert.strictEqual(queryData.get('SLD'), 'SLD_VALUE');
      assert.strictEqual(queryData.get('SLD_BODY'), 'SLD_BODY_VALUE');
      assert.strictEqual(queryData.get('FORMAT'), 'FORMAT_VALUE');
      assert.strictEqual(queryData.get('WIDTH'), 'WIDTH_VALUE');
      assert.strictEqual(queryData.get('HEIGHT'), 'HEIGHT_VALUE');
      assert.strictEqual(queryData.get('EXCEPTIONS'), 'EXCEPTIONS_VALUE');
      assert.strictEqual(queryData.get('LANGUAGE'), 'LANGUAGE_VALUE');
    });
  });

  describe('#refresh()', function () {
    let map, source;
    let callCount = 0;
    beforeEach(
      () =>
        new Promise((resolve) => {
          source = new ImageWMS(options);
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
        params: {
          LAYERS: 'layer',
        },
        ratio: 1,
        url: new URL('/wms', window.location.href).toString(),
        projection: 'EPSG:4326',
      };
      source = new ImageWMS(options);
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
            queryData[0].get('BBOX'),
            '-85.078125,181,85.078125,541',
          );
          assert.strictEqual(queryData[0].get('WIDTH'), '256');
          assert.strictEqual(queryData[0].get('HEIGHT'), '121');
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
