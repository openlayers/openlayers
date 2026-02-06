import ImageSource from '../../../../../src/ol/source/Image.js';
import {createLoader} from '../../../../../src/ol/source/mapserver.js';

describe('ol/source/mapserver', function () {
  it('uses params', function (done) {
    async function load(img, src) {
      return new Promise((resolve, reject) => {
        const params = new URL(src).searchParams;
        expect(params.get('layers')).to.be('boundaries water');
        expect(params.get('mode')).to.be('map');
        expect(params.get('map_imagetype')).to.be('png');
        expect(params.get('mapext')).to.be('1 2 3 4');
        expect(params.get('imgext')).to.be('1 2 3 4');
        expect(params.get('map_size')).to.be('2 2');
        expect(params.get('imgx')).to.be('1');
        expect(params.get('imgy')).to.be('1');
        expect(params.get('imgxy')).to.be('2 2');
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
