import Static from '../../../../../src/ol/source/ImageStatic.js';
import {get as getProjection} from '../../../../../src/ol/proj.js';

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
      const source = new Static({});
      expect(source.getInterpolate()).to.be(true);
    });

    it('is false if constructed with interpolate: false', function () {
      const source = new Static({interpolate: false});
      expect(source.getInterpolate()).to.be(false);
    });
  });

  describe('#getImage', function () {
    it('scales image height to fit imageExtent', function (done) {
      const source = new Static({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189, -13619243.951739565,
          4559315.863154193,
        ],
        projection: projection,
      });

      const image = source.getImage(extent, resolution, pixelRatio, projection);

      source.on('imageloadend', function (event) {
        expect(image.getImage().width).to.be(256);
        expect(image.getImage().height).to.be(512);
        done();
      });

      image.load();
    });

    it('scales image width to fit imageExtent', function (done) {
      const source = new Static({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189, -13609460.012119063,
          4549531.923533691,
        ],
        projection: projection,
      });

      const image = source.getImage(extent, resolution, pixelRatio, projection);

      source.on('imageloadend', function (event) {
        expect(image.getImage().width).to.be(512);
        expect(image.getImage().height).to.be(256);
        done();
      });

      image.load();
    });

    it('respects imageSize', function (done) {
      const source = new Static({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189, -13619243.951739565,
          4559315.863154193,
        ],
        imageSize: [254, 254],
        projection: projection,
      });

      const image = source.getImage(extent, resolution, pixelRatio, projection);

      source.on('imageloadend', function (event) {
        expect(image.getImage().width).to.be(254);
        expect(image.getImage().height).to.be(508);
        done();
      });

      image.load();
    });

    it('triggers image load events', function (done) {
      const source = new Static({
        url: 'spec/ol/source/images/12-655-1583.png',
        imageExtent: [
          -13629027.891360067, 4539747.983913189, -13619243.951739565,
          4549531.923533691,
        ],
        projection: projection,
      });

      const imageloadstart = sinon.spy();
      const imageloaderror = sinon.spy();

      source.on('imageloadstart', imageloadstart);
      source.on('imageloaderror', imageloaderror);
      source.on('imageloadend', function (event) {
        expect(imageloadstart.callCount).to.be(1);
        expect(imageloaderror.callCount).to.be(0);
        done();
      });

      const image = source.getImage(extent, resolution, pixelRatio, projection);
      image.load();
    });
  });
});
