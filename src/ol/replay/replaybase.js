goog.provide('ol.replay.Base');
goog.provide('ol.replay.Batch');
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
ol.replay.Batch = function() {
};


/**
 * Draw a path.  Outer rings are clockwise.  Inner rings are anti-clockwise.
 * @param {Array.<number>} path Path.
 * @param {number} stride Stride.
 * @param {boolean} close Close.
 */
ol.replay.Batch.prototype.addPath = goog.abstractMethod;


/**
 * FIXME empty description for jsdoc
 */
ol.replay.Batch.prototype.beginPath = goog.abstractMethod;


/**
 * FIXME empty description for jsdoc
 */
ol.replay.Batch.prototype.draw = goog.abstractMethod;


/**
 * @param {ol.replay.FillStyle} fillStyle Fill style.
 */
ol.replay.Batch.prototype.setFillStyle = goog.abstractMethod;


/**
 * @param {ol.replay.StrokeStyle} strokeStyle Stroke style.
 */
ol.replay.Batch.prototype.setStrokeStyle = goog.abstractMethod;



/**
 * @constructor
 */
ol.replay.Base = function() {
};


/**
 * @param {ol.replay.BatchType} batchType Batch type.
 * @return {ol.replay.Batch} Batch.
 */
ol.replay.Base.prototype.createBatch = goog.abstractMethod;


/**
 * @param {ol.replay.Batch} batch Batch.
 */
ol.replay.Base.prototype.drawBatch = goog.abstractMethod;


/**
 * @param {goog.vec.Mat4.AnyType} transform Transform.
 */
ol.replay.Base.prototype.setTransform = goog.abstractMethod;
