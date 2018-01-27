/**
 * @module ol/render/webgl/LineStringReplay
 */
import {getUid, inherits} from '../../index.js';
import {equals} from '../../array.js';
import {asArray} from '../../color.js';
import {intersects} from '../../extent.js';
import _ol_geom_flat_orient_ from '../../geom/flat/orient.js';
import _ol_geom_flat_transform_ from '../../geom/flat/transform.js';
import {lineStringIsClosed} from '../../geom/flat/topology.js';
import {isEmpty} from '../../obj.js';
import _ol_render_webgl_ from '../webgl.js';
import WebGLReplay from '../webgl/Replay.js';
import _ol_render_webgl_linestringreplay_defaultshader_ from '../webgl/linestringreplay/defaultshader.js';
import _ol_render_webgl_linestringreplay_defaultshader_Locations_ from '../webgl/linestringreplay/defaultshader/Locations.js';
import _ol_webgl_ from '../../webgl.js';
import _ol_webgl_Buffer_ from '../../webgl/Buffer.js';

/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
const WebGLLineStringReplay = function(tolerance, maxExtent) {
  WebGLReplay.call(this, tolerance, maxExtent);

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
   *         lineDashOffset: (number|undefined),
   *         lineJoin: (string|undefined),
   *         lineWidth: (number|undefined),
   *         miterLimit: (number|undefined),
   *         changed: boolean}|null}
   */
  this.state_ = {
    strokeColor: null,
    lineCap: undefined,
    lineDash: null,
    lineDashOffset: undefined,
    lineJoin: undefined,
    lineWidth: undefined,
    miterLimit: undefined,
    changed: false
  };

};

inherits(WebGLLineStringReplay, WebGLReplay);


/**
 * Draw one segment.
 * @private
 * @param {Array.<number>} flatCoordinates Flat coordinates.
 * @param {number} offset Offset.
 * @param {number} end End.
 * @param {number} stride Stride.
 */
