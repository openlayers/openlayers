goog.provide('ol.test.render.webgl.TextReplay');

goog.require('ol.dom');
goog.require('ol.render.webgl.TextReplay');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Text');

describe('ol.render.webgl.TextReplay', function() {
  var replay;

  var createTextStyle = function(fillStyle, strokeStyle, text) {
    var textStyle = new ol.style.Text({
      rotateWithView: true,
      rotation: 1.5,
      scale: 2,
      textAlign: 'left',
      textBaseline: 'top',
      font: '12px Arial',
      offsetX: 10,
      offsetY: 10,
      text: text,
      fill: fillStyle,
      stroke: strokeStyle
    });
    return textStyle;
  };

  beforeEach(function() {
    var tolerance = 0.1;
    var maxExtent = [-10000, -20000, 10000, 20000];
    replay = new ol.render.webgl.TextReplay(tolerance, maxExtent);
  });

  describe('#setTextStyle', function() {

    var textStyle1, textStyle2, textStyle3, textStyle4;

    beforeEach(function() {
      textStyle1 = createTextStyle(
        new ol.style.Fill({
          color: [0, 0, 0, 1]
        }),
        new ol.style.Stroke({
          width: 1,
          color: [0, 0, 0, 1],
          lineCap: 'butt',
          lineJoin: 'bevel',
          lineDash: [5, 5],
          lineDashOffset: 15,
          miterLimit: 2
        }),
        'someText');
      textStyle2 = createTextStyle(
        new ol.style.Fill({
          color: [255, 255, 255, 1]
        }),
        new ol.style.Stroke({
          width: 1,
          color: [255, 255, 255, 1]
        }),
        'someText'
      );
      textStyle3 = createTextStyle(null, null, 'someText');
      textStyle4 = createTextStyle(
        new ol.style.Fill({
          color: [0, 0, 0, 1]
        }),
        new ol.style.Stroke({
          width: 1,
          color: [0, 0, 0, 1]
        }),
        ''
      );
    });

    it('set expected states', function() {
      var mCtx = ol.dom.createCanvasContext2D(0, 0);
      mCtx.font = '12px Arial';
      var mWidth = mCtx.measureText('M').width;
      var textWidth = mCtx.measureText('someText').width;
      var width = Math.ceil((textWidth + 2) * 2);
      var height = Math.ceil(Math.round(mWidth * 1.2 + 2) * 2);

      replay.setTextStyle(textStyle1);
      expect(replay.anchorX).to.be(10);
      expect(replay.anchorY).to.be(10);
      expect(replay.height).to.be(height);
      expect(replay.imageHeight).to.be(height);
      expect(replay.width).to.be(width);
      expect(replay.imageWidth).to.be(width);
      expect(replay.opacity).to.be(1);
      expect(replay.originX).to.be(0);
      expect(replay.originY).to.be(0);
      expect(replay.rotation).to.be(1.5);
      expect(replay.rotateWithView).to.be(true);
      expect(replay.scale).to.be(1);
      expect(replay.images_).to.have.length(1);
      expect(replay.groupIndices).to.have.length(0);

      expect(replay.state_.fillColor).to.be('rgba(0,0,0,1)');
      expect(replay.state_.strokeColor).to.be('rgba(0,0,0,1)');
      expect(replay.state_.scale).to.be(2);
      expect(replay.state_.lineWidth).to.be(1);
      expect(replay.state_.lineJoin).to.be('bevel');
      expect(replay.state_.lineCap).to.be('butt');
      expect(replay.state_.lineDash).to.eql([5, 5]);
      expect(replay.state_.lineDashOffset).to.be(15);
      expect(replay.state_.miterLimit).to.be(2);
      expect(replay.state_.font).to.be('12px Arial');
      expect(replay.state_.text).to.be('someText');

      replay.setTextStyle(textStyle2);
      expect(replay.images_).to.have.length(2);
      expect(replay.groupIndices).to.have.length(1);
    });

    it('does not create an image, if an empty text is supplied', function() {
      replay.setTextStyle(textStyle4);
      expect(replay.state_.text).to.be('');
      expect(replay.images_).to.have.length(0);
      expect(replay.groupIndices).to.have.length(0);
    });

    it('does not create an image, if both fill and stroke styles are missing', function() {
      replay.setTextStyle(textStyle3);
      expect(replay.state_.text).to.be('');
      expect(replay.images_).to.have.length(0);
      expect(replay.groupIndices).to.have.length(0);
    });
  });

  describe('#drawText', function() {
    beforeEach(function() {
      var textStyle = createTextStyle(
        new ol.style.Fill({
          color: [0, 0, 0, 1]
        }),
        null, 'someText');
      replay.setTextStyle(textStyle);
    });

    it('sets the buffer data', function() {
      var point;

      point = [1000, 2000];
      replay.drawText(point, 0, 2, 2, null, null);
      expect(replay.vertices).to.have.length(32);
      expect(replay.indices).to.have.length(6);
      expect(replay.indices[0]).to.be(0);
      expect(replay.indices[1]).to.be(1);
      expect(replay.indices[2]).to.be(2);
      expect(replay.indices[3]).to.be(0);
      expect(replay.indices[4]).to.be(2);
      expect(replay.indices[5]).to.be(3);

      point = [2000, 3000];
      replay.drawText(point, 0, 2, 2, null, null);
      expect(replay.vertices).to.have.length(64);
      expect(replay.indices).to.have.length(12);
      expect(replay.indices[6]).to.be(4);
      expect(replay.indices[7]).to.be(5);
      expect(replay.indices[8]).to.be(6);
      expect(replay.indices[9]).to.be(4);
      expect(replay.indices[10]).to.be(6);
      expect(replay.indices[11]).to.be(7);
    });

    it('does not draw if text is empty', function() {
      replay.state_.text = '';
      var point;

      point = [1000, 2000];
      replay.drawText(point, 0, 2, 2, null, null);
      expect(replay.vertices).to.have.length(0);
      expect(replay.indices).to.have.length(0);
    });
  });

  describe('#getTextures', function() {
    beforeEach(function() {
      replay.textures_ = [1, 2];
    });

    it('returns the textures', function() {
      var textures = replay.getTextures();

      expect(textures).to.have.length(2);
      expect(textures[0]).to.be(1);
      expect(textures[1]).to.be(2);
      expect(textures).to.eql(replay.getTextures(true));
    });
  });

  describe('#getHitDetectionTextures', function() {
    beforeEach(function() {
      replay.textures_ = [1, 2];
    });

    it('returns the textures', function() {
      var textures = replay.getHitDetectionTextures();

      expect(textures).to.have.length(2);
      expect(textures[0]).to.be(1);
      expect(textures[1]).to.be(2);
    });
  });
});
