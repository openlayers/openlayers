import TileState from '../../../../../src/ol/TileState.js';
import ImageTile from '../../../../../src/ol/source/ImageTile.js';
import {pickUrl, renderXYZTemplate} from '../../../../../src/ol/uri.js';

const emptyUrl =
  'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => resolve(new Error('failed to load')));
    image.src = src;
  });
}
/**
 * Using expect.js in an async test function doesn't give reliable stack traces
 * and failures result in a message about the done callback not being called.
 *
 * @param {function(Error):void} reject The test callback.
 * @return {function(boolean, string):void} The assert function.
 */
function getAssert(reject) {
  return function assert(condition, message) {
    if (condition) {
      return;
    }
    reject(new Error(message));
  };
}

describe('ol/source/ImageTile', () => {
  describe('url option', () => {
    it('accepts a single url template', (done) => {
      const assert = getAssert(done);
      const template = `${emptyUrl}#/{z}/{x}/{y}`;
      const source = new ImageTile({url: template});

      const tile = source.getTile(3, 2, 1);
      source.on('tileloadend', () => {
        const data = tile.getData();
        assert(data instanceof Image, 'expected an image');
        const url = `${emptyUrl}#/3/2/1`;
        assert(data.src === url, `expected ${data.src} to be ${url}`);
        done();
      });

      tile.load();
    });

    it('accepts an array of url templates', (done) => {
      const assert = getAssert(done);
      const templates = [
        `${emptyUrl}#a/{z}/{x}/{y}`,
        `${emptyUrl}#b/{z}/{x}/{y}`,
        `${emptyUrl}#c/{z}/{x}/{y}`,
        `${emptyUrl}#d/{z}/{x}/{y}`,
      ];

      const source = new ImageTile({url: templates});

      const tiles = [
        source.getTile(4, 1, 1),
        source.getTile(4, 1, 2),
        source.getTile(4, 2, 1),
        source.getTile(4, 2, 2),
      ];

      let loaded = 0;

      source.on('tileloadend', () => {
        loaded += 1;
        if (loaded < tiles.length) {
          return;
        }
        for (const tile of tiles) {
          const data = tile.getData();
          const [z, x, y] = tile.tileCoord;
          const template = pickUrl(templates, z, x, y);
          const url = renderXYZTemplate(template, z, x, y);
          assert(data instanceof Image, 'expected an image');
          assert(
            data.src === renderXYZTemplate(template, z, x, y),
            `expected ${data.src} to be ${url}`,
          );
        }
        done();
      });

      for (const tile of tiles) {
        tile.load();
      }
    });

    it('accepts a function that returns a url', (done) => {
      const assert = getAssert(done);
      const source = new ImageTile({
        url: (z, x, y) => `${emptyUrl}#/${z}/${x}/${y}`,
      });

      const tile = source.getTile(10, 9, 8);
      source.on('tileloadend', () => {
        const data = tile.getData();
        assert(data instanceof Image, 'expected an image');
        const url = `${emptyUrl}#/10/9/8`;
        assert(data.src === url, `expected ${data.src} to be ${url}`);
        done();
      });

      tile.load();
    });
  });

  describe('crossOrigin option', () => {
    it('gets passed to the loader', (done) => {
      const assert = getAssert(done);

      const crossOriginValue = 'foo';

      let got;
      const source = new ImageTile({
        crossOrigin: crossOriginValue,
        loader: (x, y, z, {crossOrigin}) => {
          got = crossOrigin;
          return loadImage(emptyUrl);
        },
      });

      const tile = source.getTile(3, 2, 1);
      source.on('tileloadend', () => {
        assert(
          got === crossOriginValue,
          `expected ${crossOriginValue}, got ${got}`,
        );
        done();
      });

      tile.load();
    });

    it('defaults to anonymous', (done) => {
      const assert = getAssert(done);

      let got;
      const source = new ImageTile({
        loader: (x, y, z, {crossOrigin}) => {
          got = crossOrigin;
          return loadImage(emptyUrl);
        },
      });

      const tile = source.getTile(3, 2, 1);
      source.on('tileloadend', () => {
        assert(got === 'anonymous', `expected anonymous, got ${got}`);
        done();
      });

      tile.load();
    });
  });

  describe('#getInterpolate()', () => {
    it('is true by default', () => {
      const source = new ImageTile({});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', () => {
      const source = new ImageTile({interpolate: false});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('tile dispose', () => {
    it('triggers abort event on the signal', (done) => {
      const assert = getAssert(done);

      const source = new ImageTile({
        loader(z, x, y, {signal}) {
          signal.addEventListener('abort', () => {
            const reason = signal.reason;
            assert(
              done,
              reason instanceof Error,
              'expected reason to be an error',
            );
            assert(
              done,
              reason.message === 'disposed',
              `expected ${reason.message} to be 'disposed'`,
            );
            done();
          });

          return new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('abort was not dispatched'));
            }, 5000);
          });
        },
      });

      const tile = source.getTile(0, 0, 0);
      tile.load();
      setTimeout(() => {
        tile.dispose();
      }, 50);
    });
  });

  describe('tile load events', () => {
    it('dispatches tileloadstart and tileloadend events', (done) => {
      const assert = getAssert(done);

      const source = new ImageTile({url: emptyUrl});

      let startCalled = false;
      source.on('tileloadstart', () => {
        assert(done, !startCalled, 'tileloadstart fired twice');
        startCalled = true;
      });

      source.on('tileloadend', () => {
        assert(done, startCalled, 'expected tileloadstart to be fired');
        done();
      });

      const tile = source.getTile(0, 0, 0);
      tile.load();
    });

    it('works for loading-error-loading-loaded sequences', (done) => {
      const assert = getAssert(done);

      const source = new ImageTile({
        loader() {
          throw new Error('tile load failed');
        },
      });

      let startCalls = 0;
      source.on('tileloadstart', () => {
        startCalls += 1;
      });

      let errorCalled = false;
      source.on('tileloaderror', function (e) {
        assert(done, !errorCalled, 'tileloaderror fired twice');
        errorCalled = true;
        setTimeout(() => {
          e.tile.setState(TileState.LOADING);
          e.tile.setState(TileState.LOADED);
        }, 0);
      });

      source.on('tileloadend', () => {
        assert(
          done,
          startCalls === 2,
          `expected 2 tileloadstart events, got ${startCalls}`,
        );
        assert(done, errorCalled, 'expected tileloaderror to be fired');
        done();
      });

      const tile = source.getTile(0, 0, 0);
      tile.load();
    });
  });
});
