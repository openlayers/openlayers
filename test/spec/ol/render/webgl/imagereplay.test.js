

goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.Point');
goog.require('ol.render.webgl.ImageReplay');
goog.require('ol.style.Image');

describe('ol.render.webgl.ImageReplay', function() {
  var replay;

  var createImageStyle = function(image) {
    var imageStyle = new ol.style.Image({
      opacity: 0.1,
      rotateWithView: true,
      rotation: 1.5,
      scale: 2.0
    });
    imageStyle.getAnchor = function() {
      return [0.5, 1];
    };
    imageStyle.getImage = function() {
      return image;
    };
    imageStyle.getHitDetectionImage = function() {
      return image;
    };
    imageStyle.getImageSize = function() {
      return [512, 512];
    };
    imageStyle.getHitDetectionImageSize = function() {
      return [512, 512];
    };
    imageStyle.getOrigin = function() {
      return [200, 200];
    };
    imageStyle.getSize = function() {
      return [256, 256];
    };
    return imageStyle;
  };

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.ImageReplay(tolerance, maxExtent);
  });

  describe('#setImageStyle', function() {

    var imageStyle1, imageStyle2;

    beforeEach(function() {
      imageStyle1 = createImageStyle(new Image());
      imageStyle2 = createImageStyle(new Image());
    });

    it('set expected states', function() {
      replay.setImageStyle(imageStyle1);
      expect(replay.anchorX).to.be(0.5);
      expect(replay.anchorY).to.be(1);
      expect(replay.height).to.be(256);
      expect(replay.imageHeight).to.be(512);
      expect(replay.imageWidth).to.be(512);
      expect(replay.opacity).to.be(0.1);
      expect(replay.originX).to.be(200);
      expect(replay.originY).to.be(200);
      expect(replay.rotation).to.be(1.5);
      expect(replay.rotateWithView).to.be(true);
      expect(replay.scale).to.be(2.0);
      expect(replay.width).to.be(256);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices).to.have.length(0);
      expect(replay.hitDetectionImages_).to.have.length(1);
      expect(replay.hitDetectionGroupIndices).to.have.length(0);

      replay.setImageStyle(imageStyle1);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices).to.have.length(0);
      expect(replay.hitDetectionImages_).to.have.length(1);
      expect(replay.hitDetectionGroupIndices).to.have.length(0);

      replay.setImageStyle(imageStyle2);
      expect(replay.images_).to.have.length(2);
      expect(replay.groupIndices).to.have.length(1);
      expect(replay.hitDetectionImages_).to.have.length(2);
      expect(replay.hitDetectionGroupIndices).to.have.length(1);
    });
  });

  describe('#drawPoint', function() {
    beforeEach(function() {
      var imageStyle = createImageStyle(new Image());
      replay.setImageStyle(imageStyle);
    });

    it('sets the buffer data', function() {
      var point;

      point = new ol.geom.Point([1000, 2000]);
      replay.drawPoint(point, null);
      expect(replay.vertices).to.have.length(32);
      expect(replay.indices).to.have.length(6);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);

      point = new ol.geom.Point([2000, 3000]);
      replay.drawPoint(point, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);
    });
  });

  describe('#drawMultiPoint', function() {
    beforeEach(function() {
      var imageStyle = createImageStyle(new Image());
      replay.setImageStyle(imageStyle);
    });

    it('sets the buffer data', function() {
      var multiPoint;

      multiPoint = new ol.geom.MultiPoint(
          [[1000, 2000], [2000, 3000]]);
      replay.drawMultiPoint(multiPoint, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);

      multiPoint = new ol.geom.MultiPoint(
          [[3000, 4000], [4000, 5000]]);
      replay.drawMultiPoint(multiPoint, null);
      expect(replay.vertices).to.have.length(128);
      expect(replay.indices).to.have.length(24);
      expect(replay.indices[12]).to.be(8);
      expect(replay.indices[13]).to.be(9);
      expect(replay.indices[14]).to.be(10);
      expect(replay.indices[15]).to.be(8);
      expect(replay.indices[16]).to.be(10);
      expect(replay.indices[17]).to.be(11);
      expect(replay.indices[18]).to.be(12);
      expect(replay.indices[19]).to.be(13);
      expect(replay.indices[20]).to.be(14);
      expect(replay.indices[21]).to.be(12);
      expect(replay.indices[22]).to.be(14);
      expect(replay.indices[23]).to.be(15);
    });
  });

  describe('#getTextures', function() {
    beforeEach(function() {
      replay.textures_ = [1, 2];
      replay.hitDetectionTextures_ = [3, 4];
    });

    it('returns the textures', function() {
      var textures = replay.getTextures();

      expect(textures).to.have.length(2);
      expect(textures[0]).to.be(1);
      expect(textures[1]).to.be(2);
    });

    it('can additionally return the hit detection textures', function() {
      var textures = replay.getTextures(true);

      expect(textures).to.have.length(4);
      expect(textures[0]).to.be(1);
      expect(textures[1]).to.be(2);
      expect(textures[2]).to.be(3);
      expect(textures[3]).to.be(4);
    });
  });

  describe('#getHitDetectionTextures', function() {
    beforeEach(function() {
      replay.textures_ = [1, 2];
      replay.hitDetectionTextures_ = [3, 4];
    });

    it('returns the hit detection textures', function() {
      var textures = replay.getHitDetectionTextures();

      expect(textures).to.have.length(2);
      expect(textures[0]).to.be(3);
      expect(textures[1]).to.be(4);
    });
  });
});
