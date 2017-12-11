goog.provide('ol.render.webgl.TextReplay');

goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.dom');
goog.require('ol.geom.GeometryType');
goog.require('ol.has');
goog.require('ol.render.replay');
goog.require('ol.render.webgl');
goog.require('ol.render.webgl.TextureReplay');
goog.require('ol.style.AtlasManager');
goog.require('ol.webgl.Buffer');


/**
 * @constructor
 * @extends {ol.render.webgl.TextureReplay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.TextReplay = function(tolerance, maxExtent) {
  ol.render.webgl.TextureReplay.call(this, tolerance, maxExtent);

  /**
   * @private
   * @type {Array.<HTMLCanvasElement>}
   */
  this.images_ = [];

  /**
   * @private
   * @type {Array.<WebGLTexture>}
   */
  this.textures_ = [];

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.measureCanvas_ = ol.dom.createCanvasContext2D(0, 0).canvas;

  /**
   * @private
   * @type {{strokeColor: (ol.ColorLike|null),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineDashOffset: (number|undefined),
   *         lineJoin: (string|undefined),
   *         lineWidth: number,
   *         miterLimit: (number|undefined),
   *         fillColor: (ol.ColorLike|null),
   *         font: (string|undefined),
   *         scale: (number|undefined)}}
   */
  this.state_ = {
    strokeColor: null,
    lineCap: undefined,
    lineDash: null,
    lineDashOffset: undefined,
    lineJoin: undefined,
    lineWidth: 0,
    miterLimit: undefined,
    fillColor: null,
    font: undefined,
    scale: undefined
  };

  /**
   * @private
   * @type {string}
   */
  this.text_ = '';

  /**
   * @private
   * @type {number|undefined}
   */
  this.textAlign_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.textBaseline_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.offsetX_ = undefined;

  /**
   * @private
   * @type {number|undefined}
   */
  this.offsetY_ = undefined;

  /**
   * @private
   * @type {Object.<string, ol.WebglGlyphAtlas>}
   */
  this.atlases_ = {};

  /**
   * @private
   * @type {ol.WebglGlyphAtlas|undefined}
   */
  this.currAtlas_ = undefined;

  this.scale = 1;

  this.opacity = 1;

};
ol.inherits(ol.render.webgl.TextReplay, ol.render.webgl.TextureReplay);


/**
 * @inheritDoc
 */
ol.render.webgl.TextReplay.prototype.drawText = function(geometry, feature) {
  if (this.text_) {
    var flatCoordinates = null;
    var offset = 0;
    var end = 2;
    var stride = 2;
    switch (geometry.getType()) {
      case ol.geom.GeometryType.POINT:
      case ol.geom.GeometryType.MULTI_POINT:
        flatCoordinates = geometry.getFlatCoordinates();
        end = flatCoordinates.length;
        stride = geometry.getStride();
        break;
      case ol.geom.GeometryType.CIRCLE:
        flatCoordinates = /** @type {ol.geom.Circle} */ (geometry).getCenter();
        break;
      case ol.geom.GeometryType.LINE_STRING:
        flatCoordinates = /** @type {ol.geom.LineString} */ (geometry).getFlatMidpoint();
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        flatCoordinates = /** @type {ol.geom.MultiLineString} */ (geometry).getFlatMidpoints();
        end = flatCoordinates.length;
        break;
      case ol.geom.GeometryType.POLYGON:
        flatCoordinates = /** @type {ol.geom.Polygon} */ (geometry).getFlatInteriorPoint();
        break;
      case ol.geom.GeometryType.MULTI_POLYGON:
        flatCoordinates = /** @type {ol.geom.MultiPolygon} */ (geometry).getFlatInteriorPoints();
        end = flatCoordinates.length;
        break;
      default:
    }
    this.startIndices.push(this.indices.length);
    this.startIndicesFeature.push(feature);

    var glyphAtlas = this.currAtlas_;
    var lines = this.text_.split('\n');
    var textSize = this.getTextSize_(lines);
    var i, ii, j, jj, currX, currY, charArr, charInfo;
    var anchorX = Math.round(textSize[0] * this.textAlign_ - this.offsetX_);
    var anchorY = Math.round(textSize[1] * this.textBaseline_ - this.offsetY_);
    var lineWidth = (this.state_.lineWidth / 2) * this.state_.scale;

    for (i = 0, ii = lines.length; i < ii; ++i) {
      currX = 0;
      currY = glyphAtlas.height * i;
      charArr = lines[i].split('');

      for (j = 0, jj = charArr.length; j < jj; ++j) {
        charInfo = glyphAtlas.atlas.getInfo(charArr[j]);

        if (charInfo) {
          var image = charInfo.image;

          this.anchorX = anchorX - currX;
          this.anchorY = anchorY - currY;
          this.originX = j === 0 ? charInfo.offsetX - lineWidth : charInfo.offsetX;
          this.originY = charInfo.offsetY;
          this.height = glyphAtlas.height;
          this.width = j === 0 || j === charArr.length - 1 ?
            glyphAtlas.width[charArr[j]] + lineWidth : glyphAtlas.width[charArr[j]];
          this.imageHeight = image.height;
          this.imageWidth = image.width;

          var currentImage;
          if (this.images_.length === 0) {
            this.images_.push(image);
          } else {
            currentImage = this.images_[this.images_.length - 1];
            if (ol.getUid(currentImage) != ol.getUid(image)) {
              this.groupIndices.push(this.indices.length);
              this.images_.push(image);
            }
          }

          this.drawText_(flatCoordinates, offset, end, stride);
        }
        currX += this.width;
      }
    }
  }
};


