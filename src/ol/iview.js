goog.provide('ol.IView');

goog.require('ol.IView2D');



/**
 * Interface for views.
 * @interface
 * @extends {goog.events.Listenable}
 */
ol.IView = function() {
};


/**
 * @return {ol.IView2D} View2D.
 */
ol.IView.prototype.getView2D = function() {
};


/**
 * @return {boolean} Is defined.
 */
ol.IView.prototype.isDef = function() {
};
