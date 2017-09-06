import _ol_ from '../index';
import _ol_coordinate_ from '../coordinate';
import _ol_events_EventType_ from '../events/eventtype';
import _ol_events_KeyCode_ from '../events/keycode';
import _ol_events_condition_ from '../events/condition';
import _ol_interaction_Interaction_ from '../interaction/interaction';

/**
 * @classdesc
 * Allows the user to pan the map using keyboard arrows.
 * Note that, although this interaction is by default included in maps,
 * the keys can only be used when browser focus is on the element to which
 * the keyboard events are attached. By default, this is the map div,
 * though you can change this with the `keyboardEventTarget` in
 * {@link ol.Map}. `document` never loses focus but, for any other element,
 * focus will have to be on, and returned to, this element if the keys are to
 * function.
 * See also {@link ol.interaction.KeyboardZoom}.
 *
 * @constructor
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.KeyboardPanOptions=} opt_options Options.
 * @api
 */
var _ol_interaction_KeyboardPan_ = function(opt_options) {

  _ol_interaction_Interaction_.call(this, {
    handleEvent: _ol_interaction_KeyboardPan_.handleEvent
  });

  var options = opt_options || {};

  /**
   * @private
   * @param {ol.MapBrowserEvent} mapBrowserEvent Browser event.
   * @return {boolean} Combined condition result.
   */
  this.defaultCondition_ = function(mapBrowserEvent) {
    return _ol_events_condition_.noModifierKeys(mapBrowserEvent) &&
      _ol_events_condition_.targetNotEditable(mapBrowserEvent);
  };

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition !== undefined ?
    options.condition : this.defaultCondition_;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 100;

  /**
   * @private
   * @type {number}
   */
  this.pixelDelta_ = options.pixelDelta !== undefined ?
    options.pixelDelta : 128;

};

_ol_.inherits(_ol_interaction_KeyboardPan_, _ol_interaction_Interaction_);

/**
 * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
 * `KeyEvent`, and decides the direction to pan to (if an arrow key was
 * pressed).
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.KeyboardPan}
 * @api
 */
_ol_interaction_KeyboardPan_.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == _ol_events_EventType_.KEYDOWN) {
    var keyEvent = mapBrowserEvent.originalEvent;
    var keyCode = keyEvent.keyCode;
    if (this.condition_(mapBrowserEvent) &&
        (keyCode == _ol_events_KeyCode_.DOWN ||
        keyCode == _ol_events_KeyCode_.LEFT ||
        keyCode == _ol_events_KeyCode_.RIGHT ||
        keyCode == _ol_events_KeyCode_.UP)) {
      var map = mapBrowserEvent.map;
      var view = map.getView();
      var mapUnitsDelta = view.getResolution() * this.pixelDelta_;
      var deltaX = 0, deltaY = 0;
      if (keyCode == _ol_events_KeyCode_.DOWN) {
        deltaY = -mapUnitsDelta;
      } else if (keyCode == _ol_events_KeyCode_.LEFT) {
        deltaX = -mapUnitsDelta;
      } else if (keyCode == _ol_events_KeyCode_.RIGHT) {
        deltaX = mapUnitsDelta;
      } else {
        deltaY = mapUnitsDelta;
      }
      var delta = [deltaX, deltaY];
      _ol_coordinate_.rotate(delta, view.getRotation());
      _ol_interaction_Interaction_.pan(view, delta, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
export default _ol_interaction_KeyboardPan_;
