import ImageState from '../../../../../src/ol/ImageState.js';
import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import ImageSource from '../../../../../src/ol/source/Image.js';
import {createLoader} from '../../../../../src/ol/source/mapserver.js';

describe('ol/source/ImageMapServer', function () {
  let options;
  beforeEach(function () {
    options = {
      params: {
        'layers': 'boundaries water',
      },
      url: new URL('/mapserv?', window.location.href).toString(),
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
      disposeMap(map);
    });

    it('reloads from server', function (done) {
      const srcs = [];
      const source = new ImageSource({
        loader: createLoader(options),
      });

      source.setImageLoadFunction(function (image, src) {
        srcs.push(src);
        image.state = ImageState.LOADED;
        source.loading = false;
      });
      map.addLayer(new ImageLayer({source: source}));
      map.once('rendercomplete', function () {
        source.updateParams({'layers': 'roads other cities'});
        map.once('rendercomplete', function () {
          expect(srcs.length).to.be(2);
          expect(new URL(srcs[0]).searchParams.get('layers')).to.be(
            'boundaries water',
          );
          expect(new URL(srcs[1]).searchParams.get('layers')).to.be(
            'roads other cities',
          );
          done();
        });
      });
    });
  });

  describe('#getParams', function () {
    it('verify getting a param', function () {
      const source = new ImageSource({
        loader: createLoader(options),
      });
      const setParams = source.getParams();
      expect(setParams).to.eql({layers: 'boundaries water'});
    });

    it('verify on adding a param', function () {
      const source = new ImageSource({
        loader: createLoader(options),
      });
      source.updateParams({'TEST': 'value'});
      const setParams = source.getParams();
      expect(setParams).to.eql({layers: 'boundaries water', TEST: 'value'});
      expect(options.params).to.eql({layers: 'boundaries water'});
    });

    it('verify on update a param', function () {
      const source = new ImageSource({
        loader: createLoader(options),
      });
      source.updateParams({'layers': 'newValue'});
      const setParams = source.getParams();
      expect(setParams).to.eql({layers: 'newValue'});
      expect(options.params).to.eql({layers: 'boundaries water'});
    });
  });
});
