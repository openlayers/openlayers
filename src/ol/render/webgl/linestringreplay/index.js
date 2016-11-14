goog.provide('ol.render.webgl.LineStringReplay');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.color');
goog.require('ol.extent');
goog.require('ol.geom.flat.orient');
goog.require('ol.geom.flat.transform');
goog.require('ol.geom.flat.topology');
goog.require('ol.obj');
goog.require('ol.render.webgl');
goog.require('ol.render.webgl.Replay');
goog.require('ol.render.webgl.linestringreplay.defaultshader');
goog.require('ol.webgl');
goog.require('ol.webgl.Buffer');


/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.LineStringReplay = function(tolerance, maxExtent) {
  ol.render.webgl.Replay.call(this, tolerance, maxExtent);

  /**
   * @private
   * @type {ol.render.webgl.linestringreplay.defaultshader.Locations}
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
   * @type {{strokeColor: (Array.<number>|null),
   *         lineCap: (string|undefined),
   *         lineDash: Array.<number>,
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined),
   *         changed: boolean}|null}
   */
  this.state_ = {
    strokeColor: null,
    lineCap: undefined,
    lineDash: null,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined,
    changed: false
  };

};
ol.inherits(ol.render.webgl.LineStringReplay, ol.render.webgl.Replay);


