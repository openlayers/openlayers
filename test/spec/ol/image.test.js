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
      expect(handleLoad.called).to.be(true);
      expect(handleError.called).to.be(false);
      done();
    }, 200);
  });

  it('handles load event when src is set later', function(done) {
    listenImage(img, handleLoad, handleError);
    img.src = 'spec/ol/data/dot.png';

    setTimeout(function() {
      expect(handleLoad.called).to.be(true);
      expect(handleError.called).to.be(false);
      done();
    }, 200);
  });

  it('handles error event', function(done) {
    img.src = 'invalid.jpeg';
    listenImage(img, handleLoad, handleError);

    setTimeout(function() {
      expect(handleLoad.called).to.be(false);
      expect(handleError.called).to.be(true);
      done();
    }, 200);
  });

  it('handles cancelation', function(done) {
    img.src = 'spec/ol/data/dot.png';
    listenImage(img, handleLoad, handleError)();

    setTimeout(function() {
      expect(handleLoad.called).to.be(false);
      expect(handleError.called).to.be(false);
      done();
    }, 200);
  });

});
