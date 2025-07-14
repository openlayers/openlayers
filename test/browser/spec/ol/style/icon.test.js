import ImageState from '../../../../../src/ol/ImageState.js';
import Icon from '../../../../../src/ol/style/Icon.js';
import IconImage, {
  get as getIconImage,
} from '../../../../../src/ol/style/IconImage.js';
import {shared as iconImageCache} from '../../../../../src/ol/style/IconImageCache.js';
import {getUid} from '../../../../../src/ol/util.js';

describe('ol.style.Icon', function () {
  const size = [36, 48];
  const src =
    'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

  beforeEach(function () {
    iconImageCache.clear();
  });
  describe('constructor', function () {
    it('caches canvas images with a uid as src', function () {
      const canvas = document.createElement('canvas');
      new Icon({
        img: canvas,
      });
      expect(getIconImage(canvas, getUid(canvas)).getImage()).to.eql(canvas);
    });
  });

  describe('#clone', function () {
    it('creates a new ol.style.Icon', function () {
      const original = new Icon({
        src: src,
      });
      const clone = original.clone();
      expect(clone).to.be.an(Icon);
      expect(clone).to.not.be(original);
    });

    it('copies all values with img', function () {
      const canvas = document.createElement('canvas');
      const original = new Icon({
        anchor: [1, 0],
        anchorOrigin: 'bottom-right',
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        color: '#319FD3',
        crossOrigin: 'Anonymous',
        img: canvas,
        offset: [1, 2],
        offsetOrigin: 'bottom-left',
        opacity: 0.5,
        scale: 2,
        rotation: 4,
        size: [10, 12],
        displacement: [5, 6],
        declutterMode: 'obstacle',
      });

      const clone = original.clone();
      expect(original.getImage(1)).to.be(clone.getImage(1));
      expect(original.iconImage_).to.be(clone.iconImage_);
      expect(original.getAnchor()).to.eql(clone.getAnchor());
      expect(original.anchorOrigin_).to.eql(clone.anchorOrigin_);
      expect(original.anchorXUnits_).to.eql(clone.anchorXUnits_);
      expect(original.anchorYUnits_).to.eql(clone.anchorYUnits_);
      expect(original.crossOrigin_).to.eql(clone.crossOrigin_);
      expect(original.getColor()).to.eql(clone.getColor());
      expect(original.offset_).to.eql(clone.offset_);
      expect(original.offsetOrigin_).to.eql(clone.offsetOrigin_);
      expect(original.getScale()).to.eql(clone.getScale());
      expect(original.getSize()).to.eql(clone.getSize());
      expect(original.getSrc()).to.eql(clone.getSrc());
      expect(original.getOpacity()).to.eql(clone.getOpacity());
      expect(original.getRotation()).to.eql(clone.getRotation());
      expect(original.getRotateWithView()).to.eql(clone.getRotateWithView());
      expect(original.getDisplacement()).to.eql(clone.getDisplacement());
      expect(original.getDeclutterMode()).to.eql(clone.getDeclutterMode());
    });
    it('copies all values with src', function () {
      const original = new Icon({
        src: src,
      });
      const clone = original.clone();
      expect(original.getImage(1)).to.be(clone.getImage(1));
      expect(original.iconImage_).to.be(clone.iconImage_);
      expect(original.getSrc()).to.be(clone.getSrc());
    });
    it('copies all values with src without shared IconImageCache', function (done) {
      const original = new Icon({
        src: src,
      });
      iconImageCache.clear();

      const clone = original.clone();

      original.load();
      clone.load();
      Promise.all([
        new Promise(function (resolve) {
          original.iconImage_.addEventListener('change', resolve);
        }),
        new Promise(function (resolve) {
          clone.iconImage_.addEventListener('change', resolve);
        }),
      ]).then(function () {
        expect(original.getSrc()).to.be(clone.getSrc());
        expect(original.iconImage_).to.not.be(clone.iconImage_);
        expect(original.getImage(1).width).to.be(clone.getImage(1).width);
        expect(original.getImage(1).height).to.be(clone.getImage(1).height);
        done();
      });
    });

    it('preserves the scale', (done) => {
      const original = new Icon({
        src: 'spec/ol/data/dot.png',
      });
      original.setScale(2);
      expect(original.getScale()).to.be(2);
      const clone = original.clone();
      expect(original.getScale()).to.eql(clone.getScale());
      original.load();
      original.getImage(1).addEventListener('load', () => {
        const clone = original.clone();
        expect(original.getScale()).to.eql(clone.getScale());
        done();
      });
    });

    it('preserves width and height', (done) => {
      const original = new Icon({
        src: 'spec/ol/data/dot.png',
        width: 42,
        height: 24,
      });
      const clone = original.clone();
      clone.listenImageChange(() => {
        expect(clone.getWidth()).to.eql(42);
        expect(clone.getHeight()).to.eql(24);
        done();
      });
      clone.load();
    });

    it('the clone does not reference the same objects as the original', function () {
      const original = new Icon({
        anchor: [1, 0],
        color: [1, 2, 3, 0.4],
        src: src,
        offset: [1, 2],
        size: [10, 12],
        displacement: [5, 6],
      });
      const clone = original.clone();
      expect(original.getAnchor()).not.to.be(clone.getAnchor());
      expect(original.offset_).not.to.be(clone.offset_);
      expect(original.getColor()).not.to.be(clone.getColor());
      expect(original.getSize()).not.to.be(clone.getSize());
      expect(original.getDisplacement()).not.to.be(clone.getDisplacement());

      clone.anchor_[0] = 0;
      clone.offset_[0] = 0;
      clone.color_[0] = 0;
      clone.size_[0] = 5;
      clone.displacement_[0] = 10;
      expect(original.anchor_).not.to.eql(clone.anchor_);
      expect(original.offset_).not.to.eql(clone.offset_);
      expect(original.color_).not.to.eql(clone.color_);
      expect(original.size_).not.to.eql(clone.size_);
      expect(original.displacement_).not.to.eql(clone.displacement_);
    });

    it('autocalculated scale (due to width/height) does not halt cloning', () => {
      const original = new Icon({
        src: src,
        width: 10,
        height: 5,
      });
      let clone;
      expect(() => (clone = original.clone())).to.not.throwException();
      expect(original.getWidth()).to.eql(clone.getWidth());
      expect(original.getHeight()).to.eql(clone.getHeight());
      expect(original.getScale()).to.eql(clone.getScale());
    });
  });

  describe('#setSrc', function () {
    const newSrc = 'spec/ol/data/dot.png';

    it('changes the source of the icon (by changing the whole image)', function () {
      const icon = new Icon({
        src,
      });
      const oldIconImage = icon.iconImage_;
      icon.setSrc(newSrc);
      expect(icon.getSrc()).to.be(newSrc);
      expect(icon.iconImage_).to.not.be(oldIconImage);
    });

    it('loads the new image', function (done) {
      const icon = new Icon({
        src,
      });
      icon.setSrc(newSrc);
      expect(icon.getImageState()).to.be(ImageState.IDLE);
      icon.load();
      icon.listenImageChange(() => {
        expect(icon.getImageState()).to.be(ImageState.LOADED);
        done();
      });
    });
  });

  describe('#getAnchor', function () {
    const fractionAnchor = [0.25, 0.25];

    it('uses fractional units by default', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
      });
      expect(iconStyle.getAnchor()).to.eql([9, 12]);
    });

    it('uses pixels units', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: [2, 18],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
      });
      expect(iconStyle.getAnchor()).to.eql([2, 18]);
    });

    it('uses a bottom left anchor origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-left',
      });
      expect(iconStyle.getAnchor()).to.eql([9, 36]);
    });

    it('uses a bottom right anchor origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-right',
      });
      expect(iconStyle.getAnchor()).to.eql([27, 36]);
    });

    it('uses a top right anchor origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'top-right',
      });
      expect(iconStyle.getAnchor()).to.eql([27, 12]);
    });

    it('uses a top right anchor origin + displacement', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'top-right',
        displacement: [20, 10],
      });
      expect(iconStyle.getAnchor()).to.eql([
        size[0] * (1 - fractionAnchor[0]) - 20,
        size[1] * fractionAnchor[1] + 10,
      ]);
    });

    it('uses displacement', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        displacement: [20, 10],
      });
      expect(iconStyle.getAnchor()).to.eql([
        size[0] / 2 - 20,
        size[1] / 2 + 10,
      ]);
      iconStyle.setDisplacement([10, 20]);
      expect(iconStyle.getAnchor()).to.eql([
        size[0] / 2 - 10,
        size[1] / 2 + 20,
      ]);
    });

    it('scale applies to image size, not offset', function () {
      const scale = 4;
      let anchorScaled, anchorBig;

      const iconStyleScaled = new Icon({
        src: 'test.png',
        size: size,
        displacement: [20, 10],
        scale: scale,
      });
      const iconStyleBig = new Icon({
        src: 'test.png',
        size: [size[0] * scale, size[1] * scale],
        displacement: [20, 10],
      });
      anchorScaled = iconStyleScaled.getAnchor();
      anchorBig = iconStyleBig.getAnchor();
      expect(anchorScaled).to.eql([anchorBig[0] / scale, anchorBig[1] / scale]);

      iconStyleScaled.setDisplacement([10, 20]);
      iconStyleBig.setDisplacement([10, 20]);
      anchorScaled = iconStyleScaled.getAnchor();
      anchorBig = iconStyleBig.getAnchor();
      expect(anchorScaled).to.eql([anchorBig[0] / scale, anchorBig[1] / scale]);
    });
  });

  describe('#setAnchor', function () {
    it('resets the cached anchor', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: [0.25, 0.25],
      });
      expect(iconStyle.getAnchor()).to.eql([9, 12]);

      iconStyle.setAnchor([0.5, 0.5]);
      expect(iconStyle.getAnchor()).to.eql([18, 24]);
    });
  });

  describe('#getOrigin', function () {
    const offset = [16, 20];
    const imageSize = [144, 192];

    it('uses a top left offset origin (default)', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
      });
      expect(iconStyle.getOrigin()).to.eql([16, 20]);
    });

    it('uses a bottom left offset origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-left',
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).to.eql([16, 124]);
    });

    it('uses a bottom right offset origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-right',
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).to.eql([92, 124]);
    });

    it('uses a top right offset origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'top-right',
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).to.eql([92, 20]);
    });
  });

  describe('#getImageSize', function () {
    it('uses the cache', function (done) {
      const src = './spec/ol/data/dot.png';
      const iconImage = new IconImage(new Image(), src);
      iconImageCache.set(src, null, null, iconImage);
      iconImage.load();

      const iconStyle = new Icon({
        src: src,
      });
      iconImage.addEventListener('change', function changed() {
        if (iconImage.getImageState() === ImageState.LOADED) {
          iconImage.removeEventListener('change', changed);
          try {
            expect(iconStyle.getImage()).to.eql(iconImage.getImage());
            expect(iconStyle.getImage()).to.be.a(HTMLImageElement);
            expect(iconStyle.getImageSize()).to.eql([
              iconStyle.getImage().width,
              iconStyle.getImage().height,
            ]);
            done();
          } catch (e) {
            done(e);
          }
        }
      });
    });

    it('has the image size after the image has finished loading', function (done) {
      const image = new Image();
      const iconStyle = new Icon({
        img: image,
      });
      iconStyle.iconImage_.addEventListener('change', function changed() {
        if (iconStyle.getImageState() === ImageState.LOADED) {
          iconStyle.iconImage_.removeEventListener('change', changed);
          try {
            expect(iconStyle.getImageSize()).to.eql([
              image.width,
              image.height,
            ]);
            done();
          } catch (e) {
            done(e);
          }
        }
      });
      image.src = './spec/ol/data/dot.png';
      iconStyle.load();
    });
  });

  describe('#width/height', function () {
    // 3px * 4px sized white gif
    const src =
      'data:image/gif;base64,' +
      'R0lGODlhAwAEAIABAP7+/vDy9SH+EUNyZWF0ZWQgd2l0aCBHSU1QACH5BAEKAAEALAAAAAADAAQAAAIDhI9WADs=';
    it('scale is set correctly if configured with width only', function (done) {
      const iconStyle = new Icon({
        src,
        width: 6,
      });
      const iconImage = iconStyle.iconImage_;
      iconImage.addEventListener('change', function () {
        expect(iconStyle.getScale()).to.eql(2);
        done();
      });
      iconStyle.load();
    });
    it('scale is set correctly if configured with height only', function (done) {
      const iconStyle = new Icon({
        src,
        height: 12,
      });
      const iconImage = iconStyle.iconImage_;
      iconImage.addEventListener('change', function () {
        expect(iconStyle.getScale()).to.eql(3);
        done();
      });
      iconStyle.load();
    });
    it('scale is set correctly if used with width and height', function (done) {
      const iconStyle = new Icon({
        src,
        width: 6,
        height: 12,
      });
      const iconImage = iconStyle.iconImage_;
      iconImage.addEventListener('change', function () {
        expect(iconStyle.getScale()).to.eql([2, 3]);
        done();
      });
      iconStyle.load();
    });
    it('getWidth returns the expected value', function (done) {
      const iconStyle = new Icon({
        src,
        width: 10,
      });
      iconStyle.listenImageChange(() => {
        expect(iconStyle.getWidth()).to.eql(10);
        done();
      });
      iconStyle.load();
    });
    it('getHeight returns the expected value', function (done) {
      const iconStyle = new Icon({
        src,
        height: 20,
      });
      iconStyle.listenImageChange(() => {
        expect(iconStyle.getHeight()).to.eql(20);
        done();
      });
      iconStyle.load();
    });
    it('setScale updates the width and height', function (done) {
      const iconStyle = new Icon({
        src,
      });
      const iconImage = iconStyle.iconImage_;
      iconImage.addEventListener('change', function () {
        iconStyle.setScale(2);
        expect(iconStyle.getWidth()).to.eql(6);
        expect(iconStyle.getHeight()).to.eql(8);
        done();
      });
      iconStyle.load();
    });
    it('setScale with array updates the width and height', function (done) {
      const iconStyle = new Icon({
        src,
      });
      const iconImage = iconStyle.iconImage_;
      iconImage.addEventListener('change', function () {
        iconStyle.setScale([3, 4]);
        expect(iconStyle.getWidth()).to.eql(9);
        expect(iconStyle.getHeight()).to.eql(16);
        done();
      });
      iconStyle.load();
    });
    it('setScale overrides initial width and height', function (done) {
      const iconStyle = new Icon({
        src,
        width: 42,
        height: 24,
      });
      iconStyle.setScale(1);
      iconStyle.listenImageChange(() => {
        try {
          expect(iconStyle.getWidth()).to.eql(3);
          expect(iconStyle.getHeight()).to.eql(4);
          expect(iconStyle.getScale()).to.eql(1);
          done();
        } catch (e) {
          done(e);
        }
      });
      iconStyle.load();
    });
  });
});
