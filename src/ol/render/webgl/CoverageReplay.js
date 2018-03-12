/**
 * @module ol/render/webgl/CoverageReplay
 */
import {inherits} from '../../index.js';
import {extend} from '../../array.js';
import {translate} from '../../geom/flat/transform.js';
import {fragment, vertex} from './coveragereplay/defaultshader.js';
import Locations from './coveragereplay/defaultshader/Locations.js';
import WebGLReplay from './Replay.js';
import {FLOAT} from '../../webgl.js';
import WebGLBuffer from '../../webgl/Buffer.js';

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
   * Indices of a single cell, used as a template.
   * @type {Array.<number>}
   */
  this.cellIndices = [];

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
  const maxIndex = Math.max.apply(null, this.cellIndices) + 1;
  let indexCount = 0;

  this.startIndices.push(this.indices.length);

  for (let i = 0, ii = flatCoverage.length; i < ii; i += stride) {
    const colorArr = [flatCoverage[i + redOffset] / 255,
      flatCoverage[i + greenOffset] / 255, flatCoverage[i + blueOffset] / 255,
      flatCoverage[i + alphaOffset]];

    for (let j = i, jj = i + cellStride; j < jj; j += 2) {
      extend(this.vertices, translate(flatCoverage, j,
        j + 2, 2, -this.origin[0], -this.origin[1]));
      extend(this.vertices, colorArr);
    }

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
  this.verticesBuffer = new WebGLBuffer(this.vertices);

  // create, bind, and populate the indices buffer
  this.indicesBuffer = new WebGLBuffer(this.indices);

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
  const fragmentShader = fragment;
  const vertexShader = vertex;
  const program = context.getProgram(fragmentShader, vertexShader);

  // get the locations
  let locations;
  if (!this.defaultLocations_) {
    locations = new Locations(gl, program);
    this.defaultLocations_ = locations;
  } else {
    locations = this.defaultLocations_;
  }

  context.useProgram(program);

  // enable the vertex attrib arrays
  gl.enableVertexAttribArray(locations.a_position);
  gl.vertexAttribPointer(locations.a_position, 2, FLOAT,
    false, 24, 0);

  gl.enableVertexAttribArray(locations.a_color);
  gl.vertexAttribPointer(locations.a_color, 4, FLOAT,
    false, 24, 8);

  return locations;
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.shutDownProgram = function(gl, locations) {
  gl.disableVertexAttribArray(locations.a_position);
  gl.disableVertexAttribArray(locations.a_color);
};


/**
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {
  let i, start, end;
  end = this.startIndices[this.startIndices.length - 1];
  for (i = this.startIndices.length - 2; i >= 0; --i) {
    start = this.startIndices[i];
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
 * @inheritDoc
 */
WebGLCoverageReplay.prototype.setFillStrokeStyle = function(fillStyle, strokeStyle) {};


export default WebGLCoverageReplay;
