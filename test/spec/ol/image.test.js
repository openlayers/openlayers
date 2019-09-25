import {listenImage} from '../../../src/ol/Image.js';


describe('HTML Image loading', () => {
  let handleLoad, handleError, img;

  beforeEach(() => {
    handleLoad = sinon.spy();
    handleError = sinon.spy();
    img = new Image();
  });

  test('handles load event', done => {
    img.src = 'spec/ol/data/dot.png';
    listenImage(img, handleLoad, handleError);

    setTimeout(function() {
      expect(handleLoad).to.be.called();
      expect(handleError).not.to.be.called();
      done();
    }, 200);
  });

  test('handles load event when src is set later', done => {
    listenImage(img, handleLoad, handleError);
    img.src = 'spec/ol/data/dot.png';

    setTimeout(function() {
      expect(handleLoad).to.be.called();
      expect(handleError).not.to.be.called();
      done();
    }, 200);
  });

  test('handles error event', done => {
    img.src = 'invalid.jpeg';
    listenImage(img, handleLoad, handleError);

    setTimeout(function() {
      expect(handleLoad).not.to.be.called();
      expect(handleError).to.be.called();
      done();
    }, 200);
  });

  test('handles cancelation', done => {
    img.src = 'spec/ol/data/dot.png';
    listenImage(img, handleLoad, handleError)();

    setTimeout(function() {
      expect(handleLoad).not.to.be.called();
      expect(handleError).not.to.be.called();
      done();
    }, 200);
  });

});
