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
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new ImageArcGISRest(
        Object.assign({interpolate: false}, options),
      );
      expect(source.getInterpolate()).to.be(false);
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
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/MapServer/export');

      const queryData = uri.searchParams;
      expect(queryData.get('SIZE')).to.be('150,16');
      expect(queryData.get('BBOX')).to.be('-9.5,0.7,5.5,2.3');
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');
    });

    it('returns a non floating point DPI value', function () {
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
      expect(queryData.get('DPI')).to.be('91');
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
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be(window.location.hostname);
      expect(uri.pathname).to.be('/ImageServer/exportImage');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('-9.5,0.7,5.5,2.3');
      expect(queryData.get('FORMAT')).to.be('PNG32');
      expect(queryData.get('IMAGESR')).to.be('3857');
      expect(queryData.get('BBOXSR')).to.be('3857');
      expect(queryData.get('TRANSPARENT')).to.be('true');
    });

    it('allows various parameters to be overridden', function () {
      options.params.FORMAT = 'png';
      options.params.TRANSPARENT = false;
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
      expect(queryData.get('FORMAT')).to.be('png');
      expect(queryData.get('TRANSPARENT')).to.be('false');
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
      expect(queryData.get('LAYERS')).to.be('show:1,3,4');
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
      expect(queryData.get('TEST')).to.be('value');
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
      expect(queryData.get('TEST')).to.be('newValue');
    });

    it('reloads from server', function (done) {
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
          expect(srcs.length).to.be(2);
          expect(new URL(srcs[0]).searchParams.get('TEST')).to.be('value');
          expect(new URL(srcs[1]).searchParams.get('TEST')).to.be('newValue');
          done();
        });
      });
    });
  });

  describe('#setParams', function () {
    it('allows params to be set', function () {
      const before = {test: 'before', foo: 'bar'};
      const source = new ImageArcGISRest({params: before});
      source.setParams({test: 'after'});

      const params = source.getParams();
      expect(params).to.eql({test: 'after'});

      expect(before).to.eql({test: 'before', foo: 'bar'});
    });
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);
      const setParams = source.getParams();
      expect(setParams).to.eql({TEST: 'value'});
    });

    it('verify on adding a param', function () {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST2': 'newValue'});
      const setParams = source.getParams();
      expect(setParams).to.eql({TEST: 'value', TEST2: 'newValue'});
      expect(options.params).to.eql({TEST: 'value'});
    });

    it('verify on update a param', function () {
      options.params.TEST = 'value';
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});
      const setParams = source.getParams();
      expect(setParams).to.eql({TEST: 'newValue'});
      expect(options.params).to.eql({TEST: 'value'});
    });
  });

  describe('#getUrl', function () {
    it('verify getting url', function () {
      options.url = 'http://test.com/MapServer';

      const source = new ImageArcGISRest(options);

      const url = source.getUrl();

      expect(url).to.eql('http://test.com/MapServer');
    });
  });

  describe('#setUrl', function () {
    it('verify setting url when not set yet', function () {
      const source = new ImageArcGISRest(options);
      source.setUrl('http://test.com/MapServer');

      const url = source.getUrl();

      expect(url).to.eql('http://test.com/MapServer');
    });

    it('verify setting url with existing url', function () {
      options.url = 'http://test.com/MapServer';

      const source = new ImageArcGISRest(options);
      source.setUrl('http://test2.com/MapServer');

      const url = source.getUrl();

      expect(url).to.eql('http://test2.com/MapServer');
    });
  });
});
