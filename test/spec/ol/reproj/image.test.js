

import _ol_Image_ from '../../../../src/ol/image';
import _ol_events_ from '../../../../src/ol/events';
import _ol_proj_ from '../../../../src/ol/proj';
import _ol_reproj_Image_ from '../../../../src/ol/reproj/image';


describe('ol.reproj.Image', function() {
  function createImage(pixelRatio) {
    return new _ol_reproj_Image_(
        _ol_proj_.get('EPSG:3857'), _ol_proj_.get('EPSG:4326'),
        [-180, -85, 180, 85], 10, pixelRatio,
        function(extent, resolution, pixelRatio) {
          return new _ol_Image_(extent, resolution, pixelRatio, [],
              'data:image/gif;base64,' +
              'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', null,
              function(image, src) {
                image.getImage().src = src;
              });
        });
  }

  it('changes state as expected', function(done) {
    var image = createImage(1);
    expect(image.getState()).to.be(0); // IDLE
    _ol_events_.listen(image, 'change', function() {
      if (image.getState() == 2) { // LOADED
        done();
      }
    });
    image.load();
  });

  it('returns correct canvas size', function(done) {
    var image = createImage(1);
    _ol_events_.listen(image, 'change', function() {
      if (image.getState() == 2) { // LOADED
        var canvas = image.getImage();
        expect(canvas.width).to.be(36);
        expect(canvas.height).to.be(17);
        done();
      }
    });
    image.load();
  });

  it('respects pixelRatio', function(done) {
    var image = createImage(2);
    _ol_events_.listen(image, 'change', function() {
      if (image.getState() == 2) { // LOADED
        var canvas = image.getImage();
        expect(canvas.width).to.be(72);
        expect(canvas.height).to.be(34);
        done();
      }
    });
    image.load();
  });
});
