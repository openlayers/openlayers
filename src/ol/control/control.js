// FIXME factor out key precondition (shift et. al)

goog.provide('ol.Control');

goog.require('ol.MapBrowserEvent');
goog.require('ol.control.Constraints');



/**
 * @constructor
 * @param {ol.control.Constraints} constraints Constraints.
 */
ol.Control = function(constraints) {

  /**
   * @protected
   * @type {ol.control.Constraints}
   */
  this.constraints = constraints;

};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 */
ol.Control.prototype.handleMapBrowserEvent = goog.abstractMethod;


/**
 * @param {ol.Map} map Map.
 * @param {ol.Extent} extent Extent.
 */
ol.Control.prototype.fitExtent = function(map, extent) {
  var resolution = map.getResolutionForExtent(extent);
  resolution = this.constraints.resolution(resolution, 0);
  var center = extent.getCenter();
  center = this.constraints.center(center, resolution, ol.Coordinate.ZERO);
  map.withFrozenRendering(function() {
    map.setCenter(center);
    map.setResolution(resolution);
  });
};


/**
 * @param {ol.Map} map Map.
 * @param {ol.Coordinate} delta Delta.
 * @param {ol.Coordinate=} opt_anchor Anchor.
 */
ol.Control.prototype.pan = function(map, delta, opt_anchor) {
  var center = opt_anchor ? opt_anchor : map.getCenter();
  var resolution = map.getResolution();
  center = this.constraints.center(center, resolution, delta);
  map.setCenter(center);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution.
 */
ol.Control.prototype.setResolution = function(map, resolution) {
  resolution = this.constraints.resolution(resolution, 0);
  map.setResolution(resolution);
};


/**
 * @param {ol.Map} map Map.
 * @param {number} rotation Rotation.
 */
ol.Control.prototype.setRotation = function(map, rotation) {
  // FIXME use a constraint
  map.setRotation(rotation);
};


/**
 * @param {ol.Map} map Map.
 * @param {number} delta Delta.
 * @param {ol.Coordinate=} opt_anchor Anchor.
 */
ol.Control.prototype.zoom = function(map, delta, opt_anchor) {
  //if (false && goog.isDef(opt_anchor)) {
    // FIXME
  //} else {
    var resolution = map.getResolution();
    resolution = this.constraints.resolution(resolution, delta);
    map.setResolution(resolution);
  //}
};
