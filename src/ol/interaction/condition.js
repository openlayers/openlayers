goog.provide('ol.interaction.ConditionType');
goog.provide('ol.interaction.condition');


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
