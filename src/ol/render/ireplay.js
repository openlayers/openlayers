goog.provide('ol.render.IReplayBatch');
goog.provide('ol.render.IReplayBatchGroup');

goog.require('goog.functions');


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
ol.render.IReplayBatch = function() {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 */
ol.render.IReplayBatch.prototype.drawPointGeometry = function(pointGeometry) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 */
ol.render.IReplayBatch.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     Multi line string geometry.
 */
ol.render.IReplayBatch.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 */
ol.render.IReplayBatch.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry Multi polygon geometry.
 */
ol.render.IReplayBatch.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
};


/**
 * @param {ol.geom.Polygon} polygonGeometry Polygon geometry.
 */
ol.render.IReplayBatch.prototype.drawPolygonGeometry =
    function(polygonGeometry) {
};


/**
 * @param {?ol.style.Fill} fillStyle Fill style.
 * @param {?ol.style.Stroke} strokeStyle Stroke style.
 */
ol.render.IReplayBatch.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @param {?ol.style.Image} imageStyle Image style.
 */
ol.render.IReplayBatch.prototype.setImageStyle = function(imageStyle) {
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
 * @return {ol.render.IReplayBatch} Batch.
 */
ol.render.IReplayBatchGroup.prototype.getBatch = function(zIndex, batchType) {
};


/**
 * @return {boolean} Is empty.
 */
ol.render.IReplayBatchGroup.prototype.isEmpty = function() {
};
