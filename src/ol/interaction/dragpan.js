import _ol_ from '../index';
import _ol_ViewHint_ from '../viewhint';
import _ol_coordinate_ from '../coordinate';
import _ol_easing_ from '../easing';
import _ol_events_condition_ from '../events/condition';
import _ol_functions_ from '../functions';
import _ol_interaction_Pointer_ from '../interaction/pointer';

/**
 * @classdesc
 * Allows the user to pan the map by dragging the map.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.DragPanOptions=} opt_options Options.
 * @api
 */
var _ol_interaction_DragPan_ = function(opt_options) {

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_DragPan_.handleDownEvent_,
    handleDragEvent: _ol_interaction_DragPan_.handleDragEvent_,
    handleUpEvent: _ol_interaction_DragPan_.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {ol.Kinetic|undefined}
   */
  this.kinetic_ = options.kinetic;

  /**
   * @type {ol.Pixel}
   */
  this.lastCentroid = null;

  /**
   * @type {number}
   */
  this.lastPointersCount_;

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ?
    options.condition : _ol_events_condition_.noModifierKeys;

  /**
   * @private
   * @type {boolean}
   */
  this.noKinetic_ = false;

};

_ol_.inherits(_ol_interaction_DragPan_, _ol_interaction_Pointer_);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragPan}
 * @private
 */
_ol_interaction_DragPan_.handleDragEvent_ = function(mapBrowserEvent) {
  var targetPointers = this.targetPointers;
  var centroid =
      _ol_interaction_Pointer_.centroid(targetPointers);
  if (targetPointers.length == this.lastPointersCount_) {
    if (this.kinetic_) {
      this.kinetic_.update(centroid[0], centroid[1]);
    }
    if (this.lastCentroid) {
      var deltaX = this.lastCentroid[0] - centroid[0];
      var deltaY = centroid[1] - this.lastCentroid[1];
      var map = mapBrowserEvent.map;
      var view = map.getView();
      var viewState = view.getState();
      var center = [deltaX, deltaY];
      _ol_coordinate_.scale(center, viewState.resolution);
      _ol_coordinate_.rotate(center, viewState.rotation);
      _ol_coordinate_.add(center, viewState.center);
      center = view.constrainCenter(center);
      view.setCenter(center);
    }
  } else if (this.kinetic_) {
    // reset so we don't overestimate the kinetic energy after
    // after one finger down, tiny drag, second finger down
    this.kinetic_.begin();
  }
  this.lastCentroid = centroid;
  this.lastPointersCount_ = targetPointers.length;
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.DragPan}
 * @private
 */
_ol_interaction_DragPan_.handleUpEvent_ = function(mapBrowserEvent) {
  var map = mapBrowserEvent.map;
  var view = map.getView();
  if (this.targetPointers.length === 0) {
    if (!this.noKinetic_ && this.kinetic_ && this.kinetic_.end()) {
      var distance = this.kinetic_.getDistance();
      var angle = this.kinetic_.getAngle();
      var center = /** @type {!ol.Coordinate} */ (view.getCenter());
      var centerpx = map.getPixelFromCoordinate(center);
      var dest = map.getCoordinateFromPixel([
        centerpx[0] - distance * Math.cos(angle),
        centerpx[1] - distance * Math.sin(angle)
      ]);
      view.animate({
        center: view.constrainCenter(dest),
        duration: 500,
        easing: _ol_easing_.easeOut
      });
    }
    view.setHint(_ol_ViewHint_.INTERACTING, -1);
    return false;
  } else {
    if (this.kinetic_) {
      // reset so we don't overestimate the kinetic energy after
      // after one finger up, tiny drag, second finger up
      this.kinetic_.begin();
    }
    this.lastCentroid = null;
    return true;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.DragPan}
 * @private
 */
_ol_interaction_DragPan_.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length > 0 && this.condition_(mapBrowserEvent)) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    this.lastCentroid = null;
    if (!this.handlingDownUpSequence) {
      view.setHint(_ol_ViewHint_.INTERACTING, 1);
    }
    // stop any current animation
    if (view.getHints()[_ol_ViewHint_.ANIMATING]) {
      view.setCenter(mapBrowserEvent.frameState.viewState.center);
    }
    if (this.kinetic_) {
      this.kinetic_.begin();
    }
    // No kinetic as soon as more than one pointer on the screen is
    // detected. This is to prevent nasty pans after pinch.
    this.noKinetic_ = this.targetPointers.length > 1;
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_DragPan_.prototype.shouldStopEvent = _ol_functions_.FALSE;
export default _ol_interaction_DragPan_;
