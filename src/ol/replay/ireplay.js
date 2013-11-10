goog.provide('ol.replay.IBatch');
goog.provide('ol.replay.IBatchGroup');

goog.require('goog.functions');


/**
 * @enum {string}
 */
ol.replay.BatchType = {
  IMAGE: 'Image',
  LINE_STRING: 'LineString',
  POLYGON: 'Polygon'
};



/**
 * @interface
 */
ol.replay.IBatch = function() {
};


/**
 * @param {number} x X.
 * @param {number} y Y.
 * @param {Image|HTMLCanvasElement|HTMLVideoElement} image Image.
 */
ol.replay.IBatch.prototype.drawImage = function(x, y, image) {
};


/**
 * @param {ol.geom.Point} pointGeometry Point geometry.
 */
ol.replay.IBatch.prototype.drawPointGeometry = function(pointGeometry) {
};


/**
 * @param {ol.geom.LineString} lineStringGeometry Line string geometry.
 */
ol.replay.IBatch.prototype.drawLineStringGeometry =
    function(lineStringGeometry) {
};


/**
 * @param {ol.geom.MultiLineString} multiLineStringGeometry
 *     Multi line string geometry.
 */
ol.replay.IBatch.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry) {
};


/**
 * @param {ol.geom.MultiPoint} multiPointGeometry MultiPoint geometry.
 */
ol.replay.IBatch.prototype.drawMultiPointGeometry =
    function(multiPointGeometry) {
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygonGeometry Multi polygon geometry.
 */
ol.replay.IBatch.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry) {
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
 * @param {?ol.style.Image} imageStyle Image style.
 */
ol.replay.IBatch.prototype.setImageStyle = function(imageStyle) {
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
 * @param {number|undefined} zIndex Z index.
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
