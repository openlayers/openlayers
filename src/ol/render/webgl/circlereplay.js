goog.provide('ol.render.webgl.CircleReplay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.obj');
goog.require('ol.geom.flat.transform');
goog.require('ol.render.webgl.circlereplay.defaultshader');
goog.require('ol.render.webgl.circlereplay.defaultshader.Locations');
goog.require('ol.render.webgl.Replay');
goog.require('ol.render.webgl');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');


/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.CircleReplay = function(tolerance, maxExtent) {
  ol.render.webgl.Replay.call(this, tolerance, maxExtent);

  /**
   * @private
   * @type {ol.render.webgl.circlereplay.defaultshader.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {Array.<Array.<Array.<number>|number>>}
   */
  this.styles_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.styleIndices_ = [];

  /**
   * @private
   * @type {number}
   */
  this.radius_ = 0;

  /**
   * @private
   * @type {{fillColor: (Array.<number>|null),
   *         strokeColor: (Array.<number>|null),
   *         lineDash: Array.<number>,
   *         lineDashOffset: (number|undefined),
   *         lineWidth: (number|undefined),
   *         changed: boolean}|null}
   */
  this.state_ = {
    fillColor: null,
    strokeColor: null,
    lineDash: null,
    lineDashOffset: undefined,
    lineWidth: undefined,
    changed: false
  };

};
ol.inherits(ol.render.webgl.CircleReplay, ol.render.webgl.Replay);


/**
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
ol.render.webgl.CircleReplay.prototype.drawCoordinates_ = function(
    flatCoordinates, offset, end, stride) {
  var numVertices = this.vertices.length;
  var numIndices = this.indices.length;
  var n = numVertices / 4;
  var i, ii;
  for (i = offset, ii = end; i < ii; i += stride) {
    this.vertices[numVertices++] = flatCoordinates[i];
    this.vertices[numVertices++] = flatCoordinates[i + 1];
    this.vertices[numVertices++] = 0;
    this.vertices[numVertices++] = this.radius_;

    this.vertices[numVertices++] = flatCoordinates[i];
    this.vertices[numVertices++] = flatCoordinates[i + 1];
    this.vertices[numVertices++] = 1;
    this.vertices[numVertices++] = this.radius_;

    this.vertices[numVertices++] = flatCoordinates[i];
    this.vertices[numVertices++] = flatCoordinates[i + 1];
    this.vertices[numVertices++] = 2;
    this.vertices[numVertices++] = this.radius_;

    this.vertices[numVertices++] = flatCoordinates[i];
    this.vertices[numVertices++] = flatCoordinates[i + 1];
    this.vertices[numVertices++] = 3;
    this.vertices[numVertices++] = this.radius_;

    this.indices[numIndices++] = n;
    this.indices[numIndices++] = n + 1;
    this.indices[numIndices++] = n + 2;

    this.indices[numIndices++] = n + 2;
    this.indices[numIndices++] = n + 3;
    this.indices[numIndices++] = n;

    n += 4;
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.drawCircle = function(circleGeometry, feature) {
  var radius = circleGeometry.getRadius();
  var stride = circleGeometry.getStride();
  if (radius) {
    this.startIndices.push(this.indices.length);
    this.startIndicesFeature.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(this.indices.length);
      this.state_.changed = false;
    }

    this.radius_ = radius;
    var flatCoordinates = circleGeometry.getFlatCoordinates();
    flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, 2,
        stride, -this.origin[0], -this.origin[1]);
    this.drawCoordinates_(flatCoordinates, 0, 2, stride);
  } else {
    if (this.state_.changed) {
      this.styles_.pop();
      if (this.styles_.length) {
        var lastState = this.styles_[this.styles_.length - 1];
        this.state_.fillColor =  /** @type {Array.<number>} */ (lastState[0]);
        this.state_.strokeColor = /** @type {Array.<number>} */ (lastState[1]);
        this.state_.lineWidth = /** @type {number} */ (lastState[2]);
        this.state_.changed = false;
      }
    }
  }
};


/**
 * @inheritDoc
 **/
