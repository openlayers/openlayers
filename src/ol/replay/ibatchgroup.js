goog.provide('ol.replay.IBatch');
goog.provide('ol.replay.IBatchGroup');

goog.require('goog.functions');


/**
 * @enum {string}
 */
ol.replay.BatchType = {
  FILL_RING: 'fillRing',
  FILL_STROKE_RING: 'fillStrokeRing',
  POINT: 'point',
  STROKE_LINE: 'strokeLine',
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
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 */
ol.replay.IBatch.prototype.drawPolygonGeometry = function(polygonGeometry) {
};


/**
 * @param {?ol.style.Fill} fillStyle Fill style.
 * @param {?ol.style.Stroke} strokeStyle Stroke style.
 */
ol.replay.IBatch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};



/**
 * @interface
 */
ol.replay.IBatchGroup = function() {
};


/**
 * FIXME empty description for jsdoc
 */
ol.replay.IBatchGroup.prototype.finish = function() {
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
