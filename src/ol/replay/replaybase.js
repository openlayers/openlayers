goog.provide('ol.replay.BatchBase');
goog.provide('ol.replay.CanvasBase');
goog.provide('ol.replay.FillStyle');
goog.provide('ol.replay.StrokeStyle');

goog.require('goog.vec.Mat4');
goog.require('ol.Color');
goog.require('ol.replay');


/**
 * @enum {number}
 */
ol.replay.BatchType = {
  FILL: 0,
  STROKE: 1,
  FILL_AND_STROKE: 2
};


/**
 * @typedef {{color: ol.Color}}
 */
ol.replay.FillStyle;


/**
 * @typedef {{color: ol.Color, width: number}}
 */
ol.replay.StrokeStyle;



/**
 * @constructor
 */
ol.replay.BatchBase = function() {
};


/**
 * Draw a path.  Outer rings are clockwise.  Inner rings are anti-clockwise.
 * @param {Array.<number>} path Path.
 * @param {number} stride Stride.
 * @param {boolean} close Close.
 */
ol.replay.BatchBase.prototype.addPath = goog.abstractMethod;


/**
 * FIXME empty description for jsdoc
 */
ol.replay.BatchBase.prototype.beginPath = goog.abstractMethod;


/**
 * FIXME empty description for jsdoc
 */
ol.replay.BatchBase.prototype.draw = goog.abstractMethod;


/**
 * @param {ol.replay.FillStyle} fillStyle Fill style.
 */
ol.replay.BatchBase.prototype.setFillStyle = goog.abstractMethod;


/**
 * @param {ol.replay.StrokeStyle} strokeStyle Stroke style.
 */
ol.replay.BatchBase.prototype.setStrokeStyle = goog.abstractMethod;



/**
 * @constructor
 */
ol.replay.CanvasBase = function() {
};


/**
 * @param {ol.replay.BatchType} batchType Batch type.
 * @return {ol.replay.BatchBase} Batch.
 */
ol.replay.CanvasBase.prototype.createBatch = goog.abstractMethod;


/**
 * @param {ol.replay.BatchBase} batch Batch.
 */
ol.replay.CanvasBase.prototype.drawBatch = goog.abstractMethod;


/**
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.CanvasBase.prototype.setTransform = goog.abstractMethod;
