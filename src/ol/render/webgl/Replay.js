/**
 * @module ol/render/webgl/Replay
 */
import {abstract} from '../../util.js';
import {getCenter} from '../../extent.js';
import VectorContext from '../VectorContext.js';
import {
  create as createTransform,
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform
} from '../../transform.js';
import {create, fromTransform} from '../../vec/mat4.js';
import {ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER, TRIANGLES,
  UNSIGNED_INT, UNSIGNED_SHORT} from '../../webgl.js';

class WebGLReplay extends VectorContext {
  /**
   * @param {number} tolerance Tolerance.
   * @param {import("../../extent.js").Extent} maxExtent Max extent.
   */
  constructor(tolerance, maxExtent) {
    super();

    /**
     * @protected
     * @type {number}
     */
    this.tolerance = tolerance;

    /**
     * @protected
     * @const
     * @type {import("../../extent.js").Extent}
     */
    this.maxExtent = maxExtent;

    /**
     * The origin of the coordinate system for the point coordinates sent to
     * the GPU. To eliminate jitter caused by precision problems in the GPU
     * we use the "Rendering Relative to Eye" technique described in the "3D
     * Engine Design for Virtual Globes" book.
     * @protected
     * @type {import("../../coordinate.js").Coordinate}
     */
    this.origin = getCenter(maxExtent);

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.projectionMatrix_ = createTransform();

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.offsetRotateMatrix_ = createTransform();

    /**
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.offsetScaleMatrix_ = createTransform();

    /**
     * @private
     * @type {Array<number>}
     */
    this.tmpMat4_ = create();

    /**
     * @protected
     * @type {Array<number>}
     */
    this.indices = [];

    /**
     * @protected
     * @type {?import("../../webgl/Buffer.js").default}
     */
    this.indicesBuffer = null;

    /**
     * Start index per feature (the index).
     * @protected
     * @type {Array<number>}
     */
    this.startIndices = [];

    /**
     * Start index per feature (the feature).
     * @protected
     * @type {Array<import("../../Feature.js").default|import("../Feature.js").default>}
     */
    this.startIndicesFeature = [];

    /**
     * @protected
     * @type {Array<number>}
     */
    this.vertices = [];

    /**
     * @protected
     * @type {?import("../../webgl/Buffer.js").default}
     */
    this.verticesBuffer = null;

    /**
     * Optional parameter for PolygonReplay instances.
     * @protected
     * @type {import("./LineStringReplay.js").default|undefined}
     */
    this.lineStringReplay = undefined;

  }

  /**
   * @abstract
   * @param {import("../../webgl/Context.js").default} context WebGL context.
   * @return {function()} Delete resources function.
   */
  getDeleteResourcesFunction(context) {
    return abstract();
  }

  /**
   * @abstract
   * @param {import("../../webgl/Context.js").default} context Context.
   */
  finish(context) {
    abstract();
  }

  /**
   * @abstract
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {import("../../size.js").Size} size Size.
   * @param {number} pixelRatio Pixel ratio.
   * @return {import("./circlereplay/defaultshader/Locations.js").default|
     import("./linestringreplay/defaultshader/Locations.js").default|
     import("./polygonreplay/defaultshader/Locations.js").default|
     import("./texturereplay/defaultshader/Locations.js").default} Locations.
   */
  setUpProgram(gl, context, size, pixelRatio) {
    return abstract();
  }

  /**
   * @abstract
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("./circlereplay/defaultshader/Locations.js").default|
     import("./linestringreplay/defaultshader/Locations.js").default|
     import("./polygonreplay/defaultshader/Locations.js").default|
     import("./texturereplay/defaultshader/Locations.js").default} locations Locations.
   */
  shutDownProgram(gl, locations) {
    abstract();
  }

  /**
   * @abstract
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {boolean} hitDetection Hit detection mode.
   */
  drawReplay(gl, context, skippedFeaturesHash, hitDetection) {
    abstract();
  }

