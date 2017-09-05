import _ol_ from '../index';
import _ol_ViewHint_ from '../viewhint';
import _ol_functions_ from '../functions';
import _ol_interaction_Interaction_ from '../interaction/interaction';
import _ol_interaction_Pointer_ from '../interaction/pointer';

/**
 * @classdesc
 * Allows the user to zoom the map by pinching with two fingers
 * on a touch screen.
 *
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @param {olx.interaction.PinchZoomOptions=} opt_options Options.
 * @api
 */
var _ol_interaction_PinchZoom_ = function(opt_options) {

  _ol_interaction_Pointer_.call(this, {
    handleDownEvent: _ol_interaction_PinchZoom_.handleDownEvent_,
    handleDragEvent: _ol_interaction_PinchZoom_.handleDragEvent_,
    handleUpEvent: _ol_interaction_PinchZoom_.handleUpEvent_
  });

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {boolean}
   */
  this.constrainResolution_ = options.constrainResolution || false;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.anchor_ = null;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 400;

  /**
   * @private
   * @type {number|undefined}
   */
  this.lastDistance_ = undefined;

  /**
   * @private
   * @type {number}
   */
  this.lastScaleDelta_ = 1;

};

_ol_.inherits(_ol_interaction_PinchZoom_, _ol_interaction_Pointer_);


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.PinchZoom}
 * @private
 */
_ol_interaction_PinchZoom_.handleDragEvent_ = function(mapBrowserEvent) {
  var scaleDelta = 1.0;

  var touch0 = this.targetPointers[0];
  var touch1 = this.targetPointers[1];
  var dx = touch0.clientX - touch1.clientX;
  var dy = touch0.clientY - touch1.clientY;

  // distance between touches
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (this.lastDistance_ !== undefined) {
    scaleDelta = this.lastDistance_ / distance;
  }
  this.lastDistance_ = distance;


  var map = mapBrowserEvent.map;
  var view = map.getView();
  var resolution = view.getResolution();
  var maxResolution = view.getMaxResolution();
  var minResolution = view.getMinResolution();
  var newResolution = resolution * scaleDelta;
  if (newResolution > maxResolution) {
    scaleDelta = maxResolution / resolution;
    newResolution = maxResolution;
  } else if (newResolution < minResolution) {
    scaleDelta = minResolution / resolution;
    newResolution = minResolution;
  }

  if (scaleDelta != 1.0) {
    this.lastScaleDelta_ = scaleDelta;
  }

  // scale anchor point.
  var viewportPosition = map.getViewport().getBoundingClientRect();
  var centroid = _ol_interaction_Pointer_.centroid(this.targetPointers);
  centroid[0] -= viewportPosition.left;
  centroid[1] -= viewportPosition.top;
  this.anchor_ = map.getCoordinateFromPixel(centroid);

  // scale, bypass the resolution constraint
  map.render();
  _ol_interaction_Interaction_.zoomWithoutConstraints(view, newResolution, this.anchor_);
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Stop drag sequence?
 * @this {ol.interaction.PinchZoom}
 * @private
 */
_ol_interaction_PinchZoom_.handleUpEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length < 2) {
    var map = mapBrowserEvent.map;
    var view = map.getView();
    view.setHint(_ol_ViewHint_.INTERACTING, -1);
    var resolution = view.getResolution();
    if (this.constrainResolution_ ||
        resolution < view.getMinResolution() ||
        resolution > view.getMaxResolution()) {
      // Zoom to final resolution, with an animation, and provide a
      // direction not to zoom out/in if user was pinching in/out.
      // Direction is > 0 if pinching out, and < 0 if pinching in.
      var direction = this.lastScaleDelta_ - 1;
      _ol_interaction_Interaction_.zoom(view, resolution,
          this.anchor_, this.duration_, direction);
    }
    return false;
  } else {
    return true;
  }
};


/**
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @return {boolean} Start drag sequence?
 * @this {ol.interaction.PinchZoom}
 * @private
 */
_ol_interaction_PinchZoom_.handleDownEvent_ = function(mapBrowserEvent) {
  if (this.targetPointers.length >= 2) {
    var map = mapBrowserEvent.map;
    this.anchor_ = null;
    this.lastDistance_ = undefined;
    this.lastScaleDelta_ = 1;
    if (!this.handlingDownUpSequence) {
      map.getView().setHint(_ol_ViewHint_.INTERACTING, 1);
    }
    return true;
  } else {
    return false;
  }
};


/**
 * @inheritDoc
 */
_ol_interaction_PinchZoom_.prototype.shouldStopEvent = _ol_functions_.FALSE;
export default _ol_interaction_PinchZoom_;
