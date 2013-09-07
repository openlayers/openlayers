goog.provide('ol.interaction.ConditionType');
goog.provide('ol.interaction.condition');

goog.require('goog.dom.TagName');
goog.require('goog.events.EventType');
goog.require('goog.functions');


/**
 * @typedef {function(goog.events.BrowserEvent): boolean}
 */
ol.interaction.ConditionType;


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True if only the alt key is pressed.
 */
ol.interaction.condition.altKeyOnly = function(browserEvent) {
  return (
      browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True if only the alt and shift keys are pressed.
 */
ol.interaction.condition.altShiftKeysOnly = function(browserEvent) {
  return (
      browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      browserEvent.shiftKey);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True.
 */
ol.interaction.condition.always = goog.functions.TRUE;


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True only the event is a click event.
 */
ol.interaction.condition.clickOnly = function(browserEvent) {
  return browserEvent.type == goog.events.EventType.CLICK;
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True if only the no modifier keys are pressed.
 */
ol.interaction.condition.noModifierKeys = function(browserEvent) {
  return (
      !browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True if only the platform modifier key is pressed.
 */
ol.interaction.condition.platformModifierKeyOnly = function(browserEvent) {
  return (
      !browserEvent.altKey &&
      browserEvent.platformModifierKey &&
      !browserEvent.shiftKey);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True if only the shift key is pressed.
 */
ol.interaction.condition.shiftKeyOnly = function(browserEvent) {
  return (
      !browserEvent.altKey &&
      !browserEvent.platformModifierKey &&
      browserEvent.shiftKey);
};


/**
 * @param {goog.events.BrowserEvent} browserEvent Browser event.
 * @return {boolean} True if the target element is not editable.
 */
ol.interaction.condition.targetNotEditable = function(browserEvent) {
  var tagName = browserEvent.target.tagName;
  return (
      tagName !== goog.dom.TagName.INPUT &&
      tagName !== goog.dom.TagName.SELECT &&
      tagName !== goog.dom.TagName.TEXTAREA);
};
