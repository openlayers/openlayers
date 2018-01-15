import {createCanvasContext2D} from '../../../../../src/ol/dom.js';
import Point from '../../../../../src/ol/geom/Point.js';
import WebGLTextReplay from '../../../../../src/ol/render/webgl/TextReplay.js';
import Fill from '../../../../../src/ol/style/Fill.js';
import Stroke from '../../../../../src/ol/style/Stroke.js';
import Text from '../../../../../src/ol/style/Text.js';

describe('ol.render.webgl.TextReplay', function() {
  let replay;

  const createTextStyle = function(fillStyle, strokeStyle, text) {
    const textStyle = new Text({
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
    const tolerance = 0.1;
    const maxExtent = [-10000, -20000, 10000, 20000];
    replay = new WebGLTextReplay(tolerance, maxExtent);
  });

  describe('#setTextStyle', function() {

    let textStyle1, textStyle2, textStyle3, textStyle4;

    beforeEach(function() {
      textStyle1 = createTextStyle(
        new Fill({
          color: [0, 0, 0, 1]
        }),
        new Stroke({
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
        new Fill({
          color: [255, 255, 255, 1]
        }),
        new Stroke({
          width: 1,
          color: [255, 255, 255, 1]
        }),
        'someText'
      );
      textStyle3 = createTextStyle(null, null, 'someText');
      textStyle4 = createTextStyle(
        new Fill({
          color: [0, 0, 0, 1]
        }),
        new Stroke({
          width: 1,
          color: [0, 0, 0, 1]
        }),
        ''
      );
    });

    it('set expected states', function() {
      replay.setTextStyle(textStyle1);
      expect(replay.opacity).to.be(1);
      expect(replay.rotation).to.be(1.5);
      expect(replay.rotateWithView).to.be(true);
      expect(replay.scale).to.be(1);
      expect(replay.offsetX_).to.be(10);
      expect(replay.offsetY_).to.be(10);
      expect(replay.text_).to.be('someText');
      expect(Object.keys(replay.atlases_)).to.have.length(1);

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

      replay.setTextStyle(textStyle2);
      expect(Object.keys(replay.atlases_)).to.have.length(2);
    });

    it('does not create an atlas, if an empty text is supplied', function() {
      replay.setTextStyle(textStyle4);
      expect(replay.text_).to.be('');
      expect(Object.keys(replay.atlases_)).to.have.length(0);
    });

    it('does not create an atlas, if both fill and stroke styles are missing', function() {
      replay.setTextStyle(textStyle3);
      expect(replay.text_).to.be('');
      expect(Object.keys(replay.atlases_)).to.have.length(0);
    });
  });

  describe('#drawText', function() {
    beforeEach(function() {
      const textStyle = createTextStyle(
        new Fill({
          color: [0, 0, 0, 1]
        }),
        null, 'someText');
      replay.setTextStyle(textStyle);
    });

    it('sets the buffer data', function() {
      let point;

      point = [1000, 2000];
      replay.drawText(new Point(point), null);
      expect(replay.vertices).to.have.length(256);
      expect(replay.indices).to.have.length(48);

      point = [2000, 3000];
      replay.drawText(new Point(point), null);
      expect(replay.vertices).to.have.length(512);
      expect(replay.indices).to.have.length(96);
    });

    it('sets part of its state during drawing', function() {
      const point = [1000, 2000];
      replay.drawText(new Point(point), null);

      const height = replay.currAtlas_.height;
      const widths = replay.currAtlas_.width;
      const width = widths.t;
      const widthX = widths.s + widths.o + widths.m + widths.e + widths.T +
          widths.e + widths.x;
      const charInfo = replay.currAtlas_.atlas.getInfo('t');

      expect(replay.height).to.be(height);
      expect(replay.width).to.be(width);
      expect(replay.originX).to.be(charInfo.offsetX);
      expect(replay.originY).to.be(charInfo.offsetY);
      expect(replay.imageHeight).to.be(charInfo.image.height);
      expect(replay.imageWidth).to.be(charInfo.image.width);
      expect(replay.anchorX).to.be(-widthX - 10);
      expect(replay.anchorY).to.be(-10);
    });

    it('does not draw if text is empty', function() {
      replay.text_ = '';

      const point = [1000, 2000];
      replay.drawText(new Point(point), null);
      expect(replay.vertices).to.have.length(0);
      expect(replay.indices).to.have.length(0);
    });
  });

  describe('#addCharToAtlas_', function() {
    beforeEach(function() {
      const textStyle = createTextStyle(
        new Fill({
          color: [0, 0, 0, 1]
        }),
        null, 'someText');
      replay.setTextStyle(textStyle);
    });

    it('adds a single character to the current atlas', function() {
      const glyphAtlas = replay.currAtlas_.atlas;
      let info;

      replay.addCharToAtlas_('someText');
      info = glyphAtlas.getInfo('someText');
      expect(info).to.be(null);

      replay.addCharToAtlas_('e');
      replay.addCharToAtlas_('x');
      info = glyphAtlas.getInfo('e');
      expect(info).not.to.be(null);
      info = glyphAtlas.getInfo('x');
      expect(info).not.to.be(null);
    });

    it('keeps the atlas and the width dictionary synced', function() {
      const glyphAtlas = replay.currAtlas_;

      replay.addCharToAtlas_('e');
      replay.addCharToAtlas_('x');
      expect(Object.keys(glyphAtlas.width)).to.have.length(2);

      replay.addCharToAtlas_('someText');
      expect(Object.keys(glyphAtlas.width)).to.have.length(2);
    });
  });

  describe('#getTextSize_', function() {
    beforeEach(function() {
      const textStyle = createTextStyle(
        new Fill({
          color: [0, 0, 0, 1]
        }),
        null, 'someText');
      textStyle.setScale(1);
      replay.setTextStyle(textStyle);
    });

    it('adds missing characters to the current atlas', function() {
      const glyphAtlas = replay.currAtlas_;
      let info;

      expect(Object.keys(glyphAtlas.width)).to.have.length(0);
      replay.getTextSize_(['someText']);
      expect(Object.keys(glyphAtlas.width)).to.have.length(7);
      info = glyphAtlas.atlas.getInfo('s');
      expect(info).not.to.be(null);
      info = glyphAtlas.atlas.getInfo('o');
      expect(info).not.to.be(null);
      info = glyphAtlas.atlas.getInfo('m');
      expect(info).not.to.be(null);
      info = glyphAtlas.atlas.getInfo('e');
      expect(info).not.to.be(null);
      info = glyphAtlas.atlas.getInfo('T');
      expect(info).not.to.be(null);
      info = glyphAtlas.atlas.getInfo('x');
      expect(info).not.to.be(null);
      info = glyphAtlas.atlas.getInfo('t');
      expect(info).not.to.be(null);
    });

    it('returns the size of the label\'s bounding box in pixels', function() {
      let size;
      const mCtx = createCanvasContext2D(0, 0);
      mCtx.font = '12px Arial';
      const width = mCtx.measureText('someText').width;
      const width2 = mCtx.measureText('anEvenLongerLine').width;
      const height = Math.ceil(mCtx.measureText('M').width * 1.5);

      size = replay.getTextSize_(['someText']);
      expect(size[0]).to.be.within(width, width + 8);
      expect(size[1]).to.be(height);

      size = replay.getTextSize_(['someText', 'anEvenLongerLine']);
      expect(size[0]).to.be.within(width2, width2 + 16);
      expect(size[1]).to.be(height * 2);
    });
  });

  describe('#getAtlas_', function() {
    beforeEach(function() {
      const textStyle = createTextStyle(
        new Fill({
          color: [0, 0, 0, 1]
        }),
        null, 'someText');
      replay.setTextStyle(textStyle);
    });

    it('returns the appropriate atlas for the current state', function() {
      const atlas = replay.currAtlas_;
      const state = replay.state_;

      expect(Object.keys(replay.atlases_)).to.have.length(1);
      expect(replay.getAtlas_(state)).to.be(atlas);
      expect(Object.keys(replay.atlases_)).to.have.length(1);
    });

    it('creates a new atlas if it cannot find the one for the current state', function() {
      const atlas = replay.currAtlas_;
      const state = replay.state_;
      state.lineWidth = 50;

      expect(Object.keys(replay.atlases_)).to.have.length(1);
      expect(replay.getAtlas_(state)).not.to.be(atlas);
      expect(Object.keys(replay.atlases_)).to.have.length(2);
    });
  });

  describe('#getTextures', function() {
    beforeEach(function() {
      replay.textures_ = [1, 2];
    });

    it('returns the textures', function() {
      const textures = replay.getTextures();

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
      const textures = replay.getHitDetectionTextures();

      expect(textures).to.have.length(2);
      expect(textures[0]).to.be(1);
      expect(textures[1]).to.be(2);
    });
  });
});
