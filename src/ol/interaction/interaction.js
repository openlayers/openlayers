// FIXME factor out key precondition (shift et. al)

import _ol_ from '../index';
import _ol_Object_ from '../object';
import _ol_easing_ from '../easing';
import _ol_interaction_Property_ from '../interaction/property';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * User actions that change the state of the map. Some are similar to controls,
 * but are not associated with a DOM element.
 * For example, {@link ol.interaction.KeyboardZoom} is functionally the same as
 * {@link ol.control.Zoom}, but triggered by a keyboard event not a button
 * element event.
 * Although interactions do not have a DOM element, some of them do render
 * vectors and so are visible on the screen.
 *
 * @constructor
 * @param {olx.interaction.InteractionOptions} options Options.
 * @extends {ol.Object}
 * @api
 */
var _ol_interaction_Interaction_ = function(options) {

  _ol_Object_.call(this);

  /**
   * @private
   * @type {ol.PluggableMap}
   */
  this.map_ = null;

  this.setActive(true);

  /**
   * @type {function(ol.MapBrowserEvent):boolean}
   */
  this.handleEvent = options.handleEvent;

};

_ol_.inherits(_ol_interaction_Interaction_, _ol_Object_);


/**
 * Return whether the interaction is currently active.
 * @return {boolean} `true` if the interaction is active, `false` otherwise.
 * @observable
 * @api
 */
_ol_interaction_Interaction_.prototype.getActive = function() {
  return (
    /** @type {boolean} */ this.get(_ol_interaction_Property_.ACTIVE)
  );
};


/**
 * Get the map associated with this interaction.
 * @return {ol.PluggableMap} Map.
 * @api
 */
_ol_interaction_Interaction_.prototype.getMap = function() {
  return this.map_;
};


/**
 * Activate or deactivate the interaction.
 * @param {boolean} active Active.
 * @observable
 * @api
 */
_ol_interaction_Interaction_.prototype.setActive = function(active) {
  this.set(_ol_interaction_Property_.ACTIVE, active);
};


/**
 * Remove the interaction from its current map and attach it to the new map.
 * Subclasses may set up event handlers to get notified about changes to
 * the map here.
 * @param {ol.PluggableMap} map Map.
 */
_ol_interaction_Interaction_.prototype.setMap = function(map) {
  this.map_ = map;
};


/**
 * @param {ol.View} view View.
 * @param {ol.Coordinate} delta Delta.
 * @param {number=} opt_duration Duration.
 */
_ol_interaction_Interaction_.pan = function(view, delta, opt_duration) {
  var currentCenter = view.getCenter();
  if (currentCenter) {
    var center = view.constrainCenter(
        [currentCenter[0] + delta[0], currentCenter[1] + delta[1]]);
    if (opt_duration) {
      view.animate({
        duration: opt_duration,
        easing: _ol_easing_.linear,
        center: center
      });
    } else {
      view.setCenter(center);
    }
  }
};


/**
 * @param {ol.View} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
_ol_interaction_Interaction_.rotate = function(view, rotation, opt_anchor, opt_duration) {
  rotation = view.constrainRotation(rotation, 0);
  _ol_interaction_Interaction_.rotateWithoutConstraints(
      view, rotation, opt_anchor, opt_duration);
};


/**
 * @param {ol.View} view View.
 * @param {number|undefined} rotation Rotation.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
_ol_interaction_Interaction_.rotateWithoutConstraints = function(view, rotation, opt_anchor, opt_duration) {
  if (rotation !== undefined) {
    var currentRotation = view.getRotation();
    var currentCenter = view.getCenter();
    if (currentRotation !== undefined && currentCenter && opt_duration > 0) {
      view.animate({
        rotation: rotation,
        anchor: opt_anchor,
        duration: opt_duration,
        easing: _ol_easing_.easeOut
      });
    } else {
      view.rotate(rotation, opt_anchor);
    }
  }
};


/**
 * @param {ol.View} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 * @param {number=} opt_direction Zooming direction; > 0 indicates
 *     zooming out, in which case the constraints system will select
 *     the largest nearest resolution; < 0 indicates zooming in, in
 *     which case the constraints system will select the smallest
 *     nearest resolution; == 0 indicates that the zooming direction
 *     is unknown/not relevant, in which case the constraints system
 *     will select the nearest resolution. If not defined 0 is
 *     assumed.
 */
_ol_interaction_Interaction_.zoom = function(view, resolution, opt_anchor, opt_duration, opt_direction) {
  resolution = view.constrainResolution(resolution, 0, opt_direction);
  _ol_interaction_Interaction_.zoomWithoutConstraints(
      view, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.View} view View.
 * @param {number} delta Delta from previous zoom level.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
_ol_interaction_Interaction_.zoomByDelta = function(view, delta, opt_anchor, opt_duration) {
  var currentResolution = view.getResolution();
  var resolution = view.constrainResolution(currentResolution, delta, 0);

  // If we have a constraint on center, we need to change the anchor so that the
  // new center is within the extent. We first calculate the new center, apply
  // the constraint to it, and then calculate back the anchor
  if (opt_anchor && resolution !== undefined && resolution !== currentResolution) {
    var currentCenter = view.getCenter();
    var center = view.calculateCenterZoom(resolution, opt_anchor);
    center = view.constrainCenter(center);

    opt_anchor = [
      (resolution * currentCenter[0] - currentResolution * center[0]) /
          (resolution - currentResolution),
      (resolution * currentCenter[1] - currentResolution * center[1]) /
          (resolution - currentResolution)
    ];
  }

  _ol_interaction_Interaction_.zoomWithoutConstraints(
      view, resolution, opt_anchor, opt_duration);
};


/**
 * @param {ol.View} view View.
 * @param {number|undefined} resolution Resolution to go to.
 * @param {ol.Coordinate=} opt_anchor Anchor coordinate.
 * @param {number=} opt_duration Duration.
 */
_ol_interaction_Interaction_.zoomWithoutConstraints = function(view, resolution, opt_anchor, opt_duration) {
  if (resolution) {
    var currentResolution = view.getResolution();
    var currentCenter = view.getCenter();
    if (currentResolution !== undefined && currentCenter &&
        resolution !== currentResolution && opt_duration) {
      view.animate({
        resolution: resolution,
        anchor: opt_anchor,
        duration: opt_duration,
        easing: _ol_easing_.easeOut
      });
    } else {
      if (opt_anchor) {
        var center = view.calculateCenterZoom(resolution, opt_anchor);
        view.setCenter(center);
      }
      view.setResolution(resolution);
    }
  }
};
export default _ol_interaction_Interaction_;
