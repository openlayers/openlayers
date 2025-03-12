import {spy as sinonSpy} from 'sinon';
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
      expect(setParams).to.eql({'LAYERS': 'layer'});
    });

    it('verify on adding a param', function () {
      const source = new ImageWMS(options);
      source.updateParams({'TEST': 'value'});
      const setParams = source.getParams();
      expect(setParams).to.eql({'LAYERS': 'layer', TEST: 'value'});
      expect(options.params).to.eql({'LAYERS': 'layer'});
    });

    it('verify on update a param', function () {
      const source = new ImageWMS(options);
      source.updateParams({'LAYERS': 'newLayer'});
      const setParams = source.getParams();
      expect(setParams).to.eql({'LAYERS': 'newLayer'});
      expect(options.params).to.eql({'LAYERS': 'layer'});
    });
  });

  describe('#setParams', function () {
    it('sets new parameters', function () {
      const before = {test: 'before', foo: 'bar'};
      const source = new ImageWMS({params: before});
      source.setParams({test: 'after'});

      const params = source.getParams();
      expect(params).to.eql({test: 'after'});

      expect(before).to.eql({test: 'before', foo: 'bar'});
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

        expect(imageWidth).to.be(
          Math.round(viewWidth / resolution) + 2 * marginWidth,
        );
        expect(imageHeight).to.be(
          Math.round(viewHeight / resolution) + 2 * marginHeight,
        );
        expect(bboxAspectRatio).to.roughlyEqual(imageAspectRatio, 1e-12);
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
      expect(width).to.be(400);
      expect(height).to.be(400);
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
      expect(width).to.be(Math.round(width));
      expect(height).to.be(Math.round(height));
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
      expect(imageWidth).to.be(mapSize[0]);
      expect(imageHeight).to.be(mapSize[1]);
    });

    it('sets WIDTH and HEIGHT to match the aspect ratio of BBOX', function () {
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('20,10,40,30');
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('200');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetMap');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('TRUE');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('200');
      expect(uri.hash.replace('#', '')).to.be.empty();
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
      expect(queryData1.get('BBOX')).to.be('20,10,40,30');
      expect(queryData1.get('CRS')).to.be('EPSG:4326');

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
      expect(queryData2.get('BBOX')).to.be('10,20,30,40');
      expect(queryData2.get('CRS')).to.be('EPSG:3857');

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
      expect(queryData3.get('BBOX')).to.be('10,20,30,40');
      expect(queryData3.get('CRS')).to.be('EPSG:900913');
    });

    it('sets the SRS query value instead of CRS if version < 1.3', function () {
      options.params.VERSION = '1.2';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('CRS')).to.be(null);
      expect(queryData.get('SRS')).to.be('EPSG:4326');
    });

    it('allows various parameters to be overridden', function () {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('image/jpeg');
      expect(queryData.get('TRANSPARENT')).to.be('false');
    });

    it('valid TRANSPARENT default value', function () {
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('TRANSPARENT')).to.be('TRUE');
    });

    it('valid TRANSPARENT override value', function () {
      options.params.TRANSPARENT = 'FALSE';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('TRANSPARENT')).to.be('FALSE');
    });

    it('does not add a STYLES= option if one is specified', function () {
      options.params.STYLES = 'foo';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('STYLES')).to.be('foo');
    });

    it('changes the BBOX order for EN axis orientations', function () {
      const source = new ImageWMS(options);
      projection = getProjection('CRS:84');
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('10,20,30,40');
    });

    it('uses EN BBOX order if version < 1.3', function () {
      options.params.VERSION = '1.1.0';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('10,20,30,40');
    });

    it('sets MAP_RESOLUTION when the server is MapServer', function () {
      options.serverType = 'mapserver';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('MAP_RESOLUTION')).to.be('180');
    });

    it('sets FORMAT_OPTIONS when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:180');
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
      expect(queryData.get('FORMAT_OPTIONS')).to.be('param1:value1;dpi:180');
    });

    it('rounds FORMAT_OPTIONS to an integer when the server is GeoServer', function () {
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      pixelRatio = 1.325;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).to.be('dpi:119');
    });

    it('sets DPI when the server is QGIS', function () {
      options.serverType = 'qgis';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      const uri = new URL(image.getImage().src);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).to.be('180');
    });

    it('creates an image with a custom imageLoadFunction', function () {
      const imageLoadFunction = sinonSpy();
      options.imageLoadFunction = imageLoadFunction;
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      expect(imageLoadFunction.called).to.be(true);
      expect(imageLoadFunction.getCall(0).args[0]).to.eql(image);
      expect(imageLoadFunction.getCall(0).args[1]).to.be(
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
      expect(image1).to.equal(image2);
    });

    it('returns same image for calls with similar extents', function (done) {
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
          expect(image1).to.equal(image2);
          done();
        } catch (e) {
          done(e);
        }
      });
      image1.load();
    });

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
      expect(size).to.eql([300, 600]);
    });
  });

  describe('#getFeatureInfoUrl', function () {
    it('returns the expected GetFeatureInfo URL', function () {
      const source = new ImageWMS(options);
      const url = source.getFeatureInfoUrl([20, 30], resolution, projection, {
        INFO_FORMAT: 'text/plain',
      });
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('24.95,14.95,35.05,25.05');
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('101');
      expect(queryData.get('I')).to.be('50');
      expect(queryData.get('J')).to.be('50');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('TRUE');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('101');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });

    it("returns the expected GetFeatureInfo URL when source's projection is different from the parameter", function () {
      const source = new ImageWMS(optionsReproj);
      const url = source.getFeatureInfoUrl([20, 30], resolution, projection, {
        INFO_FORMAT: 'text/plain',
      });
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be(
        '1577259.402312431,2854419.4299513334,2875520.229418512,4152680.2570574144',
      );
      expect(queryData.get('CRS')).to.be('EPSG:3857');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('101');
      expect(queryData.get('I')).to.be('50');
      expect(queryData.get('J')).to.be('50');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('TRUE');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('101');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });

    it('sets the QUERY_LAYERS param as expected', function () {
      const source = new ImageWMS(options);
      const url = source.getFeatureInfoUrl([20, 30], resolution, projection, {
        INFO_FORMAT: 'text/plain',
        QUERY_LAYERS: 'foo,bar',
      });
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('24.95,14.95,35.05,25.05');
      expect(queryData.get('CRS')).to.be('EPSG:4326');
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('HEIGHT')).to.be('101');
      expect(queryData.get('I')).to.be('50');
      expect(queryData.get('J')).to.be('50');
      expect(queryData.get('LAYERS')).to.be('layer');
      expect(queryData.get('QUERY_LAYERS')).to.be('foo,bar');
      expect(queryData.get('REQUEST')).to.be('GetFeatureInfo');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('SRS')).to.be(null);
      expect(queryData.get('STYLES')).to.be('');
      expect(queryData.get('TRANSPARENT')).to.be('TRUE');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('WIDTH')).to.be('101');
      expect(uri.hash.replace('#', '')).to.be.empty();
    });
  });

  describe('#getLegendUrl', function () {
    it('returns the GetLegendGraphic url as expected', function () {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl(resolution);
      const uri = new URL(url);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('image/png');
      expect(queryData.get('LAYER')).to.be('layer');
      expect(queryData.get('REQUEST')).to.be('GetLegendGraphic');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('SCALE')).to.be('357.14285714285717');
    });

    it('does not include SCALE if no resolution was provided', function () {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl();
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('SCALE')).to.be(null);
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
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).to.be('FORMAT_VALUE');
      expect(queryData.get('LAYER')).to.be('LAYER_VALUE');
      expect(queryData.get('REQUEST')).to.be('GetLegendGraphic');
      expect(queryData.get('SERVICE')).to.be('WMS');
      expect(queryData.get('VERSION')).to.be('1.3.0');
      expect(queryData.get('SCALE')).to.be('357.14285714285717');
      expect(queryData.get('STYLE')).to.be('STYLE_VALUE');
      expect(queryData.get('FEATURETYPE')).to.be('FEATURETYPE_VALUE');
      expect(queryData.get('RULE')).to.be('RULE_VALUE');
      expect(queryData.get('SLD')).to.be('SLD_VALUE');
      expect(queryData.get('SLD_BODY')).to.be('SLD_BODY_VALUE');
      expect(queryData.get('FORMAT')).to.be('FORMAT_VALUE');
      expect(queryData.get('WIDTH')).to.be('WIDTH_VALUE');
      expect(queryData.get('HEIGHT')).to.be('HEIGHT_VALUE');
      expect(queryData.get('EXCEPTIONS')).to.be('EXCEPTIONS_VALUE');
      expect(queryData.get('LANGUAGE')).to.be('LANGUAGE_VALUE');
    });
  });

  describe('#refresh()', function () {
    let map, source;
    let callCount = 0;
    beforeEach(function (done) {
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
        done();
      });
    });

    afterEach(function () {
      disposeMap(map);
    });

    it('reloads from server', function (done) {
      map.once('rendercomplete', function () {
        expect(callCount).to.be(1);
        done();
      });
      source.refresh();
    });
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

    it('loads wrapped extents when both projections are global', function (done) {
      map.once('rendercomplete', function () {
        expect(queryData.length).to.be(1);
        expect(queryData[0].get('BBOX')).to.be('-85.078125,181,85.078125,541');
        expect(queryData[0].get('WIDTH')).to.be('256');
        expect(queryData[0].get('HEIGHT')).to.be('121');
        done();
      });
      map.getView().setCenter(fromLonLat([361, 0]));
    });

    it('does not load outside extent when view projection is not global', function (done) {
      getProjection('EPSG:3857').setGlobal(false);
      map.once('rendercomplete', function () {
        expect(queryData.length).to.be(0);
        done();
      });
      map.getView().setCenter(fromLonLat([361, 0]));
    });

    it('does not load outside extent when source projection is not global', function (done) {
      getProjection('EPSG:4326').setGlobal(false);
      map.once('rendercomplete', function () {
        expect(queryData.length).to.be(0);
        done();
      });
      map.getView().setCenter(fromLonLat([361, 0]));
    });
  });
});
