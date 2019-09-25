import {getUid} from '../../../../src/ol/util.js';
import {shared as iconImageCache} from '../../../../src/ol/style/IconImageCache.js';
import Icon from '../../../../src/ol/style/Icon.js';
import IconImage, {get as getIconImage} from '../../../../src/ol/style/IconImage.js';


describe('ol.style.Icon', () => {
  const size = [36, 48];
  const src = 'data:image/gif;base64,' +
      'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

  describe('constructor', () => {

    test('caches canvas images with a uid as src', () => {
      const canvas = document.createElement('canvas');
      new Icon({
        img: canvas,
        imgSize: size
      });
      expect(getIconImage(canvas, getUid(canvas), size, '').getImage()).toEqual(canvas);
    });

    test('imgSize overrides img.width and img.height', done => {
      const style = new Icon({
        src: src,
        imgSize: size
      });
      const iconImage = style.iconImage_;
      iconImage.addEventListener('change', function() {
        expect([iconImage.image_.width, iconImage.image_.height]).toEqual(size);
        done();
      });
      style.load();
    });

  });

  describe('#clone', () => {

    test('creates a new ol.style.Icon', () => {
      const original = new Icon({
        src: src
      });
      const clone = original.clone();
      expect(clone).toBeInstanceOf(Icon);
      expect(clone).not.toBe(original);
    });

    test('copies all values ', () => {
      const canvas = document.createElement('canvas');
      const original = new Icon({
        anchor: [1, 0],
        anchorOrigin: 'bottom-right',
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        color: '#319FD3',
        crossOrigin: 'Anonymous',
        img: canvas,
        imgSize: size,
        offset: [1, 2],
        offsetOrigin: 'bottom-left',
        opacity: 0.5,
        scale: 2,
        rotation: 4,
        size: [10, 12]
      });

      const clone = original.clone();
      expect(original.getImage(1)).toBe(clone.getImage(1));
      expect(original.iconImage_).toBe(clone.iconImage_);
      expect(original.getAnchor()).toEqual(clone.getAnchor());
      expect(original.anchorOrigin_).toEqual(clone.anchorOrigin_);
      expect(original.anchorXUnits_).toEqual(clone.anchorXUnits_);
      expect(original.anchorYUnits_).toEqual(clone.anchorYUnits_);
      expect(original.crossOrigin_).toEqual(clone.crossOrigin_);
      expect(original.getColor()).toEqual(clone.getColor());
      expect(original.offset_).toEqual(clone.offset_);
      expect(original.offsetOrigin_).toEqual(clone.offsetOrigin_);
      expect(original.getSize()).toEqual(clone.getSize());
      expect(original.getSrc()).toEqual(clone.getSrc());
      expect(original.getOpacity()).toEqual(clone.getOpacity());
      expect(original.getRotation()).toEqual(clone.getRotation());
      expect(original.getRotateWithView()).toEqual(clone.getRotateWithView());

      const original2 = new Icon({
        src: src
      });
      const clone2 = original2.clone();
      expect(original2.getImage(1)).toBe(clone2.getImage(1));
      expect(original2.iconImage_).toBe(clone2.iconImage_);
      expect(original2.getSrc()).toEqual(clone2.getSrc());
    });

    test(
      'the clone does not reference the same objects as the original',
      () => {
        const original = new Icon({
          anchor: [1, 0],
          color: [1, 2, 3, 0.4],
          src: src,
          offset: [1, 2],
          size: [10, 12]
        });
        const clone = original.clone();
        expect(original.getAnchor()).not.toBe(clone.getAnchor());
        expect(original.offset_).not.toBe(clone.offset_);
        expect(original.getColor()).not.toBe(clone.getColor());
        expect(original.getSize()).not.toBe(clone.getSize());

        clone.anchor_[0] = 0;
        clone.offset_[0] = 0;
        clone.color_[0] = 0;
        clone.size_[0] = 5;
        expect(original.anchor_).not.toEqual(clone.anchor_);
        expect(original.offset_).not.toEqual(clone.offset_);
        expect(original.color_).not.toEqual(clone.color_);
        expect(original.size_).not.toEqual(clone.size_);
      }
    );
  });

  describe('#getAnchor', () => {
    const fractionAnchor = [0.25, 0.25];

    test('uses fractional units by default', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor
      });
      expect(iconStyle.getAnchor()).toEqual([9, 12]);
    });

    test('uses pixels units', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: [2, 18],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels'
      });
      expect(iconStyle.getAnchor()).toEqual([2, 18]);
    });

    test('uses a bottom left anchor origin', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-left'
      });
      expect(iconStyle.getAnchor()).toEqual([9, 36]);
    });

    test('uses a bottom right anchor origin', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-right'
      });
      expect(iconStyle.getAnchor()).toEqual([27, 36]);
    });

    test('uses a top right anchor origin', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'top-right'
      });
      expect(iconStyle.getAnchor()).toEqual([27, 12]);
    });
  });

  describe('#setAnchor', () => {
    test('resets the cached anchor', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        anchor: [0.25, 0.25]
      });
      expect(iconStyle.getAnchor()).toEqual([9, 12]);

      iconStyle.setAnchor([0.5, 0.5]);
      expect(iconStyle.getAnchor()).toEqual([18, 24]);
    });
  });

  describe('#getOrigin', () => {
    const offset = [16, 20];
    const imageSize = [144, 192];

    test('uses a top left offset origin (default)', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset
      });
      expect(iconStyle.getOrigin()).toEqual([16, 20]);
    });

    test('uses a bottom left offset origin', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-left'
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).toEqual([16, 124]);
    });

    test('uses a bottom right offset origin', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-right'
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).toEqual([92, 124]);
    });

    test('uses a top right offset origin', () => {
      const iconStyle = new Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'top-right'
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).toEqual([92, 20]);
    });
  });

  describe('#getImageSize', () => {
    const imgSize = [144, 192];

    test('takes the real image size', () => {
      // pretend that the image is already in the cache,
      // this image will be used for the icon.
      const src = 'test.png';
      const iconImage = new IconImage(null, 'test.png', imgSize);
      iconImageCache.set(src, null, null, iconImage);

      const iconStyle = new Icon({
        src: 'test.png'
      });
      expect(iconStyle.getImageSize()).toEqual(imgSize);
    });

    test('uses the given image size', () => {
      const iconStyle = new Icon({
        img: {src: 'test.png'},
        imgSize: imgSize
      });
      expect(iconStyle.getImageSize()).toEqual(imgSize);
    });
  });
});
