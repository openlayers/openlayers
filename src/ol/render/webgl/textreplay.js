goog.provide('ol.render.webgl.TextReplay');

goog.require('ol');
goog.require('ol.colorlike');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.has');
goog.require('ol.render.webgl');
goog.require('ol.render.webgl.textreplay.defaultshader');
goog.require('ol.render.webgl.Replay');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');
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
     * @type {ol.render.webgl.textreplay.defaultshader.Locations}
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
     *         text: string,
     *         font: (string|undefined),
     *         textAlign: (string|undefined),
     *         textBaseline: (string|undefined),
     *         offsetX: (number|undefined),
     *         offsetY: (number|undefined),
     *         scale: (number|undefined),
     *         rotation: (number|undefined),
     *         rotateWithView: (boolean|undefined),
     *         height: (number|undefined),
     *         width: (number|undefined)}}
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
      scale: undefined,
      rotation: undefined,
      rotateWithView: undefined,
      height: undefined,
      width: undefined
    };

  };
  ol.inherits(ol.render.webgl.TextReplay, ol.render.webgl.Replay);


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.drawText = function(flatCoordinates, offset,
      end, stride, geometry, feature) {
    //For now we create one texture per feature. That is, only multiparts are grouped.
    //TODO: speed up rendering with SDF, or at least glyph atlases
    var state = this.state_;
    if (state.text && (state.fillColor || state.strokeColor)) {
      this.startIndices.push(this.indices.length);
      this.startIndicesFeature.push(feature);

      this.images_.push(this.createTextImage_());
      this.drawCoordinates_(
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
    state.height = textHeight;
    var longestLine = lines.map(function(str) {
      return mCtx.measureText(str).width;
    }).reduce(function(max, curr) {
      return Math.max(max, curr);
    });
    //FIXME: use pixelRatio
    var textWidth = Math.ceil((longestLine + state.lineWidth * 2) * state.scale);
    state.width = textWidth;

    //Create a canvas
    var ctx = ol.dom.createCanvasContext2D(textWidth, textHeight);
    var canvas = ctx.canvas;

    //Parameterize the canvas
    ctx.font = state.font;
    ctx.fillStyle = state.fillColor;
    ctx.strokeStyle = state.strokeColor;
    ctx.lineWidth = state.lineWidth;
    ctx.lineCap = state.lineCap;
    ctx.lineJoin = state.lineJoin;
    ctx.miterLimit = state.miterLimit;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    if (ol.has.CANVAS_LINE_DASH && state.lineDash) {
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

    return /** @type {HTMLCanvasElement} */ (canvas);
  };


  /**
   * @param {Array.<number>} flatCoordinates Flat coordinates.
   * @param {number} offset Offset.
   * @param {number} end End.
   * @param {number} stride Stride.
   * @return {number} My end.
   * @private
   */
  ol.render.webgl.TextReplay.prototype.drawCoordinates_ = function(flatCoordinates, offset, end, stride) {
    var state = this.state_;
    var anchorX, anchorY;
    var height = /** @type {number} */ (state.height);
    var width = /** @type {number} */ (state.width);
    switch (state.textAlign) {
      default:
        anchorX = width / 2;
        break;
      case 'left': case 'end':
        anchorX = 0;
        break;
      case 'right': case 'start':
        anchorX = width;
        break;
    }
    switch (state.textBaseline) {
      default:
        anchorY = height / 2;
        break;
      case 'top':
        anchorY = 0;
        break;
      case 'bottom':
        anchorY = height;
        break;
      case 'hanging':
        anchorY = height * 0.2;
        break;
      case 'alphabetic': case 'ideographic':
        anchorY = height * 0.8;
        break;
    }
    var rotateWithView = state.rotateWithView ? 1.0 : 0.0;
    // this.rotation_ is anti-clockwise, but rotation is clockwise
    var rotation = /** @type {number} */ (-state.rotation);
    var cos = Math.cos(rotation);
    var sin = Math.sin(rotation);
    var numIndices = this.indices.length;
    var numVertices = this.vertices.length;
    var i, n, offsetX, offsetY, x, y;
    for (i = offset; i < end; i += stride) {
      x = flatCoordinates[i] - this.origin[0];
      y = flatCoordinates[i + 1] - this.origin[1];

      // There are 4 vertices per [x, y] point, one for each corner of the
      // rectangle we're going to draw. We'd use 1 vertex per [x, y] point if
      // WebGL supported Geometry Shaders (which can emit new vertices), but that
      // is not currently the case.
      //
      // And each vertex includes 7 values: the x and y coordinates, the x and
      // y offsets used to calculate the position of the corner, the u and
      // v texture coordinates for the corner, and whether the
      // the image should be rotated with the view (rotateWithView).

      n = numVertices / 7;

      // bottom-left corner
      offsetX = -anchorX;
      offsetY = -(height - anchorY);
      this.vertices[numVertices++] = x;
      this.vertices[numVertices++] = y;
      this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
      this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
      this.vertices[numVertices++] = 0;
      this.vertices[numVertices++] = 1;
      this.vertices[numVertices++] = rotateWithView;

      // bottom-right corner
      offsetX = width - anchorX;
      offsetY = -(height - anchorY);
      this.vertices[numVertices++] = x;
      this.vertices[numVertices++] = y;
      this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
      this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
      this.vertices[numVertices++] = 1;
      this.vertices[numVertices++] = 1;
      this.vertices[numVertices++] = rotateWithView;

      // top-right corner
      offsetX = width - anchorX;
      offsetY = anchorY;
      this.vertices[numVertices++] = x;
      this.vertices[numVertices++] = y;
      this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
      this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
      this.vertices[numVertices++] = 1;
      this.vertices[numVertices++] = 0;
      this.vertices[numVertices++] = rotateWithView;

      // top-left corner
      offsetX = -anchorX;
      offsetY = anchorY;
      this.vertices[numVertices++] = x;
      this.vertices[numVertices++] = y;
      this.vertices[numVertices++] = offsetX * cos - offsetY * sin;
      this.vertices[numVertices++] = offsetX * sin + offsetY * cos;
      this.vertices[numVertices++] = 0;
      this.vertices[numVertices++] = 0;
      this.vertices[numVertices++] = rotateWithView;

      this.indices[numIndices++] = n;
      this.indices[numIndices++] = n + 1;
      this.indices[numIndices++] = n + 2;
      this.indices[numIndices++] = n;
      this.indices[numIndices++] = n + 2;
      this.indices[numIndices++] = n + 3;
    }

    return numVertices;
  };


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.finish = function(context) {
    var gl = context.getGL();

    this.startIndices.push(this.indices.length);

    // create, bind, and populate the vertices buffer
    this.verticesBuffer = new ol.webgl.Buffer(this.vertices);

    // create, bind, and populate the indices buffer
    this.indicesBuffer = new ol.webgl.Buffer(this.indices);

    // create textures
    this.createTextures_(gl);

    this.images_ = [];
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
      scale: undefined,
      rotation: undefined,
      rotateWithView: undefined,
      height: undefined,
      width: undefined
    };
  };


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
    // get the program
    var fragmentShader = ol.render.webgl.textreplay.defaultshader.fragment;
    var vertexShader = ol.render.webgl.textreplay.defaultshader.vertex;
    var program = context.getProgram(fragmentShader, vertexShader);

    // get the locations
    var locations;
    if (!this.defaultLocations_) {
      // eslint-disable-next-line openlayers-internal/no-missing-requires
      locations = new ol.render.webgl.textreplay.defaultshader.Locations(gl, program);
      this.defaultLocations_ = locations;
    } else {
      locations = this.defaultLocations_;
    }

    // use the program (FIXME: use the return value)
    context.useProgram(program);

    // enable the vertex attrib arrays
    gl.enableVertexAttribArray(locations.a_position);
    gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
        false, 28, 0);

    gl.enableVertexAttribArray(locations.a_offsets);
    gl.vertexAttribPointer(locations.a_offsets, 2, ol.webgl.FLOAT,
        false, 28, 8);

    gl.enableVertexAttribArray(locations.a_texCoord);
    gl.vertexAttribPointer(locations.a_texCoord, 2, ol.webgl.FLOAT,
        false, 28, 16);

    gl.enableVertexAttribArray(locations.a_rotateWithView);
    gl.vertexAttribPointer(locations.a_rotateWithView, 1, ol.webgl.FLOAT,
        false, 28, 24);

    return locations;
  };


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.shutDownProgram = function(gl, locations) {
    gl.disableVertexAttribArray(locations.a_position);
    gl.disableVertexAttribArray(locations.a_offsets);
    gl.disableVertexAttribArray(locations.a_texCoord);
    gl.disableVertexAttribArray(locations.a_rotateWithView);
  };


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
    var textures = this.textures_;
    var startIndices = this.startIndices;

    var i, ii, start, end, feature, featureUid;
    for (i = 0, ii = textures.length, start = 0; i < ii; ++i) {
      feature = this.startIndicesFeature[i];
      featureUid = ol.getUid(feature).toString();

      end = startIndices[i];
      if (skippedFeaturesHash[featureUid] === undefined) {
        gl.bindTexture(ol.webgl.TEXTURE_2D, textures[i]);
        this.drawElements(gl, context, start, end);
      }
      start = end;
    }
  };


  /**
   * @inheritDoc
   */
  ol.render.webgl.TextReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
      featureCallback, opt_hitExtent) {
    var textures = this.textures_;
    var startIndices = this.startIndices;

    var i, start, end, feature, featureUid;
    for (i = textures.length - 1; i >= 0; --i) {
      feature = this.startIndicesFeature[i];
      featureUid = ol.getUid(feature).toString();

      start = (i > 0) ? startIndices[i - 1] : 0;
      end = startIndices[i];
      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || ol.extent.intersects(
              /** @type {Array<number>} */ (opt_hitExtent),
              feature.getGeometry().getExtent()))) {
        gl.bindTexture(ol.webgl.TEXTURE_2D, textures[i]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.drawElements(gl, context, start, end);

        var result = featureCallback(feature);
        if (result) {
          return result;
        }
      }
    }
    return undefined;
  };


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
   * @private
   * @param {WebGLRenderingContext} gl Gl.
   */
  ol.render.webgl.TextReplay.prototype.createTextures_ = function(gl) {
    for (var i = 0, ii = this.images_.length; i < ii; ++i) {
      var image = this.images_[i];
      this.textures_.push(ol.webgl.Context.createTexture(
          gl, image, ol.webgl.CLAMP_TO_EDGE, ol.webgl.CLAMP_TO_EDGE));
    }
  };


  /**
   * @inheritDoc
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
