goog.provide('ol.IView2D');
goog.provide('ol.View2DState');

goog.require('ol.Coordinate');


/**
 * @typedef {{center: ol.Coordinate,
 *            projection: ol.proj.Projection,
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
 * @todo stability experimental
 */
ol.IView2D.prototype.getCenter = function() {
};


/**
 * @return {ol.proj.Projection|undefined} Map projection.
 * @todo stability experimental
 */
ol.IView2D.prototype.getProjection = function() {
};


/**
 * @return {number|undefined} Map resolution.
 * @todo stability experimental
 */
ol.IView2D.prototype.getResolution = function() {
};


/**
 * @return {number|undefined} Map rotation.
 * @todo stability experimental
 */
ol.IView2D.prototype.getRotation = function() {
};


/**
 * @return {ol.View2DState} View2D state.
 */
ol.IView2D.prototype.getView2DState = function() {
};
