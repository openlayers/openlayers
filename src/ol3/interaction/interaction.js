// FIXME factor out key precondition (shift et. al)

goog.provide('ol3.Interaction');

goog.require('ol3.MapBrowserEvent');
goog.require('ol3.interaction.Constraints');



/**
 * @constructor
 * @param {ol3.interaction.Constraints} constraints Constraints.
 */
ol3.Interaction = function(constraints) {

  /**
   * @protected
   * @type {ol3.interaction.Constraints}
   */
  this.constraints = constraints;

};


/**
 * @param {ol3.Map} map Map.
 * @param {ol3.Extent} extent Extent.
 */
ol3.Interaction.prototype.fitExtent = function(map, extent) {
  var resolution = map.getResolutionForExtent(extent);
  resolution = this.constraints.resolution(resolution, 0);
  var center = extent.getCenter();
  center = this.constraints.center(center, resolution, ol3.Coordinate.ZERO);
  map.withFrozenRendering(function() {
    map.setCenter(center);
    map.setResolution(resolution);
  });
};


/**
 * @param {ol3.MapBrowserEvent} mapBrowserEvent Map browser event.
 */
ol3.Interaction.prototype.handleMapBrowserEvent = goog.abstractMethod;


/**
 * @param {ol3.Map} map Map.
 * @param {ol3.Coordinate} delta Delta.
 * @param {ol3.Coordinate=} opt_anchor Anchor.
 */
ol3.Interaction.prototype.pan = function(map, delta, opt_anchor) {
  var center = opt_anchor ? opt_anchor : map.getCenter();
  var resolution = map.getResolution();
  center = this.constraints.center(center, resolution, delta);
  map.setCenter(center);
};


/**
 * @param {ol3.Map} map Map.
 * @param {number|undefined} rotation Rotation.
 * @param {number} delta Delta.
 * @param {ol3.Coordinate=} opt_anchor Anchor.
 */
ol3.Interaction.prototype.rotate = function(map, rotation, delta, opt_anchor) {
  // FIXME handle rotation about anchor
  rotation = this.constraints.rotation(rotation, delta);
  map.setRotation(rotation);
};


/**
 * @param {ol3.Map} map Map.
 * @param {number|undefined} resolution Resolution.
 */
ol3.Interaction.prototype.setResolution = function(map, resolution) {
  resolution = this.constraints.resolution(resolution, 0);
  map.setResolution(resolution);
};


/**
 * @param {ol3.Map} map Map.
 * @param {number|undefined} resolution Resolution.
 * @param {number} delta Delta.
 * @param {ol3.Coordinate=} opt_anchor Anchor.
 */
ol3.Interaction.prototype.zoom = function(map, resolution, delta, opt_anchor) {
  if (goog.isDefAndNotNull(opt_anchor)) {
    var anchor = opt_anchor;
    var mapCenter = /** @type {!ol3.Coordinate} */ map.getCenter();
    var mapResolution = map.getResolution();
    resolution = this.constraints.resolution(resolution, delta);
    var x = anchor.x - resolution * (anchor.x - mapCenter.x) / mapResolution;
    var y = anchor.y - resolution * (anchor.y - mapCenter.y) / mapResolution;
    var center = new ol3.Coordinate(x, y);
    center = this.constraints.center(center, resolution, ol3.Coordinate.ZERO);
    map.withFrozenRendering(function() {
      map.setCenter(center);
      map.setResolution(resolution);
    });
  } else {
    resolution = this.constraints.resolution(resolution, delta);
    map.setResolution(resolution);
  }
};
