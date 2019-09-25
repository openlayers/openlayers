import ImageWrapper from '../../../../src/ol/Image.js';
import {listen} from '../../../../src/ol/events.js';
import {get as getProjection} from '../../../../src/ol/proj.js';
import ReprojImage from '../../../../src/ol/reproj/Image.js';


describe('ol.reproj.Image', () => {
  function createImage(pixelRatio) {
    return new ReprojImage(
      getProjection('EPSG:3857'), getProjection('EPSG:4326'),
      [-180, -85, 180, 85], 10, pixelRatio,
      function(extent, resolution, pixelRatio) {
        return new ImageWrapper(extent, resolution, pixelRatio,
          'data:image/gif;base64,' +
              'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', null,
          function(image, src) {
            image.getImage().src = src;
          });
      });
  }

  test('changes state as expected', done => {
    const image = createImage(1);
    expect(image.getState()).toBe(0);
    listen(image, 'change', function() {
      if (image.getState() == 2) { // LOADED
        done();
      }
    });
    image.load();
  });

  test('returns correct canvas size', done => {
    const image = createImage(1);
    listen(image, 'change', function() {
      if (image.getState() == 2) { // LOADED
        const canvas = image.getImage();
        expect(canvas.width).toBe(36);
        expect(canvas.height).toBe(17);
        done();
      }
    });
    image.load();
  });

  test('respects pixelRatio', done => {
    const image = createImage(2);
    listen(image, 'change', function() {
      if (image.getState() == 2) { // LOADED
        const canvas = image.getImage();
        expect(canvas.width).toBe(72);
        expect(canvas.height).toBe(34);
        done();
      }
    });
    image.load();
  });
});
