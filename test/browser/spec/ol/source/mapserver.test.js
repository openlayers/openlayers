import {assert} from 'chai';
import ImageSource from '../../../../../src/ol/source/Image.js';
import {createLoader} from '../../../../../src/ol/source/mapserver.js';

describe('ol/source/mapserver', function () {
  it('uses params', function (done) {
    async function load(img, src) {
      return new Promise((resolve, reject) => {
        const params = new URL(src).searchParams;
        assert.strictEqual(params.get('layers'), 'boundaries water');
        assert.strictEqual(params.get('mode'), 'map');
        assert.strictEqual(params.get('map_imagetype'), 'png');
        assert.strictEqual(params.get('mapext'), '1 2 3 4');
        assert.strictEqual(params.get('imgext'), '1 2 3 4');
        assert.strictEqual(params.get('map_size'), '2 2');
        assert.strictEqual(params.get('imgx'), '1');
        assert.strictEqual(params.get('imgy'), '1');
        assert.strictEqual(params.get('imgxy'), '2 2');
        done();
      });
    }

    const options = {
      url: new URL('/mapserv?', window.location.href).toString(),
      load: load,
      params: {
        'layers': 'boundaries water',
      },
    };

    const source = new ImageSource({
      loader: createLoader(options),
    });

    const image = source.getImage([1, 2, 3, 4], 1, 1);
    image.load();
  });
});
