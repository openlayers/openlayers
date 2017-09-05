import _ol_ from '../../index';
import _ol_extent_ from '../../extent';
import _ol_render_VectorContext_ from '../vectorcontext';
import _ol_transform_ from '../../transform';
import _ol_vec_Mat4_ from '../../vec/mat4';
import _ol_webgl_ from '../../webgl';

/**
 * @constructor
 * @abstract
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
var _ol_render_webgl_Replay_ = function(tolerance, maxExtent) {
  _ol_render_VectorContext_.call(this);

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
  this.origin = _ol_extent_.getCenter(maxExtent);

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
  this.tmpMat4_ = _ol_vec_Mat4_.create();

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

_ol_.inherits(_ol_render_webgl_Replay_, _ol_render_VectorContext_);


/**
 * @abstract
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
_ol_render_webgl_Replay_.prototype.getDeleteResourcesFunction = function(context) {};


/**
 * @abstract
 * @param {ol.webgl.Context} context Context.
 */
_ol_render_webgl_Replay_.prototype.finish = function(context) {};


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
_ol_render_webgl_Replay_.prototype.setUpProgram = function(gl, context, size, pixelRatio) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.render.webgl.circlereplay.defaultshader.Locations|
           ol.render.webgl.linestringreplay.defaultshader.Locations|
           ol.render.webgl.polygonreplay.defaultshader.Locations|
           ol.render.webgl.texturereplay.defaultshader.Locations} locations Locations.
 */
_ol_render_webgl_Replay_.prototype.shutDownProgram = function(gl, locations) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {boolean} hitDetection Hit detection mode.
 */
_ol_render_webgl_Replay_.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {};


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
_ol_render_webgl_Replay_.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash, featureCallback, opt_hitExtent) {};


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
_ol_render_webgl_Replay_.prototype.drawHitDetectionReplay = function(gl, context, skippedFeaturesHash,
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
_ol_render_webgl_Replay_.prototype.drawHitDetectionReplayAll = function(gl, context, skippedFeaturesHash,
    featureCallback) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  this.drawReplay(gl, context, skippedFeaturesHash, true);

  var result = featureCallback(null);
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
_ol_render_webgl_Replay_.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
  var gl = context.getGL();
  var tmpStencil, tmpStencilFunc, tmpStencilMaskVal, tmpStencilRef, tmpStencilMask,
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

  var locations = this.setUpProgram(gl, context, size, pixelRatio);

  // set the "uniform" values
  var projectionMatrix = _ol_transform_.reset(this.projectionMatrix_);
  _ol_transform_.scale(projectionMatrix, 2 / (resolution * size[0]), 2 / (resolution * size[1]));
  _ol_transform_.rotate(projectionMatrix, -rotation);
  _ol_transform_.translate(projectionMatrix, -(center[0] - this.origin[0]), -(center[1] - this.origin[1]));

  var offsetScaleMatrix = _ol_transform_.reset(this.offsetScaleMatrix_);
  _ol_transform_.scale(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

  var offsetRotateMatrix = _ol_transform_.reset(this.offsetRotateMatrix_);
  if (rotation !== 0) {
    _ol_transform_.rotate(offsetRotateMatrix, -rotation);
  }

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
      _ol_vec_Mat4_.fromTransform(this.tmpMat4_, projectionMatrix));
  gl.uniformMatrix4fv(locations.u_offsetScaleMatrix, false,
      _ol_vec_Mat4_.fromTransform(this.tmpMat4_, offsetScaleMatrix));
  gl.uniformMatrix4fv(locations.u_offsetRotateMatrix, false,
      _ol_vec_Mat4_.fromTransform(this.tmpMat4_, offsetRotateMatrix));
  gl.uniform1f(locations.u_opacity, opacity);

  // draw!
  var result;
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
_ol_render_webgl_Replay_.prototype.drawElements = function(
    gl, context, start, end) {
  var elementType = context.hasOESElementIndexUint ?
    _ol_webgl_.UNSIGNED_INT : _ol_webgl_.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  var numItems = end - start;
  var offsetInBytes = start * elementSize;
  gl.drawElements(_ol_webgl_.TRIANGLES, numItems, elementType, offsetInBytes);
};
export default _ol_render_webgl_Replay_;
