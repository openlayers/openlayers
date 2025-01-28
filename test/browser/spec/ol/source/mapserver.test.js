import Map from '../../../../../src/ol/Map.js';
import View from '../../../../../src/ol/View.js';
import ImageLayer from '../../../../../src/ol/layer/Image.js';
import ImageSource from '../../../../../src/ol/source/Image.js';
import {createLoader} from '../../../../../src/ol/source/mapserver.js';

describe('ol/source/mapserver', function () {
  let options;
  beforeEach(function () {
    options = {
      params: {
        'layers': 'boundaries water',
      },
      url: new URL('/mapserv?', window.location.href).toString(),
    };
  });

  describe('#createSource', function () {
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

    it('uses params', function (done) {
      async function load(img, src) {
        return new Promise((resolve, reject) => {
          //const image = new Image();
          expect(new URL(src).searchParams.get('layers')).to.be(
            'boundaries water',
          );
          done();
        });
      }

      options.load = load;

      const source = new ImageSource({
        loader: createLoader(options),
      });

      map.addLayer(new ImageLayer({source: source}));
    });
  });
});
