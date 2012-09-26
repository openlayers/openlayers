// FIXME factor out key precondition (shift et. al)

goog.provide('ol.interaction.Interaction');

goog.require('ol.MapBrowserEvent');
goog.require('ol.interaction.Constraints');



/**
 * @constructor
 * @param {ol.interaction.Constraints} constraints Constraints.
 */
ol.interaction.Interaction = function(constraints) {

  /**
   * @protected
   * @type {ol.interaction.Constraints}
   */
  this.constraints = constraints;

};


/**
 * @param {ol.Map} map Map.
 * @param {ol.Extent} extent Extent.
 */
ol.interaction.Interaction.prototype.fitExtent = function(map, extent) {
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
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 */
ol.interaction.Interaction.prototype.handleMapBrowserEvent =
    goog.abstractMethod;


/**
 * @param {ol.Map} map Map.
 * @param {ol.Coordinate} delta Delta.
 * @param {ol.Coordinate=} opt_anchor Anchor.
 */
ol.interaction.Interaction.prototype.pan = function(map, delta, opt_anchor) {
  var center = opt_anchor ? opt_anchor : map.getCenter();
  var resolution = map.getResolution();
  center = this.constraints.center(center, resolution, delta);
  map.setCenter(center);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @param {ol.Coordinate=} opt_anchor Anchor.
 */
ol.interaction.Interaction.prototype.rotate = function(
    map, rotation, delta, opt_anchor) {
  // FIXME handle rotation about anchor
  rotation = this.constraints.rotation(rotation, delta);
  map.setRotation(rotation);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution.
 */
ol.interaction.Interaction.prototype.setResolution = function(map, resolution) {
  resolution = this.constraints.resolution(resolution, 0);
  map.setResolution(resolution);
};


/**
 * @param {ol.Map} map Map.
 * @param {number|undefined} resolution Resolution.
 * @param {number} delta Delta.
 * @param {ol.Coordinate=} opt_anchor Anchor.
 */
ol.interaction.Interaction.prototype.zoom = function(
    map, resolution, delta, opt_anchor) {
  if (goog.isDefAndNotNull(opt_anchor)) {
    var anchor = opt_anchor;
    var mapCenter = /** @type {!ol.Coordinate} */ map.getCenter();
    var mapResolution = map.getResolution();
    resolution = this.constraints.resolution(resolution, delta);
    var x = anchor.x - resolution * (anchor.x - mapCenter.x) / mapResolution;
    var y = anchor.y - resolution * (anchor.y - mapCenter.y) / mapResolution;
    var center = new ol.Coordinate(x, y);
    center = this.constraints.center(center, resolution, ol.Coordinate.ZERO);
    map.withFrozenRendering(function() {
      map.setCenter(center);
      map.setResolution(resolution);
    });
  } else {
    resolution = this.constraints.resolution(resolution, delta);
    map.setResolution(resolution);
  }
};

