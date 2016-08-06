goog.provide('ol.interaction.KeyboardPan');

goog.require('ol');
goog.require('ol.coordinate');
goog.require('ol.events.EventType');
goog.require('ol.events.KeyCode');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');


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
 * @api stable
 */
ol.interaction.KeyboardPan = function(opt_options) {

  ol.interaction.Interaction.call(this, {
    handleEvent: ol.interaction.KeyboardPan.handleEvent
  });

  var options = opt_options || {};

  /**
   * @private
   * @param {ol.MapBrowserEvent} mapBrowserEvent Browser event.
   * @return {boolean} Combined condition result.
   */
  this.defaultCondition_ = function(mapBrowserEvent) {
    return ol.events.condition.noModifierKeys(mapBrowserEvent) &&
      ol.events.condition.targetNotEditable(mapBrowserEvent);
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
ol.inherits(ol.interaction.KeyboardPan, ol.interaction.Interaction);

/**
 * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
 * `KeyEvent`, and decides the direction to pan to (if an arrow key was
 * pressed).
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.KeyboardPan}
 * @api
 */
ol.interaction.KeyboardPan.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN) {
    var keyEvent = mapBrowserEvent.originalEvent;
    var keyCode = keyEvent.keyCode;
    if (this.condition_(mapBrowserEvent) &&
        (keyCode == ol.events.KeyCode.DOWN ||
        keyCode == ol.events.KeyCode.LEFT ||
        keyCode == ol.events.KeyCode.RIGHT ||
        keyCode == ol.events.KeyCode.UP)) {
      var map = mapBrowserEvent.map;
      var view = map.getView();
      var mapUnitsDelta = view.getResolution() * this.pixelDelta_;
      var deltaX = 0, deltaY = 0;
      if (keyCode == ol.events.KeyCode.DOWN) {
        deltaY = -mapUnitsDelta;
      } else if (keyCode == ol.events.KeyCode.LEFT) {
        deltaX = -mapUnitsDelta;
      } else if (keyCode == ol.events.KeyCode.RIGHT) {
        deltaX = mapUnitsDelta;
      } else {
        deltaY = mapUnitsDelta;
      }
      var delta = [deltaX, deltaY];
      ol.coordinate.rotate(delta, view.getRotation());
      ol.interaction.Interaction.pan(map, view, delta, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
