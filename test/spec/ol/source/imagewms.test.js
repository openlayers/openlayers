import ImageWMS from '../../../../src/ol/source/ImageWMS.js';
import Image from '../../../../src/ol/layer/Image.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import {getWidth, getHeight} from '../../../../src/ol/extent.js';
import View from '../../../../src/ol/View.js';
import Map from '../../../../src/ol/Map.js';
import ImageState from '../../../../src/ol/ImageState.js';


describe('ol.source.ImageWMS', () => {

  let extent, pixelRatio, options, optionsReproj, projection, resolution;
  beforeEach(() => {
    extent = [10, 20, 30, 40];
    pixelRatio = 1;
    projection = getProjection('EPSG:4326');
    resolution = 0.1;
    options = {
      params: {
        'LAYERS': 'layer'
      },
      ratio: 1,
      url: 'http://example.com/wms'
    };
    optionsReproj = {
      params: {
        'LAYERS': 'layer'
      },
      ratio: 1,
      url: 'http://example.com/wms',
      projection: 'EPSG:3857'
    };
  });

  describe('#getImage', () => {

    test('returns the expected image URL', () => {
      [1, 1.5].forEach(function(ratio) {
        options.ratio = ratio;
        const source = new ImageWMS(options);
        const viewExtent = [10, 20, 30.1, 39.9];
        const viewWidth = getWidth(viewExtent);
        const viewHeight = getHeight(viewExtent);
        const image = source.getImage(viewExtent, resolution, pixelRatio, projection);
        const uri = new URL(image.src_);
        const queryData = uri.searchParams;
        const imageWidth = Number(queryData.get('WIDTH'));
        const imageHeight = Number(queryData.get('HEIGHT'));
        const bbox = queryData.get('BBOX').split(',').map(Number);
        const bboxAspectRatio = (bbox[3] - bbox[1]) / (bbox[2] - bbox[0]);
        const imageAspectRatio = imageWidth / imageHeight;
        expect (imageWidth).toBe(Math.ceil(viewWidth / resolution * ratio));
        expect (imageHeight).toBe(Math.ceil(viewHeight / resolution * ratio));
        expect(bboxAspectRatio).to.roughlyEqual(imageAspectRatio, 1e-12);
      });
    });

    test('uses correct WIDTH and HEIGHT for HiDPI devices', () => {
      pixelRatio = 2;
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      const width = Number(queryData.get('WIDTH'));
      const height = Number(queryData.get('HEIGHT'));
      expect(width).toBe(400);
      expect(height).toBe(400);
    });

    test('requests integer WIDTH and HEIGHT', () => {
      options.ratio = 1.5;
      const source = new ImageWMS(options);
      const image = source.getImage([10, 20, 30.1, 39.9], resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      const width = parseFloat(queryData.get('WIDTH'));
      const height = parseFloat(queryData.get('HEIGHT'));
      expect(width).toBe(Math.round(width));
      expect(height).toBe(Math.round(height));
    });

    test('sets WIDTH and HEIGHT to match the aspect ratio of BBOX', () => {
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('20,10,40,30');
      expect(queryData.get('CRS')).toBe('EPSG:4326');
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('HEIGHT')).toBe('200');
      expect(queryData.get('LAYERS')).toBe('layer');
      expect(queryData.get('REQUEST')).toBe('GetMap');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('SRS')).toBe(null);
      expect(queryData.get('STYLES')).toBe('');
      expect(queryData.get('TRANSPARENT')).toBe('true');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('WIDTH')).toBe('200');
      expect(uri.hash.replace('#', '')).toHaveLength(0);
    });

    test('sets the SRS query value instead of CRS if version < 1.3', () => {
      options.params.VERSION = '1.2';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('CRS')).toBe(null);
      expect(queryData.get('SRS')).toBe('EPSG:4326');
    });

    test('allows various parameters to be overridden', () => {
      options.params.FORMAT = 'image/jpeg';
      options.params.TRANSPARENT = false;
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('image/jpeg');
      expect(queryData.get('TRANSPARENT')).toBe('false');
    });

    test('does not add a STYLES= option if one is specified', () => {
      options.params.STYLES = 'foo';
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('STYLES')).toBe('foo');
    });

    test('changes the BBOX order for EN axis orientations', () => {
      const source = new ImageWMS(options);
      projection = getProjection('CRS:84');
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('10,20,30,40');
    });

    test('uses EN BBOX order if version < 1.3', () => {
      options.params.VERSION = '1.1.0';
      const source = new ImageWMS(options);
      const image =
          source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('10,20,30,40');
    });

    test('sets MAP_RESOLUTION when the server is MapServer', () => {
      options.serverType = 'mapserver';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('MAP_RESOLUTION')).toBe('180');
    });

    test('sets FORMAT_OPTIONS when the server is GeoServer', () => {
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).toBe('dpi:180');
    });

    test('extends FORMAT_OPTIONS if it is already present', () => {
      options.serverType = 'geoserver';
      const source = new ImageWMS(options);
      options.params.FORMAT_OPTIONS = 'param1:value1';
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT_OPTIONS')).toBe('param1:value1;dpi:180');
    });

    test(
      'rounds FORMAT_OPTIONS to an integer when the server is GeoServer',
      () => {
        options.serverType = 'geoserver';
        const source = new ImageWMS(options);
        pixelRatio = 1.325;
        const image =
            source.getImage(extent, resolution, pixelRatio, projection);
        const uri = new URL(image.src_);
        const queryData = uri.searchParams;
        expect(queryData.get('FORMAT_OPTIONS')).toBe('dpi:119');
      }
    );

    test('sets DPI when the server is QGIS', () => {
      options.serverType = 'qgis';
      const source = new ImageWMS(options);
      pixelRatio = 2;
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).toBe('180');
    });

    test('creates an image with a custom imageLoadFunction', () => {
      const imageLoadFunction = sinon.spy();
      options.imageLoadFunction = imageLoadFunction;
      const source = new ImageWMS(options);
      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
      expect(imageLoadFunction).to.be.called();
      expect(imageLoadFunction.calledWith(image, image.src_)).toBe(true);
    });

    test('returns same image for consecutive calls with same args', () => {
      const extent = [10.01, 20, 30.01, 40];
      const source = new ImageWMS(options);
      const image1 = source.getImage(extent, resolution, pixelRatio, projection);
      const image2 = source.getImage(extent, resolution, pixelRatio, projection);
      expect(image1).toBe(image2);
    });

    test('returns same image for calls with similar extents', () => {
      options.ratio = 1.5;
      const source = new ImageWMS(options);
      let extent = [10.01, 20, 30.01, 40];
      const image1 = source.getImage(extent, resolution, pixelRatio, projection);
      extent = [10.01, 20.1, 30.01, 40.1];
      const image2 = source.getImage(extent, resolution, pixelRatio, projection);
      expect(image1).toBe(image2);
    });

    test('calculates correct image size with ratio', () => {
      options.ratio = 1.5;
      const source = new ImageWMS(options);
      const extent = [10, 5, 30, 45];
      source.getImage(extent, resolution, pixelRatio, projection);
      expect(source.imageSize_).toEqual([300, 600]);
    });

  });

  describe('#getFeatureInfoUrl', () => {

    test('returns the expected GetFeatureInfo URL', () => {
      const source = new ImageWMS(options);
      const url = source.getFeatureInfoUrl(
        [20, 30], resolution, projection,
        {INFO_FORMAT: 'text/plain'});
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('24.95,14.95,35.05,25.05');
      expect(queryData.get('CRS')).toBe('EPSG:4326');
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('HEIGHT')).toBe('101');
      expect(queryData.get('I')).toBe('50');
      expect(queryData.get('J')).toBe('50');
      expect(queryData.get('LAYERS')).toBe('layer');
      expect(queryData.get('QUERY_LAYERS')).toBe('layer');
      expect(queryData.get('REQUEST')).toBe('GetFeatureInfo');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('SRS')).toBe(null);
      expect(queryData.get('STYLES')).toBe('');
      expect(queryData.get('TRANSPARENT')).toBe('true');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('WIDTH')).toBe('101');
      expect(uri.hash.replace('#', '')).toHaveLength(0);
    });

    test(
      'returns the expected GetFeatureInfo URL when source\'s projection is different from the parameter',
      () => {
        const source = new ImageWMS(optionsReproj);
        const url = source.getFeatureInfoUrl(
          [20, 30], resolution, projection,
          {INFO_FORMAT: 'text/plain'});
        const uri = new URL(url);
        expect(uri.protocol).toBe('http:');
        expect(uri.hostname).toBe('example.com');
        expect(uri.pathname).toBe('/wms');
        const queryData = uri.searchParams;
        expect(queryData.get('BBOX')).toBe(
          '1577259.402312431,2854419.4299513334,2875520.229418512,4152680.2570574144'
        );
        expect(queryData.get('CRS')).toBe('EPSG:3857');
        expect(queryData.get('FORMAT')).toBe('image/png');
        expect(queryData.get('HEIGHT')).toBe('101');
        expect(queryData.get('I')).toBe('50');
        expect(queryData.get('J')).toBe('50');
        expect(queryData.get('LAYERS')).toBe('layer');
        expect(queryData.get('QUERY_LAYERS')).toBe('layer');
        expect(queryData.get('REQUEST')).toBe('GetFeatureInfo');
        expect(queryData.get('SERVICE')).toBe('WMS');
        expect(queryData.get('SRS')).toBe(null);
        expect(queryData.get('STYLES')).toBe('');
        expect(queryData.get('TRANSPARENT')).toBe('true');
        expect(queryData.get('VERSION')).toBe('1.3.0');
        expect(queryData.get('WIDTH')).toBe('101');
        expect(uri.hash.replace('#', '')).toHaveLength(0);
      }
    );

    test('sets the QUERY_LAYERS param as expected', () => {
      const source = new ImageWMS(options);
      const url = source.getFeatureInfoUrl(
        [20, 30], resolution, projection,
        {INFO_FORMAT: 'text/plain', QUERY_LAYERS: 'foo,bar'});
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).toBe('24.95,14.95,35.05,25.05');
      expect(queryData.get('CRS')).toBe('EPSG:4326');
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('HEIGHT')).toBe('101');
      expect(queryData.get('I')).toBe('50');
      expect(queryData.get('J')).toBe('50');
      expect(queryData.get('LAYERS')).toBe('layer');
      expect(queryData.get('QUERY_LAYERS')).toBe('foo,bar');
      expect(queryData.get('REQUEST')).toBe('GetFeatureInfo');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('SRS')).toBe(null);
      expect(queryData.get('STYLES')).toBe('');
      expect(queryData.get('TRANSPARENT')).toBe('true');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('WIDTH')).toBe('101');
      expect(uri.hash.replace('#', '')).toHaveLength(0);
    });
  });

  describe('#getLegendUrl', () => {

    test('returns the GetLegendGraphic url as expected', () => {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl(resolution);
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('image/png');
      expect(queryData.get('LAYER')).toBe('layer');
      expect(queryData.get('REQUEST')).toBe('GetLegendGraphic');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('SCALE')).toBe('357.14214285714274');
    });

    test('does not include SCALE if no resolution was provided', () => {
      const source = new ImageWMS(options);
      const url = source.getLegendUrl();
      const uri = new URL(url);
      const queryData = uri.searchParams;
      expect(queryData.get('SCALE')).toBe(null);
    });

    test('adds additional params as expected', () => {
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
        LAYER: 'LAYER_VALUE'
      });
      const uri = new URL(url);
      expect(uri.protocol).toBe('http:');
      expect(uri.hostname).toBe('example.com');
      expect(uri.pathname).toBe('/wms');
      const queryData = uri.searchParams;
      expect(queryData.get('FORMAT')).toBe('FORMAT_VALUE');
      expect(queryData.get('LAYER')).toBe('LAYER_VALUE');
      expect(queryData.get('REQUEST')).toBe('GetLegendGraphic');
      expect(queryData.get('SERVICE')).toBe('WMS');
      expect(queryData.get('VERSION')).toBe('1.3.0');
      expect(queryData.get('SCALE')).toBe('357.14214285714274');
      expect(queryData.get('STYLE')).toBe('STYLE_VALUE');
      expect(queryData.get('FEATURETYPE')).toBe('FEATURETYPE_VALUE');
      expect(queryData.get('RULE')).toBe('RULE_VALUE');
      expect(queryData.get('SLD')).toBe('SLD_VALUE');
      expect(queryData.get('SLD_BODY')).toBe('SLD_BODY_VALUE');
      expect(queryData.get('FORMAT')).toBe('FORMAT_VALUE');
      expect(queryData.get('WIDTH')).toBe('WIDTH_VALUE');
      expect(queryData.get('HEIGHT')).toBe('HEIGHT_VALUE');
      expect(queryData.get('EXCEPTIONS')).toBe('EXCEPTIONS_VALUE');
      expect(queryData.get('LANGUAGE')).toBe('LANGUAGE_VALUE');
    });

  });

  describe('#refresh()', () => {

    let map, source;
    let callCount = 0;
    beforeEach(done => {
      source = new ImageWMS(options);
      source.setImageLoadFunction(function(image) {
        ++callCount;
        image.state = ImageState.LOADED;
        source.loading = false;
      });
      const target = document.createElement('div');
      target.style.width = target.style.height = '100px';
      document.body.appendChild(target);
      map = new Map({
        target: target,
        layers: [
          new Image({
            source: source
          })
        ],
        view: new View({
          center: [0, 0],
          zoom: 0
        })
      });
      map.once('rendercomplete', function() {
        callCount = 0;
        done();
      });
    });

    afterEach(() => {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    test('reloads from server', done => {
      map.once('rendercomplete', function() {
        expect(callCount).toBe(1);
        done();
      });
      source.refresh();
    });

  });

});
