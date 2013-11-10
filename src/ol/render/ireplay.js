goog.provide('ol.render.IReplayBatchGroup');

goog.require('goog.functions');
goog.require('ol.render.IRender');


/**
 * @enum {string}
 */
ol.render.BatchType = {
  IMAGE: 'Image',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon'
};



/**
 * @interface
 */
ol.render.IReplayBatchGroup = function() {
};


/**
 * FIXME empty description for jsdoc
 */
ol.render.IReplayBatchGroup.prototype.finish = function() {
};


/**
 * @param {number|undefined} zIndex Z index.
 * @param {ol.render.BatchType} batchType Batch type.
 * @return {ol.render.IRender} Batch.
 */
ol.render.IReplayBatchGroup.prototype.getBatch = function(zIndex, batchType) {
};


/**
 * @return {boolean} Is empty.
 */
ol.render.IReplayBatchGroup.prototype.isEmpty = function() {
};
