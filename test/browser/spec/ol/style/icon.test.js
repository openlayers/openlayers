import {assert} from 'chai';
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
      assert.deepEqual(getIconImage(canvas, getUid(canvas)).getImage(), canvas);
    });

    it('set referrerPolicy on image elements', function () {
      const referrerPolicy = 'no-referrer';
      const iconStyle = new Icon({
        src,
        referrerPolicy,
      });
      assert.strictEqual(
        iconStyle.iconImage_.getImage().referrerPolicy,
        referrerPolicy,
      );
    });
  });

  describe('#clone', function () {
    it('creates a new ol.style.Icon', function () {
      const original = new Icon({
        src: src,
      });
      const clone = original.clone();
      assert.instanceOf(clone, Icon);
      assert.notEqual(clone, original);
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
        referrerPolicy: 'no-referrer',
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
      assert.strictEqual(original.getImage(1), clone.getImage(1));
      assert.strictEqual(original.iconImage_, clone.iconImage_);
      assert.deepEqual(original.getAnchor(), clone.getAnchor());
      assert.deepEqual(original.anchorOrigin_, clone.anchorOrigin_);
      assert.deepEqual(original.anchorXUnits_, clone.anchorXUnits_);
      assert.deepEqual(original.anchorYUnits_, clone.anchorYUnits_);
      assert.deepEqual(original.crossOrigin_, clone.crossOrigin_);
      assert.deepEqual(original.referrerPolicy_, clone.referrerPolicy_);
      assert.deepEqual(original.getColor(), clone.getColor());
      assert.deepEqual(original.offset_, clone.offset_);
      assert.deepEqual(original.offsetOrigin_, clone.offsetOrigin_);
      assert.deepEqual(original.getScale(), clone.getScale());
      assert.deepEqual(original.getSize(), clone.getSize());
      assert.deepEqual(original.getSrc(), clone.getSrc());
      assert.deepEqual(original.getOpacity(), clone.getOpacity());
      assert.deepEqual(original.getRotation(), clone.getRotation());
      assert.deepEqual(original.getRotateWithView(), clone.getRotateWithView());
      assert.deepEqual(original.getDisplacement(), clone.getDisplacement());
      assert.deepEqual(original.getDeclutterMode(), clone.getDeclutterMode());
    });
    it('copies all values with src', function () {
      const original = new Icon({
        src: src,
      });
      const clone = original.clone();
      assert.strictEqual(original.getImage(1), clone.getImage(1));
      assert.strictEqual(original.iconImage_, clone.iconImage_);
      assert.strictEqual(original.getSrc(), clone.getSrc());
    });
    it('copies all values with src without shared IconImageCache', () =>
      new Promise((resolve) => {
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
          assert.strictEqual(original.getSrc(), clone.getSrc());
          assert.notEqual(original.iconImage_, clone.iconImage_);
          assert.strictEqual(
            original.getImage(1).width,
            clone.getImage(1).width,
          );
          assert.strictEqual(
            original.getImage(1).height,
            clone.getImage(1).height,
          );
          resolve();
        });
      }));

    it('preserves the scale', () =>
      new Promise((resolve) => {
        const original = new Icon({
          src: 'spec/ol/data/dot.png',
        });
        original.setScale(2);
        assert.strictEqual(original.getScale(), 2);
        const clone = original.clone();
        assert.deepEqual(original.getScale(), clone.getScale());
        original.load();
        original.getImage(1).addEventListener('load', () => {
          const clone = original.clone();
          assert.deepEqual(original.getScale(), clone.getScale());
          resolve();
        });
      }));

    it('preserves width and height', () =>
      new Promise((resolve) => {
        const original = new Icon({
          src: 'spec/ol/data/dot.png',
          width: 42,
          height: 24,
        });
        const clone = original.clone();
        clone.listenImageChange(() => {
          assert.deepEqual(clone.getWidth(), 42);
          assert.deepEqual(clone.getHeight(), 24);
          resolve();
        });
        clone.load();
      }));

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
      assert.notEqual(original.getAnchor(), clone.getAnchor());
      assert.notEqual(original.offset_, clone.offset_);
      assert.notEqual(original.getColor(), clone.getColor());
      assert.notEqual(original.getSize(), clone.getSize());
      assert.notEqual(original.getDisplacement(), clone.getDisplacement());

      clone.anchor_[0] = 0;
      clone.offset_[0] = 0;
      clone.color_[0] = 0;
      clone.size_[0] = 5;
      clone.displacement_[0] = 10;
      assert.notDeepEqual(original.anchor_, clone.anchor_);
      assert.notDeepEqual(original.offset_, clone.offset_);
      assert.notDeepEqual(original.color_, clone.color_);
      assert.notDeepEqual(original.size_, clone.size_);
      assert.notDeepEqual(original.displacement_, clone.displacement_);
    });

    it('autocalculated scale (due to width/height) does not halt cloning', () => {
      const original = new Icon({
        src: src,
        width: 10,
        height: 5,
      });
      let clone;
      assert.doesNotThrow(() => (clone = original.clone()));
      assert.deepEqual(original.getWidth(), clone.getWidth());
      assert.deepEqual(original.getHeight(), clone.getHeight());
      assert.deepEqual(original.getScale(), clone.getScale());
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
      assert.strictEqual(icon.getSrc(), newSrc);
      assert.notEqual(icon.iconImage_, oldIconImage);
    });

    it('loads the new image', () =>
      new Promise((resolve) => {
        const icon = new Icon({
          src,
        });
        icon.setSrc(newSrc);
        assert.strictEqual(icon.getImageState(), ImageState.IDLE);
        icon.load();
        icon.listenImageChange(() => {
          assert.strictEqual(icon.getImageState(), ImageState.LOADED);
          resolve();
        });
      }));
  });

  describe('#getAnchor', function () {
    const fractionAnchor = [0.25, 0.25];

    it('uses fractional units by default', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
      });
      assert.deepEqual(iconStyle.getAnchor(), [9, 12]);
    });

    it('uses pixels units', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: [2, 18],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
      });
      assert.deepEqual(iconStyle.getAnchor(), [2, 18]);
    });

    it('uses a bottom left anchor origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-left',
      });
      assert.deepEqual(iconStyle.getAnchor(), [9, 36]);
    });

    it('uses a bottom right anchor origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-right',
      });
      assert.deepEqual(iconStyle.getAnchor(), [27, 36]);
    });

    it('uses a top right anchor origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'top-right',
      });
      assert.deepEqual(iconStyle.getAnchor(), [27, 12]);
    });

    it('uses a top right anchor origin + displacement', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'top-right',
        displacement: [20, 10],
      });
      assert.deepEqual(iconStyle.getAnchor(), [
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
      assert.deepEqual(iconStyle.getAnchor(), [
        size[0] / 2 - 20,
        size[1] / 2 + 10,
      ]);
      iconStyle.setDisplacement([10, 20]);
      assert.deepEqual(iconStyle.getAnchor(), [
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
      assert.deepEqual(anchorScaled, [
        anchorBig[0] / scale,
        anchorBig[1] / scale,
      ]);

      iconStyleScaled.setDisplacement([10, 20]);
      iconStyleBig.setDisplacement([10, 20]);
      anchorScaled = iconStyleScaled.getAnchor();
      anchorBig = iconStyleBig.getAnchor();
      assert.deepEqual(anchorScaled, [
        anchorBig[0] / scale,
        anchorBig[1] / scale,
      ]);
    });
  });

  describe('#setAnchor', function () {
    it('resets the cached anchor', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: [0.25, 0.25],
      });
      assert.deepEqual(iconStyle.getAnchor(), [9, 12]);

      iconStyle.setAnchor([0.5, 0.5]);
      assert.deepEqual(iconStyle.getAnchor(), [18, 24]);
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
      assert.deepEqual(iconStyle.getOrigin(), [16, 20]);
    });

    it('uses a bottom left offset origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-left',
      });
      iconStyle.iconImage_.size_ = imageSize;
      assert.deepEqual(iconStyle.getOrigin(), [16, 124]);
    });

    it('uses a bottom right offset origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-right',
      });
      iconStyle.iconImage_.size_ = imageSize;
      assert.deepEqual(iconStyle.getOrigin(), [92, 124]);
    });

    it('uses a top right offset origin', function () {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'top-right',
      });
      iconStyle.iconImage_.size_ = imageSize;
      assert.deepEqual(iconStyle.getOrigin(), [92, 20]);
    });
  });

  describe('#getImageSize', function () {
    it('uses the cache', () =>
      new Promise((resolve, reject) => {
        const src = './spec/ol/data/dot.png';
        const iconImage = new IconImage(new Image(), src);
        iconImageCache.set(src, null, iconImage);
        iconImage.load();

        const iconStyle = new Icon({
          src: src,
        });
        iconImage.addEventListener('change', function changed() {
          if (iconImage.getImageState() === ImageState.LOADED) {
            iconImage.removeEventListener('change', changed);
            try {
              assert.deepEqual(iconStyle.getImage(), iconImage.getImage());
              assert.instanceOf(iconStyle.getImage(), HTMLImageElement);
              assert.deepEqual(iconStyle.getImageSize(), [
                iconStyle.getImage().width,
                iconStyle.getImage().height,
              ]);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      }));

    it('has the image size after the image has finished loading', () =>
      new Promise((resolve, reject) => {
        const image = new Image();
        const iconStyle = new Icon({
          img: image,
        });
        iconStyle.iconImage_.addEventListener('change', function changed() {
          if (iconStyle.getImageState() === ImageState.LOADED) {
            iconStyle.iconImage_.removeEventListener('change', changed);
            try {
              assert.deepEqual(iconStyle.getImageSize(), [
                image.width,
                image.height,
              ]);
              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
        image.src = './spec/ol/data/dot.png';
        iconStyle.load();
      }));
  });

  describe('#width/height', function () {
    // 3px * 4px sized white gif
    const src =
      'data:image/gif;base64,' +
      'R0lGODlhAwAEAIABAP7+/vDy9SH+EUNyZWF0ZWQgd2l0aCBHSU1QACH5BAEKAAEALAAAAAADAAQAAAIDhI9WADs=';
    it('scale is set correctly if configured with width only', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
          width: 6,
        });
        const iconImage = iconStyle.iconImage_;
        iconImage.addEventListener('change', function () {
          assert.deepEqual(iconStyle.getScale(), 2);
          resolve();
        });
        iconStyle.load();
      }));
    it('scale is set correctly if configured with height only', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
          height: 12,
        });
        const iconImage = iconStyle.iconImage_;
        iconImage.addEventListener('change', function () {
          assert.deepEqual(iconStyle.getScale(), 3);
          resolve();
        });
        iconStyle.load();
      }));
    it('scale is set correctly if used with width and height', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
          width: 6,
          height: 12,
        });
        const iconImage = iconStyle.iconImage_;
        iconImage.addEventListener('change', function () {
          assert.deepEqual(iconStyle.getScale(), [2, 3]);
          resolve();
        });
        iconStyle.load();
      }));
    it('getWidth returns the expected value', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
          width: 10,
        });
        iconStyle.listenImageChange(() => {
          assert.deepEqual(iconStyle.getWidth(), 10);
          resolve();
        });
        iconStyle.load();
      }));
    it('getHeight returns the expected value', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
          height: 20,
        });
        iconStyle.listenImageChange(() => {
          assert.deepEqual(iconStyle.getHeight(), 20);
          resolve();
        });
        iconStyle.load();
      }));
    it('setScale updates the width and height', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
        });
        const iconImage = iconStyle.iconImage_;
        iconImage.addEventListener('change', function () {
          iconStyle.setScale(2);
          assert.deepEqual(iconStyle.getWidth(), 6);
          assert.deepEqual(iconStyle.getHeight(), 8);
          resolve();
        });
        iconStyle.load();
      }));
    it('setScale with array updates the width and height', () =>
      new Promise((resolve) => {
        const iconStyle = new Icon({
          src,
        });
        const iconImage = iconStyle.iconImage_;
        iconImage.addEventListener('change', function () {
          iconStyle.setScale([3, 4]);
          assert.deepEqual(iconStyle.getWidth(), 9);
          assert.deepEqual(iconStyle.getHeight(), 16);
          resolve();
        });
        iconStyle.load();
      }));
    it('setScale overrides initial width and height', () =>
      new Promise((resolve, reject) => {
        const iconStyle = new Icon({
          src,
          width: 42,
          height: 24,
        });
        iconStyle.setScale(1);
        iconStyle.listenImageChange(() => {
          try {
            assert.deepEqual(iconStyle.getWidth(), 3);
            assert.deepEqual(iconStyle.getHeight(), 4);
            assert.deepEqual(iconStyle.getScale(), 1);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        iconStyle.load();
      }));
  });
});
