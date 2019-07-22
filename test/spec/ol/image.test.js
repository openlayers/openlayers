import {listenImage} from '../../../src/ol/Image.js';


describe('HTML Image loading', function() {
  let handleLoad, handleError, img;

  beforeEach(function() {
    handleLoad = sinon.spy();
    handleError = sinon.spy();
    img = new Image();
  });

  it('handles load event', function(done) {
    img.src = 'spec/ol/data/dot.png';
    listenImage(img, handleLoad, handleError);

    setTimeout(function() {
      expect(handleLoad).to.be.called();
      expect(handleError).not.to.be.called();
      done();
    }, 200);
  });

  it('handles load event when src is set later', function(done) {
    listenImage(img, handleLoad, handleError);
    img.src = 'spec/ol/data/dot.png';

    setTimeout(function() {
      expect(handleLoad).to.be.called();
      expect(handleError).not.to.be.called();
      done();
    }, 200);
  });

  it('handles error event', function(done) {
    img.src = 'invalid.jpeg';
    listenImage(img, handleLoad, handleError);

    setTimeout(function() {
      expect(handleLoad).not.to.be.called();
      expect(handleError).to.be.called();
      done();
    }, 200);
  });

  it('handles cancelation', function(done) {
    img.src = 'spec/ol/data/dot.png';
    listenImage(img, handleLoad, handleError)();

    setTimeout(function() {
      expect(handleLoad).not.to.be.called();
      expect(handleError).not.to.be.called();
      done();
    }, 200);
  });

});
