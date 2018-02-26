/**
 * @module ol/render/webgl/CoverageReplay
 */
import {inherits} from '../../index.js';
import {equals, extend} from '../../array.js';
import _ol_geom_flat_transform_ from '../../geom/flat/transform.js';
import _ol_render_webgl_coveragereplay_defaultshader_ from './coveragereplay/defaultshader.js';
import _ol_render_webgl_coveragereplay_defaultshader_Locations_ from './coveragereplay/defaultshader/Locations.js';
import WebGLReplay from './Replay.js';
import _ol_webgl_ from '../../webgl.js';
import _ol_webgl_Buffer_ from '../../webgl/Buffer.js';

/**
 * @constructor
 * @extends {ol.render.webgl.Replay}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
const WebGLCoverageReplay = function(tolerance, maxExtent) {
  WebGLReplay.call(this, tolerance, maxExtent);

  /**
   * @private
   * @type {ol.render.webgl.coveragereplay.defaultshader.Locations}
   */
  this.defaultLocations_ = null;

  /**
   * @private
   * @type {Array.<Array.<number>>}
   */
  this.styles_ = [];

  /**
   * @private
   * @type {Array.<number>}
   */
  this.styleIndices_ = [];

  /**
   * Indices of a single cell, used as a template.
   * @type {Array.<number>}
   */
  this.cellIndices = [];

  /**
   * @private
   * @type {{fillColor: Array.<number>)}}
   */
  this.state_ = {
    fillColor: []
  };

};

inherits(WebGLCoverageReplay, WebGLReplay);


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.drawCoverage = function(flatCoverage, cellStride) {
  const stride = cellStride + 4;
  const redOffset = cellStride;
  const greenOffset = cellStride + 1;
  const blueOffset = cellStride + 2;
  const alphaOffset = cellStride + 3;
  const state = this.state_;
  const maxIndex = Math.max.apply(null, this.cellIndices) + 1;
  let indexCount = 0;

  this.startIndices.push(this.indices.length);

  for (let i = 0, ii = flatCoverage.length; i < ii; i += stride) {
    const colorArr = [flatCoverage[i + redOffset] / 255,
      flatCoverage[i + greenOffset] / 255, flatCoverage[i + blueOffset] / 255,
      flatCoverage[i + alphaOffset]];
    if (!equals(colorArr, state.fillColor)) {
      this.styles_.push(colorArr);
      this.styleIndices_.push(this.indices.length);
      state.fillColor = colorArr;
    }

    extend(this.vertices, _ol_geom_flat_transform_.translate(flatCoverage, i,
      i + cellStride, 2, -this.origin[0], -this.origin[1]));
    let numIndices = this.indices.length;
    for (let j = 0; j < this.cellIndices.length; ++j) {
      this.indices[numIndices++] = this.cellIndices[j] + indexCount;
    }
    indexCount += maxIndex;
  }
};


/**
 * @inheritDoc
 **/
WebGLCoverageReplay.prototype.finish = function(context) {
  // create, bind, and populate the vertices buffer
  this.verticesBuffer = new _ol_webgl_Buffer_(this.vertices);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new _ol_webgl_Buffer_(this.indices);

  this.startIndices.push(this.indices.length);

  this.vertices = null;
  this.indices = null;
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.getDeleteResourcesFunction = function(context) {
  // We only delete our stuff here. The shaders and the program may
  // be used by other CoverageReplay instances (for other layers). And
  // they will be deleted when disposing of the ol.webgl.Context
  // object.
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
WebGLCoverageReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {
  // get the program
  const fragmentShader = _ol_render_webgl_coveragereplay_defaultshader_.fragment;
  const vertexShader = _ol_render_webgl_coveragereplay_defaultshader_.vertex;
  const program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  let locations;
  if (!this.defaultLocations_) {
    locations = new _ol_render_webgl_coveragereplay_defaultshader_Locations_(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, _ol_webgl_.FLOAT,
    false, 8, 0);

  return locations;
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_position);
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  //Draw by style groups to minimize drawElements() calls.
  let i, start, end, nextStyle;
  end = this.startIndices[this.startIndices.length - 1];
  for (i = this.styleIndices_.length - 1; i >= 0; --i) {
    start = this.styleIndices_[i];
    nextStyle = this.styles_[i];
    this.setFillStyle_(gl, nextStyle);
    this.drawElements(gl, context, start, end);
    end = start;
  }
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.drawHitDetectionReplayOneByOne = function(gl,
  context, skippedFeaturesHash, featureCallback, opt_hitExtent) {
  return undefined;
};


/**
 * @private
 * @param {WebGLRenderingContext} gl gl.
 * @param {Array.<number>} color Color.
 */
WebGLCoverageReplay.prototype.setFillStyle_ = function(gl, color) {
  gl.uniform4fv(this.defaultLocations_.u_color, color);
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


export default WebGLCoverageReplay;
