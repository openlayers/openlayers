/**
 * @module ol/render/webgl/Replay
 */
import {inherits} from '../../index.js';
import {getCenter} from '../../extent.js';
import VectorContext from '../VectorContext.js';
import _ol_transform_ from '../../transform.js';
import {create, fromTransform} from '../../vec/mat4.js';
import _ol_webgl_ from '../../webgl.js';

/**
 * @constructor
 * @abstract
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
const WebGLReplay = function(tolerance, maxExtent) {
  VectorContext.call(this);

  /**
   * @protected
   * @type {number}
   */
  this.tolerance = tolerance;

  /**
   * @protected
   * @const
   * @type {ol.Extent}
   */
  this.maxExtent = maxExtent;

  /**
   * The origin of the coordinate system for the point coordinates sent to
   * the GPU. To eliminate jitter caused by precision problems in the GPU
   * we use the "Rendering Relative to Eye" technique described in the "3D
   * Engine Design for Virtual Globes" book.
   * @protected
   * @type {ol.Coordinate}
   */
  this.origin = getCenter(maxExtent);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.projectionMatrix_ = _ol_transform_.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.offsetRotateMatrix_ = _ol_transform_.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.offsetScaleMatrix_ = _ol_transform_.create();

  /**
   * @private
   * @type {Array.<number>}
   */
  this.tmpMat4_ = create();

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.indices = [];

  /**
   * @protected
   * @type {?ol.webgl.Buffer}
   */
  this.indicesBuffer = null;

  /**
   * Start index per feature (the index).
   * @protected
   * @type {Array.<number>}
   */
  this.startIndices = [];

  /**
   * Start index per feature (the feature).
   * @protected
   * @type {Array.<ol.Feature|ol.render.Feature>}
   */
  this.startIndicesFeature = [];

  /**
   * @protected
   * @type {Array.<number>}
   */
  this.vertices = [];

  /**
   * @protected
   * @type {?ol.webgl.Buffer}
   */
  this.verticesBuffer = null;

  /**
   * Optional parameter for PolygonReplay instances.
   * @protected
   * @type {ol.render.webgl.LineStringReplay|undefined}
   */
  this.lineStringReplay = undefined;

};

inherits(WebGLReplay, VectorContext);


/**
 * @abstract
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
WebGLReplay.prototype.getDeleteResourcesFunction = function(context) {};


/**
 * @abstract
 * @param {ol.webgl.Context} context Context.
 */
WebGLReplay.prototype.finish = function(context) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @return {ol.render.webgl.circlereplay.defaultshader.Locations|
            ol.render.webgl.linestringreplay.defaultshader.Locations|
            ol.render.webgl.polygonreplay.defaultshader.Locations|
            ol.render.webgl.texturereplay.defaultshader.Locations} Locations.
 */
WebGLReplay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.render.webgl.circlereplay.defaultshader.Locations|
           ol.render.webgl.linestringreplay.defaultshader.Locations|
           ol.render.webgl.polygonreplay.defaultshader.Locations|
           ol.render.webgl.texturereplay.defaultshader.Locations} locations Locations.
 */
WebGLReplay.prototype.shutDownProgram = function(gl, locations) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {boolean} hitDetection Hit detection mode.
 */
WebGLReplay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
WebGLReplay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash, featureCallback, opt_hitExtent) {};


/**
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
WebGLReplay.prototype.drawHitDetectionReplay = function(gl, context, skippedFeaturesHash,
  featureCallback, oneByOne, opt_hitExtent) {
  if (!oneByOne) {
    // draw all hit-detection features in "once" (by texture group)
    return this.drawHitDetectionReplayAll(gl, context,
      skippedFeaturesHash, featureCallback);
  } else {
    // draw hit-detection features one by one
    return this.drawHitDetectionReplayOneByOne(gl, context,
      skippedFeaturesHash, featureCallback, opt_hitExtent);
  }
};


/**
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @return {T|undefined} Callback result.
 * @template T
 */
WebGLReplay.prototype.drawHitDetectionReplayAll = function(gl, context, skippedFeaturesHash,
  featureCallback) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.drawReplay(gl, context, skippedFeaturesHash, true);

  const result = featureCallback(null);
  if (result) {
    return result;
  } else {
    return undefined;
  }
};


/**
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Coordinate} center Center.
 * @param {number} resolution Resolution.
 * @param {number} rotation Rotation.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} opacity Global opacity.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined} featureCallback Feature callback.
 * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
 * @param {ol.Extent=} opt_hitExtent Hit extent: Only features intersecting
 *  this extent are checked.
 * @return {T|undefined} Callback result.
 * @template T
 */
