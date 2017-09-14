goog.provide('ol.interaction.KeyboardZoom');

goog.require('ol');
goog.require('ol.events.EventType');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');


/**
 * @classdesc
 * Allows the user to zoom the map using keyboard + and -.
 * Note that, although this interaction is by default included in maps,
 * the keys can only be used when browser focus is on the element to which
 * the keyboard events are attached. By default, this is the map div,
 * though you can change this with the `keyboardEventTarget` in
 * {@link ol.Map}. `document` never loses focus but, for any other element,
 * focus will have to be on, and returned to, this element if the keys are to
 * function.
 * See also {@link ol.interaction.KeyboardPan}.
 *
 * @constructor
 * @param {olx.interaction.KeyboardZoomOptions=} opt_options Options.
 * @extends {ol.interaction.Interaction}
 * @api
 */
ol.interaction.KeyboardZoom = function(opt_options) {

  ol.interaction.Interaction.call(this, {
    handleEvent: ol.interaction.KeyboardZoom.handleEvent
  });

  var options = opt_options ? opt_options : {};

  /**
   * @private
   * @type {ol.EventsConditionType}
   */
  this.condition_ = options.condition ? options.condition :
    ol.events.condition.targetNotEditable;

  /**
   * @private
   * @type {number}
   */
  this.delta_ = options.delta ? options.delta : 1;

  /**
   * @private
   * @type {number}
   */
  this.duration_ = options.duration !== undefined ? options.duration : 100;

};
ol.inherits(ol.interaction.KeyboardZoom, ol.interaction.Interaction);


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
 * `KeyEvent`, and decides whether to zoom in or out (depending on whether the
 * key pressed was '+' or '-').
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this {ol.interaction.KeyboardZoom}
 * @api
 */
ol.interaction.KeyboardZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN ||
      mapBrowserEvent.type == ol.events.EventType.KEYPRESS) {
    var keyEvent = mapBrowserEvent.originalEvent;
    var charCode = keyEvent.charCode;
    if (this.condition_(mapBrowserEvent) &&
        (charCode == '+'.charCodeAt(0) || charCode == '-'.charCodeAt(0))) {
      var map = mapBrowserEvent.map;
      var delta = (charCode == '+'.charCodeAt(0)) ? this.delta_ : -this.delta_;
      var view = map.getView();
      ol.interaction.Interaction.zoomByDelta(
          view, delta, undefined, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};
