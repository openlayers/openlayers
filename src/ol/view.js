goog.provide('ol.View');

goog.require('ol.IView');
goog.require('ol.IView2D');
goog.require('ol.IView3D');



/**
 * @constructor
 * @implements {ol.IView}
 * @extends {ol.Object}
 */
ol.View = function() {
};
goog.inherits(ol.View, ol.Object);


/**
 * @inheritDoc
 */
ol.View.prototype.getView2D = goog.abstractMethod;


/**
 * @inheritDoc
 */
ol.View.prototype.getView3D = goog.abstractMethod;