WebGLReplay.prototype.replay = function(context,
  center, resolution, rotation, size, pixelRatio,
  opacity, skippedFeaturesHash,
  featureCallback, oneByOne, opt_hitExtent) {
  const gl = context.getGL();
  let tmpStencil, tmpStencilFunc, tmpStencilMaskVal, tmpStencilRef, tmpStencilMask,
      tmpStencilOpFail, tmpStencilOpPass, tmpStencilOpZFail;

  if (this.lineStringReplay) {
    tmpStencil = gl.isEnabled(gl.STENCIL_TEST);
    tmpStencilFunc = gl.getParameter(gl.STENCIL_FUNC);
    tmpStencilMaskVal = gl.getParameter(gl.STENCIL_VALUE_MASK);
    tmpStencilRef = gl.getParameter(gl.STENCIL_REF);
    tmpStencilMask = gl.getParameter(gl.STENCIL_WRITEMASK);
    tmpStencilOpFail = gl.getParameter(gl.STENCIL_FAIL);
    tmpStencilOpPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS);
    tmpStencilOpZFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL);

    gl.enable(gl.STENCIL_TEST);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.stencilMask(255);
    gl.stencilFunc(gl.ALWAYS, 1, 255);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    this.lineStringReplay.replay(context,
      center, resolution, rotation, size, pixelRatio,
      opacity, skippedFeaturesHash,
      featureCallback, oneByOne, opt_hitExtent);

    gl.stencilMask(0);
    gl.stencilFunc(gl.NOTEQUAL, 1, 255);
  }

  context.bindBuffer(_ol_webgl_.ARRAY_BUFFER, this.verticesBuffer);

  context.bindBuffer(_ol_webgl_.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

  const locations = this.setUpProgram(gl, context, size, pixelRatio);

  // set the "uniform" values
  const projectionMatrix = _ol_transform_.reset(this.projectionMatrix_);
  _ol_transform_.scale(projectionMatrix, 2 / (resolution * size[0]), 2 / (resolution * size[1]));
  _ol_transform_.rotate(projectionMatrix, -rotation);
  _ol_transform_.translate(projectionMatrix, -(center[0] - this.origin[0]), -(center[1] - this.origin[1]));

  const offsetScaleMatrix = _ol_transform_.reset(this.offsetScaleMatrix_);
  _ol_transform_.scale(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

  const offsetRotateMatrix = _ol_transform_.reset(this.offsetRotateMatrix_);
  if (rotation !== 0) {
    _ol_transform_.rotate(offsetRotateMatrix, -rotation);
  }

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
    fromTransform(this.tmpMat4_, projectionMatrix));
  gl.uniformMatrix4fv(locations.u_offsetScaleMatrix, false,
    fromTransform(this.tmpMat4_, offsetScaleMatrix));
  gl.uniformMatrix4fv(locations.u_offsetRotateMatrix, false,
    fromTransform(this.tmpMat4_, offsetRotateMatrix));
  gl.uniform1f(locations.u_opacity, opacity);

  // draw!
  let result;
  if (featureCallback === undefined) {
    this.drawReplay(gl, context, skippedFeaturesHash, false);
  } else {
    // draw feature by feature for the hit-detection
    result = this.drawHitDetectionReplay(gl, context, skippedFeaturesHash,
      featureCallback, oneByOne, opt_hitExtent);
  }

  // disable the vertex attrib arrays
  this.shutDownProgram(gl, locations);

  if (this.lineStringReplay) {
    if (!tmpStencil) {
      gl.disable(gl.STENCIL_TEST);
    }
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.stencilFunc(/** @type {number} */ (tmpStencilFunc),
      /** @type {number} */ (tmpStencilRef), /** @type {number} */ (tmpStencilMaskVal));
    gl.stencilMask(/** @type {number} */ (tmpStencilMask));
    gl.stencilOp(/** @type {number} */ (tmpStencilOpFail),
      /** @type {number} */ (tmpStencilOpZFail), /** @type {number} */ (tmpStencilOpPass));
  }

  return result;
};

/**
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {number} start Start index.
 * @param {number} end End index.
 */
WebGLReplay.prototype.drawElements = function(
  gl, context, start, end) {
  const elementType = context.hasOESElementIndexUint ?
    _ol_webgl_.UNSIGNED_INT : _ol_webgl_.UNSIGNED_SHORT;
  const elementSize = context.hasOESElementIndexUint ? 4 : 2;

  const numItems = end - start;
  const offsetInBytes = start * elementSize;
  gl.drawElements(_ol_webgl_.TRIANGLES, numItems, elementType, offsetInBytes);
};
export default WebGLReplay;
