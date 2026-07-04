import {assert} from 'chai';
import ImageWrapper, {load} from '../../../../../src/ol/Image.js';
import {listen} from '../../../../../src/ol/events.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import ReprojImage from '../../../../../src/ol/reproj/Image.js';

describe('ol.reproj.Image', function () {
  function createImage(pixelRatio) {
    return new ReprojImage(
      getProjection('EPSG:3857'),
      getProjection('EPSG:4326'),
      [-180, -85, 180, 85],
      10,
      pixelRatio,
      function (extent, resolution, pixelRatio) {
        return new ImageWrapper(extent, resolution, pixelRatio, () => {
          const img = new Image();
          img.src =
            'data:image/gif;base64,' +
            'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';
          return load(img);
        });
      },
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
        return new ImageWrapper(extent, resolution, pixelRatio, () => {
          const img = new Image();
          img.src =
            'data:image/png;base64,' +
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8depePQAIiwMjFXlnJQAAAABJRU5ErkJggg==';
          return load(img);
        });
      },
    );
  }

  it('changes state as expected', () =>
    new Promise((resolve) => {
      const image = createImage(1);
      assert.strictEqual(image.getState(), 0);
      listen(image, 'change', function () {
        if (image.getState() == 2) {
          // LOADED
          resolve();
        }
      });
      image.load();
    }));

  it('returns correct canvas size', () =>
    new Promise((resolve) => {
      const image = createImage(1);
      listen(image, 'change', function () {
        if (image.getState() == 2) {
          // LOADED
          const canvas = image.getImage();
          assert.strictEqual(canvas.width, 36);
          assert.strictEqual(canvas.height, 17);
          resolve();
        }
      });
      image.load();
    }));

  it('respects pixelRatio', () =>
    new Promise((resolve) => {
      const image = createImage(2);
      listen(image, 'change', function () {
        if (image.getState() == 2) {
          // LOADED
          const canvas = image.getImage();
          assert.strictEqual(canvas.width, 72);
          assert.strictEqual(canvas.height, 34);
          resolve();
        }
      });
      image.load();
    }));

  it('has uniform color', () =>
    new Promise((resolve) => {
      const image = createTranslucentImage(1);
      listen(image, 'change', function () {
        if (image.getState() == 2) {
          // LOADED
          const canvas = image.getImage();
          assert.strictEqual(canvas.width, 36);
          assert.strictEqual(canvas.height, 17);
          const pixels = canvas
            .getContext('2d')
            .getImageData(0, 0, canvas.width, canvas.height).data;

          for (let i = 0; i < canvas.width * canvas.height * 4; i += 4) {
            assert.isBelow(
              Math.abs(pixels[i + 0] - pixels[0]) +
                Math.abs(pixels[i + 1] - pixels[1]) +
                Math.abs(pixels[i + 2] - pixels[2]) +
                Math.abs(pixels[i + 3] - pixels[3]),
              5,
            );
          }
          resolve();
        }
      });
      image.load();
    }));
});
