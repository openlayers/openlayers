goog.provide('ol.IView2D');
goog.provide('ol.View2DState');

goog.require('ol.Coordinate');
goog.require('ol.Projection');


/**
 * @typedef {{center: ol.Coordinate,
 *            projection: ol.Projection,
 *            resolution: number,
 *            rotation: number}}
 */
ol.View2DState;



/**
 * Interface for views.
 * @interface
 */
ol.IView2D = function() {
};


/**
 * @return {ol.Coordinate|undefined} Map center.
 */
ol.IView2D.prototype.getCenter = function() {
};


/**
 * @return {ol.Projection|undefined} Map projection.
 */
ol.IView2D.prototype.getProjection = function() {
};


/**
 * @return {number|undefined} Map resolution.
 */
ol.IView2D.prototype.getResolution = function() {
};


/**
 * @return {number|undefined} Map rotation.
 */
ol.IView2D.prototype.getRotation = function() {
};


/**
 * @return {ol.View2DState} View2D state.
 */
ol.IView2D.prototype.getView2DState = function() {
};
