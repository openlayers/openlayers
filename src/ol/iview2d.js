goog.provide('ol.IView2D');



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
