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
      expect(instance).to.be.an(ImageWrapper);
      expect(instance.getState()).to.be(ImageState.IDLE);
    });
    it('creates a new instance with a loader', function (done) {
      let instance = undefined;
      const image = new Image();
      const loader = (extent, resolution, pixelRatio) => {
        expect(extent).to.eql([0, 0, 1, 1]);
        expect(resolution).to.be(1);
        expect(pixelRatio).to.be(1);
        image.src =
          'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        instance.setImage(image);
        return load(image);
      };
      instance = new ImageWrapper(extent, resolution, pixelRatio, loader);
      expect(instance).to.be.an(ImageWrapper);
      expect(instance.getState()).to.be(ImageState.IDLE);
      instance.addEventListener('change', function handleChange() {
        if (instance.getState() === ImageState.LOADED) {
          instance.removeEventListener('change', handleChange);
          expect(instance.getImage()).to.be(image);
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
        expect(handleLoad.called).to.be(true);
        expect(handleError.called).to.be(false);
        done();
      }, 200);
    });

    it('handles load event when src is set later', function (done) {
      listenImage(img, handleLoad, handleError);
      img.src = 'spec/ol/data/dot.png';

      setTimeout(function () {
        expect(handleLoad.called).to.be(true);
        expect(handleError.called).to.be(false);
        done();
      }, 200);
    });

    it('handles error event', function (done) {
      img.src = 'invalid.jpeg';
      listenImage(img, handleLoad, handleError);

      setTimeout(function () {
        expect(handleLoad.called).to.be(false);
        expect(handleError.called).to.be(true);
        done();
      }, 500);
    });

    it('handles cancelation', function (done) {
      img.src = 'spec/ol/data/dot.png';
      listenImage(img, handleLoad, handleError)();

      setTimeout(function () {
        expect(handleLoad.called).to.be(false);
        expect(handleError.called).to.be(false);
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
      expect(loadedImage).to.eql(image);
      expect(loadedImage.width).to.be(1);
    });
    it('load() with error', async () => {
      image.src = 'invalid.jpeg';
      try {
        await load(image);
        expect().fail();
      } catch (error) {
        expect(error).to.be.an(Error);
      }
    });
    it('decodeFallback()', async () => {
      image.src = dataUri;
      const loadedImage = await decodeFallback(image);
      expect(loadedImage).to.eql(image);
      expect(loadedImage.width).to.be(1);
    });
    it('decodeFallback() with error', async () => {
      image.src = 'invalid.jpeg';
      try {
        await decodeFallback(image);
        expect().fail();
      } catch (error) {
        expect(error).to.be.an(Error);
      }
    });
    it('decode()', async () => {
      image.src = dataUri;
      const loadedImage = await decode(image);
      expect(loadedImage).to.be.an(ImageBitmap);
      expect(loadedImage.width).to.be(1);
    });
    it('decode() with error', async () => {
      image.src = 'invalid.jpeg';
      try {
        await decode(image);
        expect().fail();
      } catch (error) {
        expect(error).to.be.an(Error);
      }
    });
    it('decode() with SVG', async () => {
      image.src =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"/>';
      const loadedImage = await decode(image);
      expect(loadedImage).to.be.an(ImageBitmap);
      expect(loadedImage.width).to.be(1);
    });
    it('decode() with zero-dimension SVG', async () => {
      image.src =
        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      try {
        await decode(image);
        expect().fail();
      } catch (error) {
        expect(error).to.be.an(Error);
      }
    });
  });
});