  /**
   * @abstract
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {function((import("../../Feature.js").default|import("../Feature.js").default)): T|undefined} featureCallback Feature callback.
   * @param {import("../../extent.js").Extent=} opt_hitExtent Hit extent: Only features intersecting this extent are checked.
   * @return {T|undefined} Callback result.
   * @template T
   */
  drawHitDetectionReplayOneByOne(gl, context, skippedFeaturesHash, featureCallback, opt_hitExtent) {
    return abstract();
  }

  /**
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {function((import("../../Feature.js").default|import("../Feature.js").default)): T|undefined} featureCallback Feature callback.
   * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
   * @param {import("../../extent.js").Extent=} opt_hitExtent Hit extent: Only features intersecting this extent are checked.
   * @return {T|undefined} Callback result.
   * @template T
   */
  drawHitDetectionReplay(gl, context, skippedFeaturesHash, featureCallback, oneByOne, opt_hitExtent) {
    if (!oneByOne) {
      // draw all hit-detection features in "once" (by texture group)
      return this.drawHitDetectionReplayAll(gl, context,
        skippedFeaturesHash, featureCallback);
    } else {
      // draw hit-detection features one by one
      return this.drawHitDetectionReplayOneByOne(gl, context,
        skippedFeaturesHash, featureCallback, opt_hitExtent);
    }
  }

  /**
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {function((import("../../Feature.js").default|import("../Feature.js").default)): T|undefined} featureCallback Feature callback.
   * @return {T|undefined} Callback result.
   * @template T
   */
  drawHitDetectionReplayAll(gl, context, skippedFeaturesHash, featureCallback) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.drawReplay(gl, context, skippedFeaturesHash, true);

    const result = featureCallback(null);
    if (result) {
      return result;
    } else {
      return undefined;
    }
  }

  /**
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {import("../../coordinate.js").Coordinate} center Center.
   * @param {number} resolution Resolution.
   * @param {number} rotation Rotation.
   * @param {import("../../size.js").Size} size Size.
   * @param {number} pixelRatio Pixel ratio.
   * @param {number} opacity Global opacity.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {function((import("../../Feature.js").default|import("../Feature.js").default)): T|undefined} featureCallback Feature callback.
   * @param {boolean} oneByOne Draw features one-by-one for the hit-detecion.
   * @param {import("../../extent.js").Extent=} opt_hitExtent Hit extent: Only features intersecting this extent are checked.
   * @return {T|undefined} Callback result.
   * @template T
   */
  replay(
    context,
    center,
    resolution,
    rotation,
    size,
    pixelRatio,
    opacity,
    skippedFeaturesHash,
    featureCallback,
    oneByOne,
    opt_hitExtent
  ) {
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

    context.bindBuffer(ARRAY_BUFFER, this.verticesBuffer);

    context.bindBuffer(ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    const locations = this.setUpProgram(gl, context, size, pixelRatio);

    // set the "uniform" values
    const projectionMatrix = resetTransform(this.projectionMatrix_);
    scaleTransform(projectionMatrix, 2 / (resolution * size[0]), 2 / (resolution * size[1]));
    rotateTransform(projectionMatrix, -rotation);
    translateTransform(projectionMatrix, -(center[0] - this.origin[0]), -(center[1] - this.origin[1]));

    const offsetScaleMatrix = resetTransform(this.offsetScaleMatrix_);
    scaleTransform(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

    const offsetRotateMatrix = resetTransform(this.offsetRotateMatrix_);
    if (rotation !== 0) {
      rotateTransform(offsetRotateMatrix, -rotation);
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
  }

  /**
   * @protected
   * @param {WebGLRenderingContext} gl gl.
   * @param {import("../../webgl/Context.js").default} context Context.
   * @param {number} start Start index.
   * @param {number} end End index.
   */
  drawElements(gl, context, start, end) {
    const elementType = context.hasOESElementIndexUint ?
      UNSIGNED_INT : UNSIGNED_SHORT;
    const elementSize = context.hasOESElementIndexUint ? 4 : 2;

    const numItems = end - start;
    const offsetInBytes = start * elementSize;
    gl.drawElements(TRIANGLES, numItems, elementType, offsetInBytes);
  }
}


export default WebGLReplay;
