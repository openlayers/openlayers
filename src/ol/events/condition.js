goog.provide('ol.events.ConditionType');
goog.provide('ol.events.condition');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('ol.MapBrowserEvent.EventType');
goog.require('ol.MapBrowserPointerEvent');


/**
 * A function that takes an {@link ol.MapBrowserEvent} and returns a
 * `{boolean}`. If the condition is met, true should be returned.
 *
 * @typedef {function(ol.MapBrowserEvent): boolean}
 * @api stable
 */
ol.events.ConditionType;


/**
 * Return `true` if only the alt-key is pressed, `false` otherwise (e.g. when
 * additionally the shift-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt key is pressed.
 * @api stable
 */
ol.events.condition.altKeyOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * Return `true` if only the alt-key and shift-key is pressed, `false` otherwise
 * (e.g. when additionally the platform-modifier-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt and shift keys are pressed.
 * @api stable
 */
ol.events.condition.altShiftKeysOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      browserEvent.shiftKey);
};


/**
 * Return always true.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True.
 * @function
 * @api stable
 */
ol.events.condition.always = goog.functions.TRUE;


/**
 * Return `true` if the event is a `click` event, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `click` event.
 * @api stable
 */
ol.events.condition.click = function(mapBrowserEvent) {
  return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.CLICK;
};


/**
 * Return always false.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} False.
 * @function
 * @api stable
 */
ol.events.condition.never = goog.functions.FALSE;


/**
 * Return `true` if the browser event is a `pointermove` event, `false`
 * otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the browser event is a `pointermove` event.
 * @api
 */
ol.events.condition.pointerMove = function(mapBrowserEvent) {
  return mapBrowserEvent.type == 'pointermove';
};


/**
 * Return `true` if the event is a map `singleclick` event, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `singleclick` event.
 * @api stable
 */
ol.events.condition.singleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.SINGLECLICK;
};


/**
 * Return `true` if the event is a map `dblclick` event, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `dblclick` event.
 * @api stable
 */
ol.events.condition.doubleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.DBLCLICK;
};


/**
 * Return `true` if no modifier key (alt-, shift- or platform-modifier-key) is
 * pressed.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if there no modifier keys are pressed.
 * @api stable
 */
ol.events.condition.noModifierKeys = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      !browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * Return `true` if only the platform-modifier-key (the meta-key on Mac,
 * ctrl-key otherwise) is pressed, `false` otherwise (e.g. when additionally
 * the shift-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the platform modifier key is pressed.
 * @api stable
 */
ol.events.condition.platformModifierKeyOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      !browserEvent.altKey &&
      browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * Return `true` if only the shift-key is pressed, `false` otherwise (e.g. when
 * additionally the alt-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the shift key is pressed.
 * @api stable
 */
ol.events.condition.shiftKeyOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      !browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      browserEvent.shiftKey);
};


/**
 * Return `true` if the target element is not editable, i.e. not a `<input>`-,
 * `<select>`- or `<textarea>`-element, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if the target element is not editable.
 * @api
 */
ol.events.condition.targetNotEditable = function(mapBrowserEvent) {
  var target = mapBrowserEvent.browserEvent.target;
  goog.asserts.assertInstanceof(target, Element,
      'target should be an Element');
  var tagName = target.tagName;
  return (
      tagName !== 'INPUT' &&
      tagName !== 'SELECT' &&
      tagName !== 'TEXTAREA');
};


/**
 * Return `true` if the event originates from a mouse device.
 *
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a mouse device.
 * @api stable
 */
ol.events.condition.mouseOnly = function(mapBrowserEvent) {
  // see http://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
  return mapBrowserEvent.pointerEvent.pointerType == 'mouse';
};
