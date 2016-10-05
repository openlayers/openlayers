goog.provide('ol.render.webgl.Replay');

goog.require('ol');
goog.require('ol.render.VectorContext');
goog.require('ol.transform');

/**
 * @constructor
 * @extends {ol.render.VectorContext}
 * @param {number} tolerance Tolerance.
 * @param {ol.Extent} maxExtent Max extent.
 * @struct
 */
ol.render.webgl.Replay = function(tolerance, maxExtent) {
  ol.render.VectorContext.call(this);

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
  this.origin = ol.extent.getCenter(maxExtent);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.projectionMatrix_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.offsetRotateMatrix_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.offsetScaleMatrix_ = ol.transform.create();

  /**
   * @private
   * @type {Array.<number>}
   */
  this.tmpMat4_ = ol.vec.Mat4.create();

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
ol.inherits(ol.render.webgl.Replay, ol.render.VectorContext);


/**
 * @abstract
 * @param {ol.webgl.Context} context WebGL context.
 * @return {function()} Delete resources function.
 */
ol.render.webgl.Replay.prototype.getDeleteResourcesFunction = function(context) {};


/**
 * @abstract
 * @param {ol.webgl.Context} context Context.
 */
ol.render.webgl.Replay.prototype.finish = function(context) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {ol.Size} size Size.
 * @param {number} pixelRatio Pixel ratio.
 * @return {ol.render.webgl.imagereplay.defaultshader.Locations|
            ol.render.webgl.linestringreplay.defaultshader.Locations|
            ol.render.webgl.polygonreplay.defaultshader.Locations} Locations.
 */
ol.render.webgl.Replay.prototype.setUpProgram = function(gl, context, size, pixelRatio) {};


/**
 * @abstract
 * @protected
 * @param {WebGLRenderingContext} gl gl.
 * @param {ol.webgl.Context} context Context.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *  to skip.
 * @param {boolean} hitDetection Hit detection mode.
 */
ol.render.webgl.Replay.prototype.drawReplay = function(gl, context, skippedFeaturesHash, hitDetection) {};


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
ol.render.webgl.Replay.prototype.drawHitDetectionReplayOneByOne = function(gl, context, skippedFeaturesHash, featureCallback, opt_hitExtent) {};


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
ol.render.webgl.Replay.prototype.drawHitDetectionReplay = function(gl, context, skippedFeaturesHash,
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
ol.render.webgl.Replay.prototype.drawHitDetectionReplayAll = function(gl, context, skippedFeaturesHash,
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
ol.render.webgl.Replay.prototype.replay = function(context,
    center, resolution, rotation, size, pixelRatio,
    opacity, skippedFeaturesHash,
    featureCallback, oneByOne, opt_hitExtent) {
  var gl = context.getGL();

  // bind the vertices buffer
  ol.DEBUG && console.assert(this.verticesBuffer,
      'verticesBuffer must not be null');
  context.bindBuffer(ol.webgl.ARRAY_BUFFER, this.verticesBuffer);

  // bind the indices buffer
  ol.DEBUG && console.assert(this.indicesBuffer,
      'indicesBuffer must not be null');
  context.bindBuffer(ol.webgl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

  var locations = this.setUpProgram(gl, context, size, pixelRatio);

  // set the "uniform" values
  var projectionMatrix = ol.transform.reset(this.projectionMatrix_);
  ol.transform.scale(projectionMatrix, 2 / (resolution * size[0]), 2 / (resolution * size[1]));
  ol.transform.rotate(projectionMatrix, -rotation);
  ol.transform.translate(projectionMatrix, -(center[0] - this.origin[0]), -(center[1] - this.origin[1]));

  var offsetScaleMatrix = ol.transform.reset(this.offsetScaleMatrix_);
  ol.transform.scale(offsetScaleMatrix, 2 / size[0], 2 / size[1]);

  var offsetRotateMatrix = ol.transform.reset(this.offsetRotateMatrix_);
  if (rotation !== 0) {
    ol.transform.rotate(offsetRotateMatrix, -rotation);
  }

  gl.uniformMatrix4fv(locations.u_projectionMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, projectionMatrix));
  gl.uniformMatrix4fv(locations.u_offsetScaleMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, offsetScaleMatrix));
  gl.uniformMatrix4fv(locations.u_offsetRotateMatrix, false,
      ol.vec.Mat4.fromTransform(this.tmpMat4_, offsetRotateMatrix));
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
  for (var i in locations) {
    if (typeof locations[i] === 'number') {
      gl.disableVertexAttribArray(locations[i]);
    }
  }

  if (this.lineStringReplay) {
    this.lineStringReplay.replay(context,
        center, resolution, rotation, size, pixelRatio,
        opacity, skippedFeaturesHash,
        featureCallback, oneByOne, opt_hitExtent);
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
ol.render.webgl.Replay.prototype.drawElements = function(
    gl, context, start, end) {
  var elementType = context.hasOESElementIndexUint ?
      ol.webgl.UNSIGNED_INT : ol.webgl.UNSIGNED_SHORT;
  var elementSize = context.hasOESElementIndexUint ? 4 : 2;

  var numItems = end - start;
  var offsetInBytes = start * elementSize;
  gl.drawElements(ol.webgl.TRIANGLES, numItems, elementType, offsetInBytes);
};
