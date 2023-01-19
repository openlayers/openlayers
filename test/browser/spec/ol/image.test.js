import ImageState from '../../../../src/ol/ImageState.js';
import ImageWrapper, {listenImage} from '../../../../src/ol/Image.js';
import {createCanvasContext2D} from '../../../../src/ol/dom.js';
import {defaultImageLoadFunction} from '../../../../src/ol/source/Image.js';

describe('HTML Image loading', function () {
  let handleLoad, handleError, img;

  beforeEach(function () {
    handleLoad = sinon.spy();
    handleError = sinon.spy();
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

describe('getImage() with context', function () {
  let image;
  this.beforeEach(function (done) {
    image = new ImageWrapper(
      [0, 0, 1, 1],
      1,
      1,
      'spec/ol/data/dot.png',
      null,
      defaultImageLoadFunction,
      createCanvasContext2D()
    );
    image.addEventListener('change', function () {
      if (image.getState() === ImageState.LOADED) {
        done();
      }
    });
    image.load();
  });

  it('renders the image to the provided context, returns its canvas', function () {
    expect(image.image_).to.be.a(HTMLImageElement);
    expect(image.getImage()).to.be.a(HTMLCanvasElement);
    expect(image.context_.canvas).to.eql(image.getImage());
  });
});
