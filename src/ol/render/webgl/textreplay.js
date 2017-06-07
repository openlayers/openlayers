goog.provide('ol.render.webgl.TextReplay');

goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.dom');
goog.require('ol.has');
goog.require('ol.render.webgl');
goog.require('ol.render.webgl.TextureReplay');
goog.require('ol.webgl.Buffer');


if (ol.ENABLE_WEBGL) {

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
     *         text: (string|undefined),
     *         font: (string|undefined),
     *         textAlign: (number|undefined),
     *         textBaseline: (number|undefined),
     *         offsetX: (number|undefined),
     *         offsetY: (number|undefined),
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
      text: '',
      font: undefined,
      textAlign: undefined,
      textBaseline: undefined,
      offsetX: undefined,
      offsetY: undefined,
      scale: undefined
    };

    this.originX = 0;

    this.originY = 0;

    this.scale = 1;

    this.opacity = 1;

  };
  ol.inherits(ol.render.webgl.TextReplay, ol.render.webgl.TextureReplay);


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.drawText = function(flatCoordinates, offset,
      end, stride, geometry, feature) {
    //For now we create one texture per feature. That is, only multiparts are grouped.
    //TODO: speed up rendering with SDF, or at least glyph atlases
    var state = this.state_;
    if (state.text) {
      this.startIndices.push(this.indices.length);
      this.startIndicesFeature.push(feature);

      this.drawCoordinates(
          flatCoordinates, offset, end, stride);
    }
  };


  /**
   * @private
   * @return {HTMLCanvasElement} Text image.
   */
  ol.render.webgl.TextReplay.prototype.createTextImage_ = function() {
    var state = this.state_;

    //Measure text dimensions
    var mCtx = this.measureCanvas_.getContext('2d');
    mCtx.font = state.font;
    var lineHeight = Math.round(mCtx.measureText('M').width * 1.2 + state.lineWidth * 2);
    var lines = state.text.split('\n');
    //FIXME: use pixelRatio
    var textHeight = Math.ceil(lineHeight * lines.length * state.scale);
    this.height = textHeight;
    this.imageHeight = textHeight;
    this.anchorY = Math.round(textHeight * state.textBaseline + state.offsetY);
    var longestLine = lines.map(function(str) {
      return mCtx.measureText(str).width;
    }).reduce(function(max, curr) {
      return Math.max(max, curr);
    });
    //FIXME: use pixelRatio
    var textWidth = Math.ceil((longestLine + state.lineWidth * 2) * state.scale);
    this.width = textWidth;
    this.imageWidth = textWidth;
    this.anchorX = Math.round(textWidth * state.textAlign + state.offsetX);

    //Create a canvas
    var ctx = ol.dom.createCanvasContext2D(textWidth, textHeight);
    var canvas = ctx.canvas;

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

    //Draw the text on the canvas
    var lineY = 0;
    for (var i = 0, ii = lines.length; i < ii; ++i) {
      if (state.strokeColor) {
        ctx.strokeText(lines[i], 0, lineY);
      }
      if (state.fillColor) {
        ctx.fillText(lines[i], 0, lineY);
      }
      lineY += lineHeight;
    }

    return /** @type {HTMLCanvasElement} */ (canvas);
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
      text: '',
      font: undefined,
      textAlign: undefined,
      textBaseline: undefined,
      offsetX: undefined,
      offsetY: undefined,
      scale: undefined
    };
    this.images_ = null;
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
      state.text = '';
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
      state.text = textStyle.getText();
      var textAlign = ol.render.webgl.TextReplay.Align_[textStyle.getTextAlign()];
      var textBaseline = ol.render.webgl.TextReplay.Align_[textStyle.getTextBaseline()];
      state.textAlign = textAlign === undefined ?
          ol.render.webgl.defaultTextAlign : textAlign;
      state.textBaseline = textBaseline === undefined ?
          ol.render.webgl.defaultTextBaseline : textBaseline;
      state.offsetX = textStyle.getOffsetX() || 0;
      state.offsetY = textStyle.getOffsetY() || 0;
      this.rotateWithView = !!textStyle.getRotateWithView();
      this.rotation = textStyle.getRotation() || 0;

      if (this.images_.length === 0) {
        this.images_.push(this.createTextImage_());
      } else {
        this.groupIndices.push(this.indices.length);
        this.images_.push(this.createTextImage_());
      }
    }
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


  /**
   * @enum {number}
   * @private
   */
  ol.render.webgl.TextReplay.Align_ = {
    left: 0,
    end: 0,
    center: 0.5,
    right: 1,
    start: 1,
    top: 0,
    middle: 0.5,
    hanging: 0.2,
    alphabetic: 0.8,
    ideographic: 0.8,
    bottom: 1
  };

}
