import Image from '../../../src/ol/Image.js';
import ImageState from '../../../src/ol/ImageState.js';
import {listen, unlistenByKey} from '../../../src/ol/events.js';


describe('ol.Image', function() {

  describe('#abort()', function() {

    let key;

    beforeEach(function() {
      key = undefined;
    });

    afterEach(function() {
      if (key) {
        unlistenByKey(key);
      }
    });

    it('aborts image loading', function(done) {
      const src = 'spec/ol/data/osm-0-0-0.png';
      let callCount = 0;
      let imgElement;
      const image = new Image([0, 0, 256, 256], 1, 1, src, true, function(img, url) {
        imgElement = img.getImage();
        expect(url).to.be(src);
        imgElement.src = url;
      });
      key = listen(image, 'change', function() {
        ++callCount;
        if (callCount === 1) {
          expect(image.state).to.be(ImageState.LOADING);
        } else if (callCount === 2) {
          expect(image.state).to.be(ImageState.ABORT);
          done();
        }
      });
      expect(image.abort()).to.be(null);
      image.load();
      expect(imgElement).to.be.a(HTMLImageElement);
      expect(image.abort()).to.eql(imgElement);
      expect(image.getImage()).to.be(null);
    });

  });

});
