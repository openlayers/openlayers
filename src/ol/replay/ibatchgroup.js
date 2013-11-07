goog.provide('ol.replay.IBatch');
goog.provide('ol.replay.IBatchGroup');

goog.require('goog.functions');


/**
 * @enum {string}
 */
ol.replay.BatchType = {
  FILL_RING: 'fillRing',
  POINT: 'point',
  STROKE_LINE: 'strokeLine',
  STROKE_FILL_RING: 'strokeFillRing',
  STROKE_RING: 'strokeRing'
};



/**
 * @interface
 */
ol.replay.IBatch = function() {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 */
ol.replay.IBatch.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
};


/**
 * @param {ol.style.Stroke} strokeStyle Stroke style.
 */
ol.replay.IBatch.prototype.setStrokeStyle = function(strokeStyle) {
};



/**
 * @interface
 */
ol.replay.IBatchGroup = function() {
};


/**
 * @param {number} zIndex Z index.
 * @param {ol.replay.BatchType} batchType Batch type.
 * @return {ol.replay.IBatch} Batch.
 */
ol.replay.IBatchGroup.prototype.getBatch = function(zIndex, batchType) {
};


/**
 * @return {boolean} Is empty.
 */
ol.replay.IBatchGroup.prototype.isEmpty = function() {
};
