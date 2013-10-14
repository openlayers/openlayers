goog.provide('ol.interaction.ConditionType');
goog.provide('ol.interaction.condition');

goog.require('goog.dom.TagName');
goog.require('goog.functions');
goog.require('ol.MapBrowserEvent.EventType');


/**
 * @typedef {function(ol.MapBrowserEvent): boolean}
 */
ol.interaction.ConditionType;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt key is pressed.
 */
ol.interaction.condition.altKeyOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt and shift keys are pressed.
 */
ol.interaction.condition.altShiftKeysOnly = function(mapBrowserEvent) {
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
 */
ol.interaction.condition.always = goog.functions.TRUE;


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a singleclick event.
 */
ol.interaction.condition.singleClickOnly = function(mapBrowserEvent) {
  return mapBrowserEvent.type == ol.MapBrowserEvent.EventType.SINGLECLICK;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if there no modifier keys are pressed.
 */
ol.interaction.condition.noModifierKeys = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      !browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the platform modifier key is pressed.
 */
ol.interaction.condition.platformModifierKeyOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      !browserEvent.altKey &&
      browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the shift key is pressed.
 */
ol.interaction.condition.shiftKeyOnly = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  return (
      !browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      browserEvent.shiftKey);
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if the target element is not editable.
 */
ol.interaction.condition.targetNotEditable = function(mapBrowserEvent) {
  var browserEvent = mapBrowserEvent.browserEvent;
  var tagName = browserEvent.target.tagName;
  return (
      tagName !== goog.dom.TagName.INPUT &&
      tagName !== goog.dom.TagName.SELECT &&
      tagName !== goog.dom.TagName.TEXTAREA);
};
