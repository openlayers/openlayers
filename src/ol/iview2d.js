goog.provide('ol.IView2D');

goog.require('ol.Coordinate');



/**
 * Interface for views.
 * @interface
 */
ol.IView2D = function() {
};


/**
 * @return {ol.Coordinate|undefined} The center of the view.
 */
ol.IView2D.prototype.getCenter = function() {
};


/**
 * @return {ol.proj.Projection|undefined} The projection of the view.
 */
ol.IView2D.prototype.getProjection = function() {
};


/**
 * @return {number|undefined} The resolution of the view.
 */
ol.IView2D.prototype.getResolution = function() {
};


/**
 * @return {number|undefined} The rotation of the view.
 */
ol.IView2D.prototype.getRotation = function() {
};


/**
 * @return {oli.View2DState} View2D state.
 */
ol.IView2D.prototype.getView2DState = function() {
};


/**
 * @return {boolean} Is defined.
 */
ol.IView2D.prototype.isDef = function() {
};
