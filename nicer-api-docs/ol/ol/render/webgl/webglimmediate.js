goog.provide('ol.render.webgl.Immediate');



/**
 * @constructor
 * @implements {ol.render.IVectorContext}
 * @param {ol.webgl.Context} context Context.
 * @param {number} pixelRatio Pixel ratio.
 * @struct
 */
ol.render.webgl.Immediate = function(context, pixelRatio) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawAsync = function(zIndex, callback) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawCircleGeometry =
    function(circleGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawFeature = function(feature, style) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawGeometryCollectionGeometry =
    function(geometryCollectionGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawPointGeometry =
    function(pointGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawLineStringGeometry =
    function(lineStringGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawMultiLineStringGeometry =
    function(multiLineStringGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawMultiPointGeometry =
    function(multiPointGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawMultiPolygonGeometry =
    function(multiPolygonGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawPolygonGeometry =
    function(polygonGeometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.drawText =
    function(flatCoordinates, offset, end, stride, geometry, data) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setFillStrokeStyle =
    function(fillStyle, strokeStyle) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setImageStyle = function(imageStyle) {
};


/**
 * @inheritDoc
 */
ol.render.webgl.Immediate.prototype.setTextStyle = function(textStyle) {
};
