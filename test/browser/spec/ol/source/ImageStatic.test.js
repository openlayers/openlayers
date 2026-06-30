import {assert} from 'chai';
import {
  getBottomLeft,
  getHeight,
  getWidth,
} from '../../../../../src/ol/extent.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';
import Static from '../../../../../src/ol/source/ImageStatic.js';

describe('ol/source/ImageStatic', function () {
  let extent, pixelRatio, projection, resolution;
  beforeEach(function () {
    extent = [
      -13637278.73946974, 4543799.13271362, -13617443.330629736,
      4553927.038961405,
    ];
    pixelRatio = 1;
    projection = getProjection('EPSG:3857');
    resolution = 38;
  });

  describe('#getInterpolate()', function () {
    it('is true by default', function () {
      const source = new Static({imageExtent: extent});
      assert.strictEqual(source.getInterpolate(), true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new Static({imageExtent: extent, interpolate: false});
      assert.strictEqual(source.getInterpolate(), false);
    });
  });

  describe('#getImage', function () {
    it('scales image height to fit imageExtent', () =>
      new Promise((resolve, reject) => {
        const source = new Static({
          url: 'spec/ol/source/images/12-655-1583.png',
          imageExtent: [
            -13629027.891360067, 4539747.983913189, -13619243.951739565,
            4559315.863154193,
          ],
          projection: projection,
        });

        const image = source.getImage(
          extent,
          resolution,
          pixelRatio,
          projection,
        );

        source.on('imageloadend', function (event) {
          try {
            const [resolutionX, resolutionY] = image.getResolution();
            assert.strictEqual(resolutionY, resolutionX * 2);
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        image.load();
      }));

    it('scales image width to fit imageExtent', () =>
      new Promise((resolve, reject) => {
        const source = new Static({
          url: 'spec/ol/source/images/12-655-1583.png',
          imageExtent: [
            -13629027.891360067, 4539747.983913189, -13609460.012119063,
            4549531.923533691,
          ],
          projection: projection,
        });

        const image = source.getImage(
          extent,
          resolution,
          pixelRatio,
          projection,
        );

        source.on('imageloadend', function (event) {
          try {
            const [resolutionX, resolutionY] = image.getResolution();
            assert.strictEqual(resolutionX, 2 * resolutionY);
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        image.load();
      }));

    it('Had an imageSize option which changed the imageExtent when used with incorrect image sizes', () =>
      new Promise((resolve, reject) => {
        const imageExtent = [
          -13629027.891360067, 4539747.983913189, -13619243.951739565,
          4559315.863154193,
        ];
        const correctImageSize = [256, 256];
        const imageSize = [254, 254]; // this was set as `imageSize` option in the source config
        const wantedExtent = [
          ...getBottomLeft(imageExtent),
          imageExtent[0] +
            (getWidth(imageExtent) / imageSize[0]) * correctImageSize[0],
          imageExtent[1] +
            (getHeight(imageExtent) / imageSize[1]) * correctImageSize[1],
        ];
        const source = new Static({
          url: 'spec/ol/source/images/12-655-1583.png',
          imageExtent: wantedExtent,
          projection: projection,
        });

        const image = source.getImage(
          extent,
          resolution,
          pixelRatio,
          projection,
        );

        source.on('imageloadend', function (event) {
          try {
            const [resolutionX, resolutionY] = image.getResolution();
            assert.strictEqual(
              Math.round(getWidth(imageExtent) / resolutionX),
              254,
            );
            assert.strictEqual(
              Math.round(getHeight(imageExtent) / resolutionY),
              254,
            );
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        image.load();
      }));

    it('triggers image load events', () =>
      new Promise((resolve) => {
        const source = new Static({
          url: 'spec/ol/source/images/12-655-1583.png',
          imageExtent: [
            -13629027.891360067, 4539747.983913189, -13619243.951739565,
            4549531.923533691,
          ],
          projection: projection,
        });

        const imageloadstart = vi.fn();
        const imageloaderror = vi.fn();

        source.on('imageloadstart', imageloadstart);
        source.on('imageloaderror', imageloaderror);
        source.on('imageloadend', function (event) {
          assert.strictEqual(imageloadstart.mock.calls.length, 1);
          assert.strictEqual(imageloaderror.mock.calls.length, 0);
          resolve();
        });

        const image = source.getImage(
          extent,
          resolution,
          pixelRatio,
          projection,
        );
        image.load();
      }));
  });
});
