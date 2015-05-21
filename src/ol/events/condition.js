goog.provide('ol.events.ConditionType');
goog.provide('ol.events.condition');

goog.require('goog.asserts');
goog.require('goog.dom.TagName');
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
 * Always true.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True.
 * @function
 * @api stable
 */
ol.events.condition.always = goog.functions.TRUE;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `click` event.
 * @api stable
 */
ol.events.condition.click = function(mapBrowserEvent) {
  return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.CLICK;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the browser event is a `mousemove` event.
 * @api
 */
ol.events.condition.mouseMove = function(mapBrowserEvent) {
  return mapBrowserEvent.originalEvent.type == 'mousemove';
};


/**
 * Always false.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} False.
 * @function
 * @api stable
 */
ol.events.condition.never = goog.functions.FALSE;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `singleclick` event.
 * @api stable
 */
ol.events.condition.singleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.SINGLECLICK;
};


/**
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
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if the target element is not editable.
 * @api
 */
ol.events.condition.targetNotEditable = function(mapBrowserEvent) {
  var target = mapBrowserEvent.browserEvent.target;
  goog.asserts.assertInstanceof(target, Element);
  var tagName = target.tagName;
  return (
      tagName !== goog.dom.TagName.INPUT &&
      tagName !== goog.dom.TagName.SELECT &&
      tagName !== goog.dom.TagName.TEXTAREA);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a mouse device.
 * @api stable
 */
ol.events.condition.mouseOnly = function(mapBrowserEvent) {
  goog.asserts.assertInstanceof(mapBrowserEvent, ol.MapBrowserPointerEvent);
  /* pointerId must be 1 for mouse devices,
   * see: http://www.w3.org/Submission/pointer-events/#pointerevent-interface
   */
  return mapBrowserEvent.pointerEvent.pointerId == 1;
};
