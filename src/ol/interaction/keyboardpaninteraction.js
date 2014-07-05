goog.provide('ol.interaction.KeyboardPan');

goog.require('goog.asserts');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler.EventType');
goog.require('goog.functions');
goog.require('ol');
goog.require('ol.coordinate');
goog.require('ol.events.ConditionType');
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

  goog.base(this);

  var options = goog.isDef(opt_options) ? opt_options : {};

  /**
   * @private
   * @type {ol.events.ConditionType}
   */
  this.condition_ = goog.isDef(options.condition) ? options.condition :
      goog.functions.and(ol.events.condition.noModifierKeys,
          ol.events.condition.targetNotEditable);

  /**
   * @private
   * @type {number}
   */
  this.pixelDelta_ = goog.isDef(options.pixelDelta) ? options.pixelDelta : 128;

};
goog.inherits(ol.interaction.KeyboardPan, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
ol.interaction.KeyboardPan.prototype.handleMapBrowserEvent =
    function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == goog.events.KeyHandler.EventType.KEY) {
    var keyEvent = /** @type {goog.events.KeyEvent} */
        (mapBrowserEvent.browserEvent);
    var keyCode = keyEvent.keyCode;
    if (this.condition_(mapBrowserEvent) &&
        (keyCode == goog.events.KeyCodes.DOWN ||
        keyCode == goog.events.KeyCodes.LEFT ||
        keyCode == goog.events.KeyCodes.RIGHT ||
        keyCode == goog.events.KeyCodes.UP)) {
      var map = mapBrowserEvent.map;
      var view = map.getView();
      goog.asserts.assert(goog.isDef(view));
      var viewState = view.getState();
      var mapUnitsDelta = viewState.resolution * this.pixelDelta_;
      var deltaX = 0, deltaY = 0;
      if (keyCode == goog.events.KeyCodes.DOWN) {
        deltaY = -mapUnitsDelta;
      } else if (keyCode == goog.events.KeyCodes.LEFT) {
        deltaX = -mapUnitsDelta;
      } else if (keyCode == goog.events.KeyCodes.RIGHT) {
        deltaX = mapUnitsDelta;
      } else {
        deltaY = mapUnitsDelta;
      }
      var delta = [deltaX, deltaY];
      ol.coordinate.rotate(delta, viewState.rotation);
      ol.interaction.Interaction.pan(
          map, view, delta, ol.KEYBOARD_PAN_DURATION);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