ol.render.webgl.CircleReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new ol.webgl.Buffer(this.vertices);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new ol.webgl.Buffer(this.indices);

  this.startIndices.push(this.indices.length);

  //Clean up, if there is nothing to draw
  if (this.styleIndices_.length === 0 && this.styles_.length > 0) {
    this.styles_ = [];
  }

  this.vertices = null;
  this.indices = null;
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other CircleReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  var verticesBuffer = this.verticesBuffer;
  var indicesBuffer = this.indicesBuffer;
  return function() {
    context.deleteBuffer(verticesBuffer);
    context.deleteBuffer(indicesBuffer);
  };
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
  // get the program
  var fragmentShader, vertexShader;
  fragmentShader = ol.render.webgl.circlereplay.defaultshader.fragment;
  vertexShader = ol.render.webgl.circlereplay.defaultshader.vertex;
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations = new ol.render.webgl.circlereplay.defaultshader.Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
      false, 16, 0);

  gl.enableVertexAttribArray(locations.a_instruction);
  gl.vertexAttribPointer(locations.a_instruction, 1, ol.webgl.FLOAT,
      false, 16, 8);

  gl.enableVertexAttribArray(locations.a_radius);
  gl.vertexAttribPointer(locations.a_radius, 1, ol.webgl.FLOAT,
      false, 16, 12);

  // Enable renderer specific uniforms.
  gl.uniform2fv(locations.u_size, size);
  gl.uniform1f(locations.u_pixelRatio, pixelRatio);

  return locations;
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_instruction);
  gl.disableVertexAttribArray(locations.a_radius);
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  if (!ol.obj.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(gl, context, skippedFeaturesHash);
  } else {
    //Draw by style groups to minimize drawElements() calls.
    var i, start, end, nextStyle;
    end = this.startIndices[this.startIndices.length - 1];
    for (i = this.styleIndices_.length - 1; i >= 0; --i) {
      start = this.styleIndices_[i];
      nextStyle = this.styles_[i];
      this.setFillStyle_(gl, /** @type {Array.<number>} */ (nextStyle[0]));
      this.setStrokeStyle_(gl, /** @type {Array.<number>} */ (nextStyle[1]),
          /** @type {number} */ (nextStyle[2]));
      this.drawElements(gl, context, start, end);
      end = start;
    }
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex;
  featureIndex = this.startIndices.length - 2;
  end = this.startIndices[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, /** @type {Array.<number>} */ (nextStyle[0]));
    this.setStrokeStyle_(gl, /** @type {Array.<number>} */ (nextStyle[1]),
        /** @type {number} */ (nextStyle[2]));
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      start = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || ol.extent.intersects(
              /** @type {Array<number>} */ (opt_hitExtent),
              feature.getGeometry().getExtent()))) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.drawElements(gl, context, start, end);

        var result = featureCallback(feature);

        if (result) {
          return result;
        }

      }
      featureIndex--;
      end = start;
    }
  }
  return undefined;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 */
ol.render.webgl.CircleReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash) {
  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex, featureStart;
  featureIndex = this.startIndices.length - 2;
  end = start = this.startIndices[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, /** @type {Array.<number>} */ (nextStyle[0]));
    this.setStrokeStyle_(gl, /** @type {Array.<number>} */ (nextStyle[1]),
        /** @type {number} */ (nextStyle[2]));
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      featureStart = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid]) {
        if (start !== end) {
          this.drawElements(gl, context, start, end);
        }
        end = featureStart;
      }
      featureIndex--;
      start = featureStart;
    }
    if (start !== end) {
      this.drawElements(gl, context, start, end);
    }
    start = end = groupStart;
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {Array.<number>} color Color.
 */
ol.render.webgl.CircleReplay.prototype.setFillStyle_ = function(gl, color) {
  gl.uniform4fv(this.defaultLocations_.u_fillColor, color);
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {Array.<number>} color Color.
 * @param {number} lineWidth Line width.
 */
ol.render.webgl.CircleReplay.prototype.setStrokeStyle_ = function(gl, color, lineWidth) {
  gl.uniform4fv(this.defaultLocations_.u_strokeColor, color);
  gl.uniform1f(this.defaultLocations_.u_lineWidth, lineWidth);
};


/**
 * @inheritDoc
 */
ol.render.webgl.CircleReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  var strokeStyleColor, strokeStyleWidth;
  if (strokeStyle) {
    var strokeStyleLineDash = strokeStyle.getLineDash();
    this.state_.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash : ol.render.webgl.defaultLineDash;
    var strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
    this.state_.lineDashOffset = strokeStyleLineDashOffset ?
      strokeStyleLineDashOffset : ol.render.webgl.defaultLineDashOffset;
    strokeStyleColor = strokeStyle.getColor();
    if (!(strokeStyleColor instanceof CanvasGradient) &&
        !(strokeStyleColor instanceof CanvasPattern)) {
      strokeStyleColor = ol.color.asArray(strokeStyleColor).map(function(c, i) {
        return i != 3 ? c / 255 : c;
      }) || ol.render.webgl.defaultStrokeStyle;
    } else {
      strokeStyleColor = ol.render.webgl.defaultStrokeStyle;
    }
    strokeStyleWidth = strokeStyle.getWidth();
    strokeStyleWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : ol.render.webgl.defaultLineWidth;
  } else {
    strokeStyleColor = [0, 0, 0, 0];
    strokeStyleWidth = 0;
  }
  var fillStyleColor = fillStyle ? fillStyle.getColor() : [0, 0, 0, 0];
  if (!(fillStyleColor instanceof CanvasGradient) &&
      !(fillStyleColor instanceof CanvasPattern)) {
    fillStyleColor = ol.color.asArray(fillStyleColor).map(function(c, i) {
      return i != 3 ? c / 255 : c;
    }) || ol.render.webgl.defaultFillStyle;
  } else {
    fillStyleColor = ol.render.webgl.defaultFillStyle;
  }
  if (!this.state_.strokeColor || !ol.array.equals(this.state_.strokeColor, strokeStyleColor) ||
      !this.state_.fillColor || !ol.array.equals(this.state_.fillColor, fillStyleColor) ||
      this.state_.lineWidth !== strokeStyleWidth) {
    this.state_.changed = true;
    this.state_.fillColor = fillStyleColor;
    this.state_.strokeColor = strokeStyleColor;
    this.state_.lineWidth = strokeStyleWidth;
    this.styles_.push([fillStyleColor, strokeStyleColor, strokeStyleWidth]);
  }
};
