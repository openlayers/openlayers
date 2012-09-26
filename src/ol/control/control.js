goog.provide('ol.control.Control');

goog.require('goog.Disposable');
goog.require('ol.Map');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.Map} map Map.
 */
ol.control.Control = function(map) {

  goog.base(this);

  /**
   * @private
   * @type {ol.Map}
   */
  this.map_ = map;

};
goog.inherits(ol.control.Control, goog.Disposable);


/**
 * @return {Element} Element.
 */
ol.control.Control.prototype.getElement = goog.abstractMethod;


/**
 * @return {ol.Map} Map.
 */
ol.control.Control.prototype.getMap = function() {
  return this.map_;
};
