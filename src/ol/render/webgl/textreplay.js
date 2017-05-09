goog.provide('ol.render.webgl.TextReplay');

goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.has');
goog.require('ol.render.webgl');
goog.require('ol.render.webgl.imagereplay.defaultshader');
goog.require('ol.render.webgl.Replay');
goog.require('ol.webgl');
goog.require('ol.webgl.Context');


if (ol.ENABLE_WEBGL) {

  /**
   * @constructor
   * @extends {ol.render.webgl.Replay}
   * @param {number} tolerance Tolerance.
   * @param {ol.Extent} maxExtent Max extent.
   * @struct
   */
  ol.render.webgl.TextReplay = function(tolerance, maxExtent) {
    ol.render.webgl.Replay.call(this, tolerance, maxExtent);

    /**
     * @private
     * @type {ol.render.webgl.imagereplay.defaultshader.Locations}
     */
    this.defaultLocations_ = null;

    /**
     * @private
     * @type {Array.<Array.<?>>}
     */
    this.styles_ = [];

    /**
     * @private
     * @type {Array.<number>}
     */
    this.styleIndices_ = [];

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
     * @type {{strokeColor: (ol.ColorLike|null),
     *         lineCap: (string|undefined),
     *         lineDash: Array.<number>,
     *         lineDashOffset: (number|undefined),
     *         lineJoin: (string|undefined),
     *         lineWidth: (number|undefined),
     *         miterLimit: (number|undefined),
     *         fillColor: (ol.ColorLike|null),
     *         text: string,
     *         font: (string|undefined),
     *         textAlign: (string|undefined),
     *         textBaseline: (string|undefined),
     *         offsetX: (number|undefined),
     *         offsetY: (number|undefined),
     *         scale: (number|undefined),
     *         rotation: (number|undefined),
     *         rotateWithView: (boolean|undefined)}
     */
    this.state_ = {
      strokeColor: null,
      lineCap: undefined,
      lineDash: null,
      lineDashOffset: undefined,
      lineJoin: undefined,
      lineWidth: undefined,
      miterLimit: undefined,
      fillColor: null,
      text: '',
      font: undefined,
      textAlign: undefined,
      textBaseline: undefined,
      offsetX: undefined,
      offsetY: undefined,
      scale: undefined,
      rotation: undefined,
      rotateWithView: undefined
    };

  };
  ol.inherits(ol.render.webgl.TextReplay, ol.render.webgl.Replay);

  /**
   * @param {Array.<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @param {ol.geom.Geometry|ol.render.Feature} geometry Geometry.
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   */
  ol.render.webgl.TextReplay.prototype.drawText = function(flatCoordinates, offset,
      end, stride, geometry, feature) {
    //For now we create one texture per feature. That is, only multiparts are grouped.
    //TODO: speed up rendering with SDF, or at least glyph atlases
    var state = this.state_;
    if (state.text && (state.fillColor || state.strokeColor)) {
      this.images_.push(this.createTextImage_());
    }
  };

  /**
   * @private
   * @return {HTMLCanvasElement} Text image.
   */
  ol.render.webgl.TextReplay.prototype.createTextImage_ = function() {
    var state = this.state_;
    var canvas = document.createElement('canvas');

    var ctx = canvas.getContext('2d');
    ctx.font = state.font;
    var lineHeight = Math.round(ctx.measureText('M').width * 1.5 + state.lineWidth * 2);
    var lines = state.text.split('\n');
    //FIXME: use pixelRatio
    var textHeight = Math.ceil(lineHeight * lines.length * state.scale);
    var longestLine = lines.map(function(str) {
      return ctx.measureText(str).width;
    }).reduce(function(max, curr) {
      return Math.max(max, curr);
    });
    //FIXME: use pixelRatio
    var textWidth = Math.ceil((longestLine + state.lineWidth * 2) * state.scale);

    //Parameterize the canvas
    canvas.width = textWidth;
    canvas.height = textHeight;
    ctx.fillStyle = state.fillColor;
    ctx.strokeStyle = state.strokeColor;
    ctx.lineWidth = state.lineWidth;
    ctx.lineCap = state.lineCap;
    ctx.lineJoin = state.lineJoin;
    ctx.miterLimit = state.miterLimit;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (ol.has.CANVAS_LINE_DASH) {
      //FIXME: use pixelRatio
      ctx.setLineDash(state.lineDash);
      ctx.lineDashOffset = state.lineDashOffset;
    }
    if (state.scale !== 1) {
      //FIXME: use pixelRatio
      ctx.setTransform(state.scale, 0, 0, state.scale, 0, 0);
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

    return canvas;
  };

  /**
   * @abstract
   * @param {ol.webgl.Context} context Context.
   */
  ol.render.webgl.TextReplay.prototype.finish = function(context) {};

  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.getDeleteResourcesFunction = function(context) {
    var verticesBuffer = this.verticesBuffer;
    var indicesBuffer = this.indicesBuffer;
    var textures = this.textures_;
    var gl = context.getGL();
    return function() {
      if (!gl.isContextLost()) {
        var i, ii;
        for (i = 0, ii = textures.length; i < ii; ++i) {
          gl.deleteTexture(textures[i]);
        }
      }
      context.deleteBuffer(verticesBuffer);
      context.deleteBuffer(indicesBuffer);
    };
  };

  /**
   * @param {ol.style.Text} textStyle Text style.
   */
  ol.render.webgl.TextReplay.prototype.setTextStyle = function(textStyle) {
    var state = this.state_;
    if (!textStyle) {
      state.text = '';
    } else {
      var textFillStyle = textStyle.getFill();
      if (!textFillStyle) {
        state.fillColor = null;
      } else {
        var textFillStyleColor = textFillStyle.getColor();
        state.fillColor = ol.colorlike.asColorLike(textFillStyleColor ?
            textFillStyleColor : ol.render.webgl.defaultFillStyle);
      }
      var textStrokeStyle = textStyle.getStroke();
      if (!textStrokeStyle) {
        state.strokeColor = null;
      } else {
        var textStrokeStyleColor = textFillStyle.getColor();
        state.strokeColor = ol.colorlike.asColorLike(textStrokeStyleColor ?
            textStrokeStyleColor : ol.render.webgl.defaultStrokeStyle);
        state.lineWidth = textStrokeStyle.getWidth() || ol.render.webgl.defaultLineWidth;
        state.lineCap = textStrokeStyle.getLineCap() || ol.render.webgl.defaultLineCap;
        state.lineDash = textStrokeStyle.getLineDash() || ol.render.webgl.defaultLineDash;
        state.lineDashOffset = textStrokeStyle.getLineDashOffset() || ol.render.webgl.defaultLineDashOffset;
        state.lineJoin = textStrokeStyle.getLineJoin() || ol.render.webgl.defaultLineJoin;
        state.miterLimit = textStrokeStyle.getMiterLimit() || ol.render.webgl.defaultMiterLimit;
      }
      state.font = textStyle.getFont() || ol.render.webgl.defaultFont;
      state.offsetX = textStyle.getOffsetX() || 0;
      state.offsetY = textStyle.getOffsetY() || 0;
      state.rotateWithView = !!textStyle.getRotateWithView();
      state.rotation = textStyle.getRotation() || 0;
      state.scale = textStyle.getScale() || 1;
      state.text = textStyle.getText() || '';
      state.textAlign = textStyle.getTextAlign() || ol.render.webgl.defaultTextAlign;
      state.textBaseline = textStyle.getTextBaseline() || ol.render.webgl.defaultTextBaseline;
    }
  };

}