/**
 * @private
 * @param {Array.<string>} lines Label to draw split to lines.
 * @return {Array.<number>} Size of the label in pixels.
 */
ol.render.webgl.TextReplay.prototype.getTextSize_ = function(lines) {
  var self = this;
  var glyphAtlas = this.currAtlas_;
  var textHeight = lines.length * glyphAtlas.height;
  //Split every line to an array of chars, sum up their width, and select the longest.
  var textWidth = lines.map(function(str) {
    var sum = 0;
    var i, ii;
    for (i = 0, ii = str.length; i < ii; ++i) {
      var curr = str[i];
      if (!glyphAtlas.width[curr]) {
        self.addCharToAtlas_(curr);
      }
      sum += glyphAtlas.width[curr] ? glyphAtlas.width[curr] : 0;
    }
    return sum;
  }).reduce(function(max, curr) {
    return Math.max(max, curr);
  });

  return [textWidth, textHeight];
};


/**
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
ol.render.webgl.TextReplay.prototype.drawText_ = function(flatCoordinates, offset,
    end, stride) {
  var i, ii;
  for (i = offset, ii = end; i < ii; i += stride) {
    this.drawCoordinates(flatCoordinates, offset, end, stride);
  }
};


/**
 * @private
 * @param {string} char Character.
 */