/**
 * Draw one segment.
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
ol.render.webgl.LineStringReplay.prototype.drawCoordinates_ = function(flatCoordinates, offset, end, stride) {

  var i, ii;
  var numVertices = this.vertices.length;
  var numIndices = this.indices.length;
  //To save a vertex, the direction of a point is a product of the sign (1 or -1), a prime from
  //ol.render.webgl.lineStringInstruction, and a rounding factor (1 or 2). If the product is even,
  //we round it. If it is odd, we don't.
  var lineJoin = this.state_.lineJoin === 'bevel' ? 0 :
      this.state_.lineJoin === 'miter' ? 1 : 2;
  var lineCap = this.state_.lineCap === 'butt' ? 0 :
      this.state_.lineCap === 'square' ? 1 : 2;
  var closed = ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, offset, end, stride);
  var startCoords, sign, n;
  var lastIndex = numIndices;
  var lastSign = 1;
  //We need the adjacent vertices to define normals in joins. p0 = last, p1 = current, p2 = next.
  var p0, p1, p2;

  for (i = offset, ii = end; i < ii; i += stride) {

    n = numVertices / 7;

    p0 = p1;
    p1 = p2 || [flatCoordinates[i], flatCoordinates[i + 1]];
    //First vertex.
    if (i === offset) {
      p2 = [flatCoordinates[i + stride], flatCoordinates[i + stride + 1]];
      if (end - offset === stride * 2 && ol.array.equals(p1, p2)) {
        break;
      }
      if (closed) {
        //A closed line! Complete the circle.
        p0 = [flatCoordinates[end - stride * 2],
          flatCoordinates[end - stride * 2 + 1]];

        startCoords = p2;
      } else {
        //Add the first two/four vertices.

        if (lineCap) {
          numVertices = this.addVertices_([0, 0], p1, p2,
              lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_([0, 0], p1, p2,
              -lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE_CAP * lineCap, numVertices);

          this.indices[numIndices++] = n + 2;
          this.indices[numIndices++] = n;
          this.indices[numIndices++] = n + 1;

          this.indices[numIndices++] = n + 1;
          this.indices[numIndices++] = n + 3;
          this.indices[numIndices++] = n + 2;

        }

        numVertices = this.addVertices_([0, 0], p1, p2,
            lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_([0, 0], p1, p2,
            -lastSign * ol.render.webgl.lineStringInstruction.BEGIN_LINE * (lineCap || 1), numVertices);

        lastIndex = numVertices / 7 - 1;

        continue;
      }
    } else if (i === end - stride) {
      //Last vertex.
      if (closed) {
        //Same as the first vertex.
        p2 = startCoords;
        break;
      } else {
        //For the compiler not to complain. This will never be [0, 0].
        ol.DEBUG && console.assert(p0, 'p0 should be defined');
        p0 = p0 || [0, 0];

        numVertices = this.addVertices_(p0, p1, [0, 0],
            lastSign * ol.render.webgl.lineStringInstruction.END_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_(p0, p1, [0, 0],
            -lastSign * ol.render.webgl.lineStringInstruction.END_LINE * (lineCap || 1), numVertices);

        this.indices[numIndices++] = n;
        this.indices[numIndices++] = lastIndex - 1;
        this.indices[numIndices++] = lastIndex;

        this.indices[numIndices++] = lastIndex;
        this.indices[numIndices++] = n + 1;
        this.indices[numIndices++] = n;

        if (lineCap) {
          numVertices = this.addVertices_(p0, p1, [0, 0],
              lastSign * ol.render.webgl.lineStringInstruction.END_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_(p0, p1, [0, 0],
              -lastSign * ol.render.webgl.lineStringInstruction.END_LINE_CAP * lineCap, numVertices);

          this.indices[numIndices++] = n + 2;
          this.indices[numIndices++] = n;
          this.indices[numIndices++] = n + 1;

          this.indices[numIndices++] = n + 1;
          this.indices[numIndices++] = n + 3;
          this.indices[numIndices++] = n + 2;

        }

        break;
      }
    } else {
      p2 = [flatCoordinates[i + stride], flatCoordinates[i + stride + 1]];
    }

    // We group CW and straight lines, thus the not so inituitive CCW checking function.
    sign = ol.render.webgl.triangleIsCounterClockwise(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1])
        ? -1 : 1;

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.lineStringInstruction.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.lineStringInstruction.BEVEL_SECOND * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        -sign * ol.render.webgl.lineStringInstruction.MITER_BOTTOM * (lineJoin || 1), numVertices);

    if (i > offset) {
      this.indices[numIndices++] = n;
      this.indices[numIndices++] = lastIndex - 1;
      this.indices[numIndices++] = lastIndex;

      this.indices[numIndices++] = n + 2;
      this.indices[numIndices++] = n;
      this.indices[numIndices++] = lastSign * sign > 0 ? lastIndex : lastIndex - 1;
    }

    this.indices[numIndices++] = n;
    this.indices[numIndices++] = n + 2;
    this.indices[numIndices++] = n + 1;

    lastIndex = n + 2;
    lastSign = sign;

    //Add miter
    if (lineJoin) {
      numVertices = this.addVertices_(p0, p1, p2,
          sign * ol.render.webgl.lineStringInstruction.MITER_TOP * lineJoin, numVertices);

      this.indices[numIndices++] = n + 1;
      this.indices[numIndices++] = n + 3;
      this.indices[numIndices++] = n;
    }
  }

  if (closed) {
    //Link the last triangle/rhombus to the first one.
    //n will never be numVertices / 7 here. However, the compiler complains otherwise.
    ol.DEBUG && console.assert(n, 'n should be defined');
    n = n || numVertices / 7;
    sign = ol.geom.flat.orient.linearRingIsClockwise([p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]], 0, 6, 2)
        ? 1 : -1;

    numVertices = this.addVertices_(p0, p1, p2,
        sign * ol.render.webgl.lineStringInstruction.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
        -sign * ol.render.webgl.lineStringInstruction.MITER_BOTTOM * (lineJoin || 1), numVertices);

    this.indices[numIndices++] = n;
    this.indices[numIndices++] = lastIndex - 1;
    this.indices[numIndices++] = lastIndex;

    this.indices[numIndices++] = n + 1;
    this.indices[numIndices++] = n;
    this.indices[numIndices++] = lastSign * sign > 0 ? lastIndex : lastIndex - 1;
  }
};

/**
 * @param {Array.<number>} p0 Last coordinates.
 * @param {Array.<number>} p1 Current coordinates.
 * @param {Array.<number>} p2 Next coordinates.
 * @param {number} product Sign, instruction, and rounding product.
 * @param {number} numVertices Vertex counter.
 * @return {number} Vertex counter.
 * @private
 */