WebGLLineStringReplay.prototype.drawCoordinates_ = function(flatCoordinates, offset, end, stride) {

  let i, ii;
  let numVertices = this.vertices.length;
  let numIndices = this.indices.length;
  //To save a vertex, the direction of a point is a product of the sign (1 or -1), a prime from
  //ol.render.webgl.LineStringReplay.Instruction_, and a rounding factor (1 or 2). If the product is even,
  //we round it. If it is odd, we don't.
  const lineJoin = this.state_.lineJoin === 'bevel' ? 0 :
    this.state_.lineJoin === 'miter' ? 1 : 2;
  const lineCap = this.state_.lineCap === 'butt' ? 0 :
    this.state_.lineCap === 'square' ? 1 : 2;
  const closed = lineStringIsClosed(flatCoordinates, offset, end, stride);
  let startCoords, sign, n;
  let lastIndex = numIndices;
  let lastSign = 1;
  //We need the adjacent vertices to define normals in joins. p0 = last, p1 = current, p2 = next.
  let p0, p1, p2;

  for (i = offset, ii = end; i < ii; i += stride) {

    n = numVertices / 7;

    p0 = p1;
    p1 = p2 || [flatCoordinates[i], flatCoordinates[i + 1]];
    //First vertex.
    if (i === offset) {
      p2 = [flatCoordinates[i + stride], flatCoordinates[i + stride + 1]];
      if (end - offset === stride * 2 && equals(p1, p2)) {
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
            lastSign * WebGLLineStringReplay.Instruction_.BEGIN_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_([0, 0], p1, p2,
            -lastSign * WebGLLineStringReplay.Instruction_.BEGIN_LINE_CAP * lineCap, numVertices);

          this.indices[numIndices++] = n + 2;
          this.indices[numIndices++] = n;
          this.indices[numIndices++] = n + 1;

          this.indices[numIndices++] = n + 1;
          this.indices[numIndices++] = n + 3;
          this.indices[numIndices++] = n + 2;

        }

        numVertices = this.addVertices_([0, 0], p1, p2,
          lastSign * WebGLLineStringReplay.Instruction_.BEGIN_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_([0, 0], p1, p2,
          -lastSign * WebGLLineStringReplay.Instruction_.BEGIN_LINE * (lineCap || 1), numVertices);

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
        p0 = p0 || [0, 0];

        numVertices = this.addVertices_(p0, p1, [0, 0],
          lastSign * WebGLLineStringReplay.Instruction_.END_LINE * (lineCap || 1), numVertices);

        numVertices = this.addVertices_(p0, p1, [0, 0],
          -lastSign * WebGLLineStringReplay.Instruction_.END_LINE * (lineCap || 1), numVertices);

        this.indices[numIndices++] = n;
        this.indices[numIndices++] = lastIndex - 1;
        this.indices[numIndices++] = lastIndex;

        this.indices[numIndices++] = lastIndex;
        this.indices[numIndices++] = n + 1;
        this.indices[numIndices++] = n;

        if (lineCap) {
          numVertices = this.addVertices_(p0, p1, [0, 0],
            lastSign * WebGLLineStringReplay.Instruction_.END_LINE_CAP * lineCap, numVertices);

          numVertices = this.addVertices_(p0, p1, [0, 0],
            -lastSign * WebGLLineStringReplay.Instruction_.END_LINE_CAP * lineCap, numVertices);

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
    sign = _ol_render_webgl_.triangleIsCounterClockwise(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1])
      ? -1 : 1;

    numVertices = this.addVertices_(p0, p1, p2,
      sign * WebGLLineStringReplay.Instruction_.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
      sign * WebGLLineStringReplay.Instruction_.BEVEL_SECOND * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
      -sign * WebGLLineStringReplay.Instruction_.MITER_BOTTOM * (lineJoin || 1), numVertices);

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
        sign * WebGLLineStringReplay.Instruction_.MITER_TOP * lineJoin, numVertices);

      this.indices[numIndices++] = n + 1;
      this.indices[numIndices++] = n + 3;
      this.indices[numIndices++] = n;
    }
  }

  if (closed) {
    n = n || numVertices / 7;
    sign = _ol_geom_flat_orient_.linearRingIsClockwise([p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]], 0, 6, 2)
      ? 1 : -1;

    numVertices = this.addVertices_(p0, p1, p2,
      sign * WebGLLineStringReplay.Instruction_.BEVEL_FIRST * (lineJoin || 1), numVertices);

    numVertices = this.addVertices_(p0, p1, p2,
      -sign * WebGLLineStringReplay.Instruction_.MITER_BOTTOM * (lineJoin || 1), numVertices);

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
WebGLLineStringReplay.prototype.addVertices_ = function(p0, p1, p2, product, numVertices) {
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
WebGLLineStringReplay.prototype.isValid_ = function(flatCoordinates, offset, end, stride) {
  const range = end - offset;
  if (range < stride * 2) {
    return false;
  } else if (range === stride * 2) {
    const firstP = [flatCoordinates[offset], flatCoordinates[offset + 1]];
    const lastP = [flatCoordinates[offset + stride], flatCoordinates[offset + stride + 1]];
    return !equals(firstP, lastP);
  }

  return true;
};


/**
 * @inheritDoc
 */
WebGLLineStringReplay.prototype.drawLineString = function(lineStringGeometry, feature) {
  let flatCoordinates = lineStringGeometry.getFlatCoordinates();
  const stride = lineStringGeometry.getStride();
  if (this.isValid_(flatCoordinates, 0, flatCoordinates.length, stride)) {
    flatCoordinates = _ol_geom_flat_transform_.translate(flatCoordinates, 0, flatCoordinates.length,
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
WebGLLineStringReplay.prototype.drawMultiLineString = function(multiLineStringGeometry, feature) {
  const indexCount = this.indices.length;
  const ends = multiLineStringGeometry.getEnds();
  ends.unshift(0);
  const flatCoordinates = multiLineStringGeometry.getFlatCoordinates();
  const stride = multiLineStringGeometry.getStride();
  let i, ii;
  if (ends.length > 1) {
    for (i = 1, ii = ends.length; i < ii; ++i) {
      if (this.isValid_(flatCoordinates, ends[i - 1], ends[i], stride)) {
        const lineString = _ol_geom_flat_transform_.translate(flatCoordinates, ends[i - 1], ends[i],
          stride, -this.origin[0], -this.origin[1]);
        this.drawCoordinates_(
          lineString, 0, lineString.length, stride);
      }
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
WebGLLineStringReplay.prototype.drawPolygonCoordinates = function(
  flatCoordinates, holeFlatCoordinates, stride) {
  if (!lineStringIsClosed(flatCoordinates, 0, flatCoordinates.length, stride)) {
    flatCoordinates.push(flatCoordinates[0]);
    flatCoordinates.push(flatCoordinates[1]);
  }
  this.drawCoordinates_(flatCoordinates, 0, flatCoordinates.length, stride);
  if (holeFlatCoordinates.length) {
    let i, ii;
    for (i = 0, ii = holeFlatCoordinates.length; i < ii; ++i) {
      if (!lineStringIsClosed(holeFlatCoordinates[i], 0, holeFlatCoordinates[i].length, stride)) {
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
WebGLLineStringReplay.prototype.setPolygonStyle = function(feature, opt_index) {
  const index = opt_index === undefined ? this.indices.length : opt_index;
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
WebGLLineStringReplay.prototype.getCurrentIndex = function() {
  return this.indices.length;
};


/**
 * @inheritDoc
 **/
WebGLLineStringReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new _ol_webgl_Buffer_(this.vertices);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new _ol_webgl_Buffer_(this.indices);

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
WebGLLineStringReplay.prototype.getDeleteResourcesFunction = function(context) {
  const verticesBuffer = this.verticesBuffer;
  const indicesBuffer = this.indicesBuffer;
  return function() {
    context.deleteBuffer(verticesBuffer);
    context.deleteBuffer(indicesBuffer);
  };
};


/**
 * @inheritDoc
 */
WebGLLineStringReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
  // get the program
  const fragmentShader = _ol_render_webgl_linestringreplay_defaultshader_.fragment;
  const vertexShader = _ol_render_webgl_linestringreplay_defaultshader_.vertex;
  const program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  let locations;
  if (!this.defaultLocations_) {
    locations = new _ol_render_webgl_linestringreplay_defaultshader_Locations_(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_lastPos);
  gl.vertexAttribPointer(locations.a_lastPos, 2, _ol_webgl_.FLOAT,
    false, 28, 0);

  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, _ol_webgl_.FLOAT,
    false, 28, 8);

  gl.enableVertexAttribArray(locations.a_nextPos);
  gl.vertexAttribPointer(locations.a_nextPos, 2, _ol_webgl_.FLOAT,
    false, 28, 16);

  gl.enableVertexAttribArray(locations.a_direction);
  gl.vertexAttribPointer(locations.a_direction, 1, _ol_webgl_.FLOAT,
    false, 28, 24);

  // Enable renderer specific uniforms.
  gl.uniform2fv(locations.u_size, size);
  gl.uniform1f(locations.u_pixelRatio, pixelRatio);

  return locations;
};


/**
 * @inheritDoc
 */
WebGLLineStringReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_lastPos);
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_nextPos);
  gl.disableVertexAttribArray(locations.a_direction);
};


/**
 * @inheritDoc
 */
WebGLLineStringReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  //Save GL parameters.
  const tmpDepthFunc = /** @type {number} */ (gl.getParameter(gl.DEPTH_FUNC));
  const tmpDepthMask = /** @type {boolean} */ (gl.getParameter(gl.DEPTH_WRITEMASK));

  if (!hitDetection) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.NOTEQUAL);
  }

  if (!isEmpty(skippedFeaturesHash)) {
    this.drawReplaySkipping_(gl, context, skippedFeaturesHash);
  } else {
    //Draw by style groups to minimize drawElements() calls.
    let i, start, end, nextStyle;
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
WebGLLineStringReplay.prototype.drawReplaySkipping_ = function(gl, context, skippedFeaturesHash) {
  let i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex, featureStart;
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
      featureUid = getUid(feature).toString();

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
WebGLLineStringReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash,
  featureCallback, opt_hitExtent) {
  let i, start, end, nextStyle, groupStart, feature, featureUid, featureIndex;
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
      featureUid = getUid(feature).toString();

      if (skippedFeaturesHash[featureUid] === undefined &&
          feature.getGeometry() &&
          (opt_hitExtent === undefined || intersects(
            /** @type {Array<number>} */ (opt_hitExtent),
            feature.getGeometry().getExtent()))) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.drawElements(gl, context, start, end);

        const result = featureCallback(feature);

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
WebGLLineStringReplay.prototype.setStrokeStyle_ = function(gl, color, lineWidth, miterLimit) {
  gl.uniform4fv(this.defaultLocations_.u_color, color);
  gl.uniform1f(this.defaultLocations_.u_lineWidth, lineWidth);
  gl.uniform1f(this.defaultLocations_.u_miterLimit, miterLimit);
};


/**
 * @inheritDoc
 */
WebGLLineStringReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {
  const strokeStyleLineCap = strokeStyle.getLineCap();
  this.state_.lineCap = strokeStyleLineCap !== undefined ?
    strokeStyleLineCap : _ol_render_webgl_.defaultLineCap;
  const strokeStyleLineDash = strokeStyle.getLineDash();
  this.state_.lineDash = strokeStyleLineDash ?
    strokeStyleLineDash : _ol_render_webgl_.defaultLineDash;
  const strokeStyleLineDashOffset = strokeStyle.getLineDashOffset();
  this.state_.lineDashOffset = strokeStyleLineDashOffset ?
    strokeStyleLineDashOffset : _ol_render_webgl_.defaultLineDashOffset;
  const strokeStyleLineJoin = strokeStyle.getLineJoin();
  this.state_.lineJoin = strokeStyleLineJoin !== undefined ?
    strokeStyleLineJoin : _ol_render_webgl_.defaultLineJoin;
  let strokeStyleColor = strokeStyle.getColor();
  if (!(strokeStyleColor instanceof CanvasGradient) &&
      !(strokeStyleColor instanceof CanvasPattern)) {
    strokeStyleColor = asArray(strokeStyleColor).map(function(c, i) {
      return i != 3 ? c / 255 : c;
    }) || _ol_render_webgl_.defaultStrokeStyle;
  } else {
    strokeStyleColor = _ol_render_webgl_.defaultStrokeStyle;
  }
  let strokeStyleWidth = strokeStyle.getWidth();
  strokeStyleWidth = strokeStyleWidth !== undefined ?
    strokeStyleWidth : _ol_render_webgl_.defaultLineWidth;
  let strokeStyleMiterLimit = strokeStyle.getMiterLimit();
  strokeStyleMiterLimit = strokeStyleMiterLimit !== undefined ?
    strokeStyleMiterLimit : _ol_render_webgl_.defaultMiterLimit;
  if (!this.state_.strokeColor || !equals(this.state_.strokeColor, strokeStyleColor) ||
      this.state_.lineWidth !== strokeStyleWidth || this.state_.miterLimit !== strokeStyleMiterLimit) {
    this.state_.changed = true;
    this.state_.strokeColor = strokeStyleColor;
    this.state_.lineWidth = strokeStyleWidth;
    this.state_.miterLimit = strokeStyleMiterLimit;
    this.styles_.push([strokeStyleColor, strokeStyleWidth, strokeStyleMiterLimit]);
  }
};

/**
 * @enum {number}
 * @private
 */
WebGLLineStringReplay.Instruction_ = {
  ROUND: 2,
  BEGIN_LINE: 3,
  END_LINE: 5,
  BEGIN_LINE_CAP: 7,
  END_LINE_CAP: 11,
  BEVEL_FIRST: 13,
  BEVEL_SECOND: 17,
  MITER_BOTTOM: 19,
  MITER_TOP: 23
};
export default WebGLLineStringReplay;