ol.render.webgl.TextReplay.prototype.addCharToAtlas_ = function(char) {
  if (char.length === 1) {
    var glyphAtlas = this.currAtlas_;
    var state = this.state_;
    var mCtx = this.measureCanvas_.getContext('2d');
    mCtx.font = state.font;
    var width = Math.ceil(mCtx.measureText(char).width * state.scale);

    var info = glyphAtlas.atlas.add(char, width, glyphAtlas.height,
        function(ctx, x, y) {
          //Parameterize the canvas
          ctx.font = /** @type {string} */ (state.font);
          ctx.fillStyle = state.fillColor;
          ctx.strokeStyle = state.strokeColor;
          ctx.lineWidth = state.lineWidth;
          ctx.lineCap = /*** @type {string} */ (state.lineCap);
          ctx.lineJoin = /** @type {string} */ (state.lineJoin);
          ctx.miterLimit = /** @type {number} */ (state.miterLimit);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          if (ol.has.CANVAS_LINE_DASH && state.lineDash) {
            //FIXME: use pixelRatio
            ctx.setLineDash(state.lineDash);
            ctx.lineDashOffset = /** @type {number} */ (state.lineDashOffset);
          }
          if (state.scale !== 1) {
            //FIXME: use pixelRatio
            ctx.setTransform(/** @type {number} */ (state.scale), 0, 0,
                /** @type {number} */ (state.scale), 0, 0);
          }

          //Draw the character on the canvas
          if (state.strokeColor) {
            ctx.strokeText(char, x, y);
          }
          if (state.fillColor) {
            ctx.fillText(char, x, y);
          }
        });

    if (info) {
      glyphAtlas.width[char] = width;
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.TextReplay.prototype.finish = function(context) {
  var gl = context.getGL();

  this.groupIndices.push(this.indices.length);
  this.hitDetectionGroupIndices = this.groupIndices;

  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new ol.webgl.Buffer(this.vertices);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new ol.webgl.Buffer(this.indices);

  // create textures
  /** @type {Object.<string, WebGLTexture>} */
  var texturePerImage = {};

  this.createTextures(this.textures_, this.images_, texturePerImage, gl);

  this.state_ = {
    strokeColor: null,
    lineCap: undefined,
    lineDash: null,
    lineDashOffset: undefined,
    lineJoin: undefined,
    lineWidth: 0,
    miterLimit: undefined,
    fillColor: null,
    font: undefined,
    scale: undefined
  };
  this.text_ = '';
  this.textAlign_ = undefined;
  this.textBaseline_ = undefined;
  this.offsetX_ = undefined;
  this.offsetY_ = undefined;
  this.images_ = null;
  this.atlases_ = {};
  this.currAtlas_ = undefined;
  ol.render.webgl.TextureReplay.prototype.finish.call(this, context);
};


/**
 * @inheritDoc
 */
ol.render.webgl.TextReplay.prototype.setTextStyle = function(textStyle) {
  var state = this.state_;
  var textFillStyle = textStyle.getFill();
  var textStrokeStyle = textStyle.getStroke();
  if (!textStyle || !textStyle.getText() || (!textFillStyle && !textStrokeStyle)) {
    this.text_ = '';
  } else {
    if (!textFillStyle) {
      state.fillColor = null;
    } else {
      var textFillStyleColor = textFillStyle.getColor();
      state.fillColor = ol.colorlike.asColorLike(textFillStyleColor ?
        textFillStyleColor : ol.render.webgl.defaultFillStyle);
    }
    if (!textStrokeStyle) {
      state.strokeColor = null;
      state.lineWidth = 0;
    } else {
      var textStrokeStyleColor = textStrokeStyle.getColor();
      state.strokeColor = ol.colorlike.asColorLike(textStrokeStyleColor ?
        textStrokeStyleColor : ol.render.webgl.defaultStrokeStyle);
      state.lineWidth = textStrokeStyle.getWidth() || ol.render.webgl.defaultLineWidth;
      state.lineCap = textStrokeStyle.getLineCap() || ol.render.webgl.defaultLineCap;
      state.lineDashOffset = textStrokeStyle.getLineDashOffset() || ol.render.webgl.defaultLineDashOffset;
      state.lineJoin = textStrokeStyle.getLineJoin() || ol.render.webgl.defaultLineJoin;
      state.miterLimit = textStrokeStyle.getMiterLimit() || ol.render.webgl.defaultMiterLimit;
      var lineDash = textStrokeStyle.getLineDash();
      state.lineDash = lineDash ? lineDash.slice() : ol.render.webgl.defaultLineDash;
    }
    state.font = textStyle.getFont() || ol.render.webgl.defaultFont;
    state.scale = textStyle.getScale() || 1;
    this.text_ = /** @type {string} */ (textStyle.getText());
    var textAlign = ol.render.replay.TEXT_ALIGN[textStyle.getTextAlign()];
    var textBaseline = ol.render.replay.TEXT_ALIGN[textStyle.getTextBaseline()];
    this.textAlign_ = textAlign === undefined ?
      ol.render.webgl.defaultTextAlign : textAlign;
    this.textBaseline_ = textBaseline === undefined ?
      ol.render.webgl.defaultTextBaseline : textBaseline;
    this.offsetX_ = textStyle.getOffsetX() || 0;
    this.offsetY_ = textStyle.getOffsetY() || 0;
    this.rotateWithView = !!textStyle.getRotateWithView();
    this.rotation = textStyle.getRotation() || 0;

    this.currAtlas_ = this.getAtlas_(state);
  }
};


/**
 * @private
 * @param {Object} state Font attributes.
 * @return {ol.WebglGlyphAtlas} Glyph atlas.
 */
ol.render.webgl.TextReplay.prototype.getAtlas_ = function(state) {
  var params = [];
  var i;
  for (i in state) {
    if (state[i] || state[i] === 0) {
      if (Array.isArray(state[i])) {
        params = params.concat(state[i]);
      } else {
        params.push(state[i]);
      }
    }
  }
  var hash = this.calculateHash_(params);
  if (!this.atlases_[hash]) {
    var mCtx = this.measureCanvas_.getContext('2d');
    mCtx.font = state.font;
    var height = Math.ceil((mCtx.measureText('M').width * 1.5 +
        state.lineWidth / 2) * state.scale);

    this.atlases_[hash] = {
      atlas: new ol.style.AtlasManager({
        space: state.lineWidth + 1
      }),
      width: {},
      height: height
    };
  }
  return this.atlases_[hash];
};


/**
 * @private
 * @param {Array.<string|number>} params Array of parameters.
 * @return {string} Hash string.
 */
ol.render.webgl.TextReplay.prototype.calculateHash_ = function(params) {
  //TODO: Create a more performant, reliable, general hash function.
  var i, ii;
  var hash = '';
  for (i = 0, ii = params.length; i < ii; ++i) {
    hash += params[i];
  }
  return hash;
};


/**
 * @inheritDoc
 */
ol.render.webgl.TextReplay.prototype.getTextures = function(opt_all) {
  return this.textures_;
};


/**
 * @inheritDoc
 */
ol.render.webgl.TextReplay.prototype.getHitDetectionTextures = function() {
  return this.textures_;
};