ol.render.webgl.LineStringReplay.prototype.addVertices_ = function(p0, p1, p2, product, numVertices) {
  this.vertices[numVertices++] = p0[0];
  this.vertices[numVertices++] = p0[1];
  this.vertices[numVertices++] = p1[0];
  this.vertices[numVertices++] = p1[1];
  this.vertices[numVertices++] = p2[0];
  this.vertices[numVertices++] = p2[1];
  this.vertices[numVertices++] = product;

  return numVertices;
};

/**
 * Check if the linestring can be drawn (i. e. valid).
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 * @return {boolean} The linestring can be drawn.
 * @private
 */
ol.render.webgl.LineStringReplay.prototype.isValid_ = function(flatCoordinates, offset, end, stride) {
  var range = end - offset;
  if (range < stride * 2) {
    return false;
  } else if (range === stride * 2) {
    var firstP = [flatCoordinates[offset], flatCoordinates[offset + 1]];
    var lastP = [flatCoordinates[offset + stride], flatCoordinates[offset + stride + 1]];
    return !ol.array.equals(firstP, lastP);
  }

  return true;
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.drawLineString = function(lineStringGeometry, feature) {
  var flatCoordinates = lineStringGeometry.getFlatCoordinates();
  var stride = lineStringGeometry.getStride();
  if (this.isValid_(flatCoordinates, 0, flatCoordinates.length, stride)) {
    flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
        stride, -this.origin[0], -this.origin[1]);
    if (this.state_.changed) {
      this.styleIndices_.push(this.indices.length);
      this.state_.changed = false;
    }
    this.startIndices.push(this.indices.length);
    this.startIndicesFeature.push(feature);
    this.drawCoordinates_(
        flatCoordinates, 0, flatCoordinates.length, stride);
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  var indexCount = this.indices.length;
  var lineStringGeometries = multiLineStringGeometry.getLineStrings();
  var i, ii;
  for (i = 0, ii = lineStringGeometries.length; i < ii; ++i) {
    var flatCoordinates = lineStringGeometries[i].getFlatCoordinates();
    var stride = lineStringGeometries[i].getStride();
    if (this.isValid_(flatCoordinates, 0, flatCoordinates.length, stride)) {
      flatCoordinates = ol.geom.flat.transform.translate(flatCoordinates, 0, flatCoordinates.length,
          stride, -this.origin[0], -this.origin[1]);
      this.drawCoordinates_(
          flatCoordinates, 0, flatCoordinates.length, stride);
    }
  }
  if (this.indices.length > indexCount) {
    this.startIndices.push(indexCount);
    this.startIndicesFeature.push(feature);
    if (this.state_.changed) {
      this.styleIndices_.push(indexCount);
      this.state_.changed = false;
    }
  }
};


/**
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {Array.<Array.<number>>} holeFlatCoordinates Hole flat coordinates.
 * @param {number} stride Stride.
 */
ol.render.webgl.LineStringReplay.prototype.drawPolygonCoordinates = function(
    flatCoordinates, holeFlatCoordinates, stride) {
  if (!ol.geom.flat.topology.lineStringIsClosed(flatCoordinates, 0,
      flatCoordinates.length, stride)) {
    flatCoordinates.push(flatCoordinates[0]);
    flatCoordinates.push(flatCoordinates[1]);
  }
  this.drawCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
  if (holeFlatCoordinates.length) {
    var i, ii;
    for (i = 0, ii = holeFlatCoordinates.length; i < ii; ++i) {
      if (!ol.geom.flat.topology.lineStringIsClosed(holeFlatCoordinates[i], 0,
          holeFlatCoordinates[i].length, stride)) {
        holeFlatCoordinates[i].push(holeFlatCoordinates[i][0]);
        holeFlatCoordinates[i].push(holeFlatCoordinates[i][1]);
      }
      this.drawCoordinates_(holeFlatCoordinates[i], 0,
          holeFlatCoordinates[i].length, stride);
    }
  }
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number=} opt_index Index count.
 */
ol.render.webgl.LineStringReplay.prototype.setPolygonStyle = function(feature, opt_index) {
  var index = opt_index === undefined ? this.indices.length : opt_index;
  this.startIndices.push(index);
  this.startIndicesFeature.push(feature);
  if (this.state_.changed) {
    this.styleIndices_.push(index);
    this.state_.changed = false;
  }
};


/**
 * @return {number} Current index.
 */
ol.render.webgl.LineStringReplay.prototype.getCurrentIndex = function() {
  return this.indices.length;
};


/**
 * @inheritDoc
 **/
ol.render.webgl.LineStringReplay.prototype.finish = function(context) {
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
ol.render.webgl.LineStringReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other LineStringReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
  ol.DEBUG && console.assert(this.verticesBuffer, 'verticesBuffer must not be null');
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
ol.render.webgl.LineStringReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
  // get the program
  var fragmentShader, vertexShader;
  fragmentShader = ol.render.webgl.linestringreplay.defaultshader.fragment;
  vertexShader = ol.render.webgl.linestringreplay.defaultshader.vertex;
  var program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  var locations;
  if (!this.defaultLocations_) {
    locations =
        new ol.render.webgl.linestringreplay.defaultshader.Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_lastPos);
  gl.vertexAttribPointer(locations.a_lastPos, 2, ol.webgl.FLOAT,
      false, 28, 0);

  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, ol.webgl.FLOAT,
      false, 28, 8);

  gl.enableVertexAttribArray(locations.a_nextPos);
  gl.vertexAttribPointer(locations.a_nextPos, 2, ol.webgl.FLOAT,
      false, 28, 16);

  gl.enableVertexAttribArray(locations.a_direction);
  gl.vertexAttribPointer(locations.a_direction, 1, ol.webgl.FLOAT,
      false, 28, 24);

  // Enable renderer specific uniforms.
  gl.uniform2fv(locations.u_size, size);
  gl.uniform1f(locations.u_pixelRatio, pixelRatio);

  return locations;
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_lastPos);
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_nextPos);
  gl.disableVertexAttribArray(locations.a_direction);
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  //Save GL parameters.
  var tmpDepthFunc = /** @type {number} */ (gl.getParameter(gl.DEPTH_FUNC));
  var tmpDepthMask = /** @type {boolean} */ (gl.getParameter(gl.DEPTH_WRITEMASK));

  if (!hitDetection) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.NOTEQUAL);
  }

  if (!ol.obj.isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(gl, context, skippedFeaturesHash);
  } else {
    ol.DEBUG && console.assert(this.styles_.length === this.styleIndices_.length,
        'number of styles and styleIndices match');

    //Draw by style groups to minimize drawElements() calls.
    var i, start, end, nextStyle;
    end = this.startIndices[this.startIndices.length - 1];
    for (i = this.styleIndices_.length - 1; i >= 0; --i) {
      start = this.styleIndices_[i];
      nextStyle = this.styles_[i];
      this.setStrokeStyle_(gl, nextStyle[0], nextStyle[1], nextStyle[2]);
      this.drawElements(gl, context, start, end);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      end = start;
    }
  }
  if (!hitDetection) {
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    //Restore GL parameters.
    gl.depthMask(tmpDepthMask);
    gl.depthFunc(tmpDepthFunc);
  }
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object} skippedFeaturesHash Ids of features to skip.
 */
