import ImageWrapper from '../../../../../src/ol/Image.js';
import ReprojImage from '../../../../../src/ol/reproj/Image.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import {listen} from '../../../../../src/ol/events.js';

describe('ol.reproj.Image', function () {
  function createImage(pixelRatio) {
    return new ReprojImage(
      getProjection('EPSG:3857'),
      getProjection('EPSG:4326'),
      [-180, -85, 180, 85],
      10,
      pixelRatio,
      function (extent, resolution, pixelRatio) {
        return new ImageWrapper(
          extent,
          resolution,
          pixelRatio,
          'data:image/gif;base64,' +
            'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
          null,
          function (image, src) {
            image.getImage().src = src;
          }
        );
      }
    );
  }

  function createTranslucentImage(pixelRatio) {
    return new ReprojImage(
      getProjection('EPSG:3857'),
      getProjection('EPSG:4326'),
      [-180, -85, 180, 85],
      10,
      pixelRatio,
      function (extent, resolution, pixelRatio) {
        return new ImageWrapper(
          extent,
          resolution,
          pixelRatio,
          'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8depePQAIiwMjFXlnJQAAAABJRU5ErkJggg==',
          null,
          function (image, src) {
            image.getImage().src = src;
          }
        );
      }
    );
  }

  it('changes state as expected', function (done) {
    const image = createImage(1);
    expect(image.getState()).to.be(0); // IDLE
    listen(image, 'change', function () {
      if (image.getState() == 2) {
        // LOADED
        done();
      }
    });
    image.load();
  });

  it('returns correct canvas size', function (done) {
    const image = createImage(1);
    listen(image, 'change', function () {
      if (image.getState() == 2) {
        // LOADED
        const canvas = image.getImage();
        expect(canvas.width).to.be(36);
        expect(canvas.height).to.be(17);
        done();
      }
    });
    image.load();
  });

  it('respects pixelRatio', function (done) {
    const image = createImage(2);
    listen(image, 'change', function () {
      if (image.getState() == 2) {
        // LOADED
        const canvas = image.getImage();
        expect(canvas.width).to.be(72);
        expect(canvas.height).to.be(34);
        done();
      }
    });
    image.load();
  });

  it('has uniform color', function (done) {
    const image = createTranslucentImage(1);
    listen(image, 'change', function () {
      if (image.getState() == 2) {
        // LOADED
        const canvas = image.getImage();
        expect(canvas.width).to.be(36);
        expect(canvas.height).to.be(17);
        const pixels = canvas
          .getContext('2d')
          .getImageData(0, 0, canvas.width, canvas.height).data;

        for (let i = 0; i < canvas.width * canvas.height * 4; i += 4) {
          expect(
            Math.abs(pixels[i + 0] - pixels[0]) +
              Math.abs(pixels[i + 1] - pixels[1]) +
              Math.abs(pixels[i + 2] - pixels[2]) +
              Math.abs(pixels[i + 3] - pixels[3])
          ).to.be.lessThan(5);
        }
        done();
      }
    });
    image.load();
  });
});
