import {assert} from 'chai';
import {spy as sinonSpy} from 'sinon';
import ImageWrapper, {
  decode,
  decodeFallback,
  listenImage,
  load,
} from '../../../../src/ol/Image.js';
import ImageState from '../../../../src/ol/ImageState.js';

const dataUri =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

describe('ol/Image', function () {
  const extent = [0, 0, 1, 1];
  const resolution = 1;
  const pixelRatio = 1;
  describe('constructor', function () {
    it('creates a new instance with image state', function () {
      const instance = new ImageWrapper(
        extent,
        resolution,
        pixelRatio,
        ImageState.IDLE,
      );
      assert.instanceOf(instance, ImageWrapper);
      assert.strictEqual(instance.getState(), ImageState.IDLE);
    });
    it('creates a new instance with a loader', function (done) {
      let instance = undefined;
      const image = new Image();
      const loader = (extent, resolution, pixelRatio) => {
        assert.deepEqual(extent, [0, 0, 1, 1]);
        assert.strictEqual(resolution, 1);
        assert.strictEqual(pixelRatio, 1);
        image.src =
          'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        instance.setImage(image);
        return load(image);
      };
      instance = new ImageWrapper(extent, resolution, pixelRatio, loader);
      assert.instanceOf(instance, ImageWrapper);
      assert.strictEqual(instance.getState(), ImageState.IDLE);
      instance.addEventListener('change', function handleChange() {
        if (instance.getState() === ImageState.LOADED) {
          instance.removeEventListener('change', handleChange);
          assert.strictEqual(instance.getImage(), image);
          done();
        }
      });
      instance.load();
    });
  });
  describe('HTML Image loading', function () {
    let handleLoad, handleError, img;

    beforeEach(function () {
      handleLoad = sinonSpy();
      handleError = sinonSpy();
      img = new Image();
    });

    it('handles load event', function (done) {
      img.src = 'spec/ol/data/dot.png';
      listenImage(img, handleLoad, handleError);

      setTimeout(function () {
        assert.strictEqual(handleLoad.called, true);
        assert.strictEqual(handleError.called, false);
        done();
      }, 200);
    });

    it('handles load event when src is set later', function (done) {
      listenImage(img, handleLoad, handleError);
      img.src = 'spec/ol/data/dot.png';

      setTimeout(function () {
        assert.strictEqual(handleLoad.called, true);
        assert.strictEqual(handleError.called, false);
        done();
      }, 200);
    });

    it('handles error event', function (done) {
      img.src = 'invalid.jpeg';
      listenImage(img, handleLoad, handleError);

      setTimeout(function () {
        assert.strictEqual(handleLoad.called, false);
        assert.strictEqual(handleError.called, true);
        done();
      }, 500);
    });

    it('handles cancelation', function (done) {
      img.src = 'spec/ol/data/dot.png';
      listenImage(img, handleLoad, handleError)();

      setTimeout(function () {
        assert.strictEqual(handleLoad.called, false);
        assert.strictEqual(handleError.called, false);
        done();
      }, 200);
    });
  });

  describe('Promise based loading', function () {
    let image;
    this.beforeEach(function () {
      image = new Image();
    });
    it('load()', async () => {
      image.src = dataUri;
      const loadedImage = await load(image);
      assert.deepEqual(loadedImage, image);
      assert.strictEqual(loadedImage.width, 1);
    });
    it('load() with error', async () => {
      image.src = 'invalid.jpeg';
      try {
        await load(image);
        assert.fail();
      } catch (error) {
        assert.instanceOf(error, Error);
      }
    });
    it('decodeFallback()', async () => {
      image.src = dataUri;
      const loadedImage = await decodeFallback(image);
      assert.deepEqual(loadedImage, image);
      assert.strictEqual(loadedImage.width, 1);
    });
    it('decodeFallback() with error', async () => {
      image.src = 'invalid.jpeg';
      try {
        await decodeFallback(image);
        assert.fail();
      } catch (error) {
        assert.instanceOf(error, Error);
      }
    });
    it('decode()', async () => {
      image.src = dataUri;
      const loadedImage = await decode(image);
      assert.instanceOf(loadedImage, ImageBitmap);
      assert.strictEqual(loadedImage.width, 1);
    });
    it('decode() with error', async () => {
      image.src = 'invalid.jpeg';
      try {
        await decode(image);
        assert.fail();
      } catch (error) {
        assert.instanceOf(error, Error);
      }
    });
    it('decode() with SVG', async () => {
      image.src =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"/>';
      const loadedImage = await decode(image);
      assert.instanceOf(loadedImage, ImageBitmap);
      assert.strictEqual(loadedImage.width, 1);
    });
    it('decode() with zero-dimension SVG', async () => {
      image.src =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      try {
        await decode(image);
        assert.fail();
      } catch (error) {
        assert.instanceOf(error, Error);
      }
    });
  });
});