ol.render.webgl.LineStringReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash) {
  ol.DEBUG && console.assert(this.startIndices.length - 1 === this.startIndicesFeature.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex, featureStart;
  featureIndex = this.startIndices.length - 2;
  end = start = this.startIndices[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setStrokeStyle_(gl, nextStyle[0], nextStyle[1], nextStyle[2]);
    groupStart = this.styleIndices_[i];

    while (featureIndex >= 0 &&
        this.startIndices[featureIndex] >= groupStart) {
      featureStart = this.startIndices[featureIndex];
      feature = this.startIndicesFeature[featureIndex];
      featureUid = ol.getUid(feature).toString();

      if (skippedFeaturesHash[featureUid]) {
        if (start !== end) {
          this.drawElements(gl, context, start, end);
          gl.clear(gl.DEPTH_BUFFER_BIT);
        }
        end = featureStart;
      }
      featureIndex--;
      start = featureStart;
    }
    if (start !== end) {
      this.drawElements(gl, context, start, end);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }
    start = end = groupStart;
  }
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
    featureCallback, opt_hitExtent) {
  ol.DEBUG && console.assert(this.styles_.length === this.styleIndices_.length,
      'number of styles and styleIndices match');
  ol.DEBUG && console.assert(this.startIndices.length - 1 === this.startIndicesFeature.length,
      'number of startIndices and startIndicesFeature match');

  var i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex;
  featureIndex = this.startIndices.length - 2;
  end = this.startIndices[featureIndex + 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    nextStyle = this.styles_[i];
    this.setStrokeStyle_(gl, nextStyle[0], nextStyle[1], nextStyle[2]);
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
 * @param {Array.<number>} color Color.
 * @param {number} lineWidth Line width.
 * @param {number} miterLimit Miter limit.
 */
ol.render.webgl.LineStringReplay.prototype.setStrokeStyle_ = function(gl, color, lineWidth, miterLimit) {
  gl.uniform4fv(this.defaultLocations_.u_color, color);
  gl.uniform1f(this.defaultLocations_.u_lineWidth, lineWidth);
  gl.uniform1f(this.defaultLocations_.u_miterLimit, miterLimit);
};


/**
 * @inheritDoc
 */
ol.render.webgl.LineStringReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  ol.DEBUG && console.assert(this.state_, 'this.state_ should not be null');
  var strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
      strokeStyleLineCap : ol.render.webgl.defaultLineCap;
  var strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
      strokeStyleLineDash : ol.render.webgl.defaultLineDash;
  var strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
      strokeStyleLineJoin : ol.render.webgl.defaultLineJoin;
  var strokeStyleColor = strokeStyle.getColor();
  if (!(strokeStyleColor instanceof CanvasGradient) &&
      !(strokeStyleColor instanceof CanvasPattern)) {
    strokeStyleColor = ol.color.asArray(strokeStyleColor).map(function(c, i) {
      return i != 3 ? c / 255 : c;
    }) || ol.render.webgl.defaultStrokeStyle;
  } else {
    strokeStyleColor = ol.render.webgl.defaultStrokeStyle;
  }
  var strokeStyleWidth = strokeStyle.getWidth();
  strokeStyleWidth = strokeStyleWidth !== undefined ?
      strokeStyleWidth : ol.render.webgl.defaultLineWidth;
  var strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  strokeStyleMiterLimit = strokeStyleMiterLimit !== undefined ?
      strokeStyleMiterLimit : ol.render.webgl.defaultMiterLimit;
  if (!this.state_.strokeColor || !ol.array.equals(this.state_.strokeColor, strokeStyleColor) ||
      this.state_.lineWidth !== strokeStyleWidth || this.state_.miterLimit !== strokeStyleMiterLimit) {
    this.state_.changed = true;
    this.state_.strokeColor = strokeStyleColor;
    this.state_.lineWidth = strokeStyleWidth;
    this.state_.miterLimit = strokeStyleMiterLimit;
    this.styles_.push([strokeStyleColor, strokeStyleWidth, strokeStyleMiterLimit]);
  }
};
