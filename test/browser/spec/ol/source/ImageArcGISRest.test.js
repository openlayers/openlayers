import ImageArcGISRest from '../../../../../src/ol/source/ImageArcGISRest.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

describe('ol/source/ImageArcGISRest', function () {
  let pixelRatio, options, projection, proj3857, resolution;
  beforeEach(function () {
    pixelRatio = 1;
    projection = getProjection('EPSG:4326');
    proj3857 = getProjection('EPSG:3857');
    resolution = 0.1;
    options = {
      params: {},
      url: 'http://example.com/MapServer',
    };
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new ImageArcGISRest(options);
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new ImageArcGISRest(
        Object.assign({interpolate: false}, options)
      );
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('#getImage', function () {
    it('returns a image with the expected URL', function () {
      const source = new ImageArcGISRest(options);
      const image = source.getImage(
        [3, 2, -7, 1],
        resolution,
        pixelRatio,
        proj3857
      );
      const uri = new URL(image.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/MapServer/export');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('5.5,2.25,-9.5,0.75');
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
        proj3857
      );
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('DPI')).to.be('91');
    });

    it('returns a image with the expected URL for ImageServer', function () {
      options.url = 'http://example.com/ImageServer';
      const source = new ImageArcGISRest(options);
      const image = source.getImage(
        [3, 2, -7, 1],
        resolution,
        pixelRatio,
        proj3857
      );
      const uri = new URL(image.src_);
      expect(uri.protocol).to.be('http:');
      expect(uri.hostname).to.be('example.com');
      expect(uri.pathname).to.be('/ImageServer/exportImage');
      const queryData = uri.searchParams;
      expect(queryData.get('BBOX')).to.be('5.5,2.25,-9.5,0.75');
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
        projection
      );
      const uri = new URL(image.src_);
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
        proj3857
      );
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('LAYERS')).to.be('show:1,3,4');
    });
  });

  describe('#updateParams', function () {
    it('add a new param', function () {
      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'value'});

      const image = source.getImage(
        [3, 2, -7, 1],
        resolution,
        pixelRatio,
        proj3857
      );
      const uri = new URL(image.src_);
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
        proj3857
      );
      const uri = new URL(image.src_);
      const queryData = uri.searchParams;
      expect(queryData.get('TEST')).to.be('newValue');
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
    });

    it('verify on update a param', function () {
      options.params.TEST = 'value';

      const source = new ImageArcGISRest(options);
      source.updateParams({'TEST': 'newValue'});

      const setParams = source.getParams();

      expect(setParams).to.eql({TEST: 'newValue'});
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
