import ImageLayer from '../../../../../src/ol/layer/Image.js';
import ImageMapGuide from '../../../../../src/ol/source/ImageMapGuide.js';
import ImageState from '../../../../../src/ol/ImageState.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';

describe('ol/source/ImageMapGuide', function () {
  let options;
  beforeEach(function () {
    options = {
      params: {
        'MAPDEFINITION': 'mdf',
      },
      url: new URL('/mapagent.fcgi?', window.location.href).toString(),
    };
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
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('reloads from server', function (done) {
      const srcs = [];
      const source = new ImageMapGuide(options);
      source.setImageLoadFunction(function (image, src) {
        srcs.push(src);
        image.state = ImageState.LOADED;
        source.loading = false;
      });
      map.addLayer(new ImageLayer({source: source}));
      map.once('rendercomplete', function () {
        source.updateParams({'MAPDEFINITION': 'newValue'});
        map.once('rendercomplete', function () {
          expect(srcs.length).to.be(2);
          expect(new URL(srcs[0]).searchParams.get('MAPDEFINITION')).to.be(
            'mdf',
          );
          expect(new URL(srcs[1]).searchParams.get('MAPDEFINITION')).to.be(
            'newValue',
          );
          done();
        });
      });
    });
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      const source = new ImageMapGuide(options);
      const setParams = source.getParams();
      expect(setParams).to.eql({MAPDEFINITION: 'mdf'});
    });

    it('verify on adding a param', function () {
      const source = new ImageMapGuide(options);
      source.updateParams({'TEST': 'value'});
      const setParams = source.getParams();
      expect(setParams).to.eql({MAPDEFINITION: 'mdf', TEST: 'value'});
      expect(options.params).to.eql({MAPDEFINITION: 'mdf'});
    });

    it('verify on update a param', function () {
      const source = new ImageMapGuide(options);
      source.updateParams({'MAPDEFINITION': 'newValue'});
      const setParams = source.getParams();
      expect(setParams).to.eql({MAPDEFINITION: 'newValue'});
      expect(options.params).to.eql({MAPDEFINITION: 'mdf'});
    });
  });
});
