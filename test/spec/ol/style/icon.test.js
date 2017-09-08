

goog.require('ol');
goog.require('ol.style');
goog.require('ol.style.Icon');
goog.require('ol.style.IconImage');


describe('ol.style.Icon', function() {
  var size = [36, 48];
  var src = 'data:image/gif;base64,' +
      'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

  describe('constructor', function() {

    it('caches canvas images with a uid as src', function() {
      var canvas = document.createElement('canvas');
      new ol.style.Icon({
        img: canvas,
        imgSize: size
      });
      expect(ol.style.IconImage.get(
          canvas, ol.getUid(canvas), size, '').getImage()).to.eql(canvas);
    });

    it('imgSize overrides img.width and img.height', function(done) {
      var style = new ol.style.Icon({
        src: src,
        imgSize: size
      });
      var iconImage = style.iconImage_;
      iconImage.addEventListener('change', function() {
        expect([iconImage.image_.width, iconImage.image_.height]).to.eql(size);
        done();
      });
      style.load();
    });

  });

  describe('#clone', function() {

    it('creates a new ol.style.Icon', function() {
      var original = new ol.style.Icon({
        src: src
      });
      var clone = original.clone();
      expect(clone).to.be.an(ol.style.Icon);
      expect(clone).to.not.be(original);
    });

    it('copies all values ', function() {
      var canvas = document.createElement('canvas');
      var original = new ol.style.Icon({
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
        snapToPixel: false,
        rotation: 4,
        size: [10, 12]
      });

      var clone = original.clone();
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
      expect(original.getSize()).to.eql(clone.getSize());
      expect(original.getSrc()).to.eql(clone.getSrc());
      expect(original.getOpacity()).to.eql(clone.getOpacity());
      expect(original.getRotation()).to.eql(clone.getRotation());
      expect(original.getRotateWithView()).to.eql(clone.getRotateWithView());
      expect(original.getSnapToPixel()).to.eql(clone.getSnapToPixel());

      var original2 = new ol.style.Icon({
        src: src
      });
      var clone2 = original2.clone();
      expect(original2.getImage(1)).to.be(clone2.getImage(1));
      expect(original2.iconImage_).to.be(clone2.iconImage_);
      expect(original2.getSrc()).to.eql(clone2.getSrc());
    });

    it('the clone does not reference the same objects as the original', function() {
      var original = new ol.style.Icon({
        anchor: [1, 0],
        color: [1, 2, 3, 0.4],
        src: src,
        offset: [1, 2],
        size: [10, 12]
      });
      var clone = original.clone();
      expect(original.getAnchor()).not.to.be(clone.getAnchor());
      expect(original.offset_).not.to.be(clone.offset_);
      expect(original.getColor()).not.to.be(clone.getColor());
      expect(original.getSize()).not.to.be(clone.getSize());

      clone.anchor_[0] = 0;
      clone.offset_[0] = 0;
      clone.color_[0] = 0;
      clone.size_[0] = 5;
      expect(original.anchor_).not.to.eql(clone.anchor_);
      expect(original.offset_).not.to.eql(clone.offset_);
      expect(original.color_).not.to.eql(clone.color_);
      expect(original.size_).not.to.eql(clone.size_);
    });
  });

  describe('#getAnchor', function() {
    var fractionAnchor = [0.25, 0.25];

    it('uses fractional units by default', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor
      });
      expect(iconStyle.getAnchor()).to.eql([9, 12]);
    });

    it('uses pixels units', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        anchor: [2, 18],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels'
      });
      expect(iconStyle.getAnchor()).to.eql([2, 18]);
    });

    it('uses a bottom left anchor origin', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-left'
      });
      expect(iconStyle.getAnchor()).to.eql([9, 36]);
    });

    it('uses a bottom right anchor origin', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'bottom-right'
      });
      expect(iconStyle.getAnchor()).to.eql([27, 36]);
    });

    it('uses a top right anchor origin', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        anchor: fractionAnchor,
        anchorOrigin: 'top-right'
      });
      expect(iconStyle.getAnchor()).to.eql([27, 12]);
    });
  });

  describe('#getOrigin', function() {
    var offset = [16, 20];
    var imageSize = [144, 192];

    it('uses a top left offset origin (default)', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        offset: offset
      });
      expect(iconStyle.getOrigin()).to.eql([16, 20]);
    });

    it('uses a bottom left offset origin', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-left'
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).to.eql([16, 124]);
    });

    it('uses a bottom right offset origin', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'bottom-right'
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).to.eql([92, 124]);
    });

    it('uses a top right offset origin', function() {
      var iconStyle = new ol.style.Icon({
        src: 'test.png',
        size: size,
        offset: offset,
        offsetOrigin: 'top-right'
      });
      iconStyle.iconImage_.size_ = imageSize;
      expect(iconStyle.getOrigin()).to.eql([92, 20]);
    });
  });

  describe('#getImageSize', function() {
    var imgSize = [144, 192];

    it('takes the real image size', function() {
      // pretend that the image is already in the cache,
      // this image will be used for the icon.
      var cache = ol.style.iconImageCache;
      var src = 'test.png';
      var iconImage = new ol.style.IconImage(null, 'test.png', imgSize);
      cache.set(src, null, null, iconImage);

      var iconStyle = new ol.style.Icon({
        src: 'test.png'
      });
      expect(iconStyle.getImageSize()).to.eql(imgSize);
    });

    it('uses the given image size', function() {
      var iconStyle = new ol.style.Icon({
        img: {src: 'test.png'},
        imgSize: imgSize
      });
      expect(iconStyle.getImageSize()).to.eql(imgSize);
    });
  });
});
