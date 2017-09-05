import _ol_MapBrowserEventType_ from '../mapbrowsereventtype';
import _ol_asserts_ from '../asserts';
import _ol_functions_ from '../functions';
import _ol_has_ from '../has';
var _ol_events_condition_ = {};


/**
 * Return `true` if only the alt-key is pressed, `false` otherwise (e.g. when
 * additionally the shift-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt key is pressed.
 * @api
 */
_ol_events_condition_.altKeyOnly = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return (
    originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      !originalEvent.shiftKey);
};


/**
 * Return `true` if only the alt-key and shift-key is pressed, `false` otherwise
 * (e.g. when additionally the platform-modifier-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt and shift keys are pressed.
 * @api
 */
_ol_events_condition_.altShiftKeysOnly = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return (
    originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      originalEvent.shiftKey);
};


/**
 * Return always true.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True.
 * @function
 * @api
 */
_ol_events_condition_.always = _ol_functions_.TRUE;


/**
 * Return `true` if the event is a `click` event, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `click` event.
 * @api
 */
_ol_events_condition_.click = function(mapBrowserEvent) {
  return mapBrowserEvent.type == _ol_MapBrowserEventType_.CLICK;
};


/**
 * Return `true` if the event has an "action"-producing mouse button.
 *
 * By definition, this includes left-click on windows/linux, and left-click
 * without the ctrl key on Macs.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} The result.
 */
_ol_events_condition_.mouseActionButton = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return originalEvent.button == 0 &&
      !(_ol_has_.WEBKIT && _ol_has_.MAC && originalEvent.ctrlKey);
};


/**
 * Return always false.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} False.
 * @function
 * @api
 */
_ol_events_condition_.never = _ol_functions_.FALSE;


/**
 * Return `true` if the browser event is a `pointermove` event, `false`
 * otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the browser event is a `pointermove` event.
 * @api
 */
_ol_events_condition_.pointerMove = function(mapBrowserEvent) {
  return mapBrowserEvent.type == 'pointermove';
};


/**
 * Return `true` if the event is a map `singleclick` event, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `singleclick` event.
 * @api
 */
_ol_events_condition_.singleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == _ol_MapBrowserEventType_.SINGLECLICK;
};


/**
 * Return `true` if the event is a map `dblclick` event, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `dblclick` event.
 * @api
 */
_ol_events_condition_.doubleClick = function(mapBrowserEvent) {
  return mapBrowserEvent.type == _ol_MapBrowserEventType_.DBLCLICK;
};


/**
 * Return `true` if no modifier key (alt-, shift- or platform-modifier-key) is
 * pressed.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if there no modifier keys are pressed.
 * @api
 */
_ol_events_condition_.noModifierKeys = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return (
    !originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      !originalEvent.shiftKey);
};


/**
 * Return `true` if only the platform-modifier-key (the meta-key on Mac,
 * ctrl-key otherwise) is pressed, `false` otherwise (e.g. when additionally
 * the shift-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the platform modifier key is pressed.
 * @api
 */
_ol_events_condition_.platformModifierKeyOnly = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return !originalEvent.altKey &&
    (_ol_has_.MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
    !originalEvent.shiftKey;
};


/**
 * Return `true` if only the shift-key is pressed, `false` otherwise (e.g. when
 * additionally the alt-key is pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the shift key is pressed.
 * @api
 */
_ol_events_condition_.shiftKeyOnly = function(mapBrowserEvent) {
  var originalEvent = mapBrowserEvent.originalEvent;
  return (
    !originalEvent.altKey &&
      !(originalEvent.metaKey || originalEvent.ctrlKey) &&
      originalEvent.shiftKey);
};


/**
 * Return `true` if the target element is not editable, i.e. not a `<input>`-,
 * `<select>`- or `<textarea>`-element, `false` otherwise.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True only if the target element is not editable.
 * @api
 */
_ol_events_condition_.targetNotEditable = function(mapBrowserEvent) {
  var target = mapBrowserEvent.originalEvent.target;
  var tagName = target.tagName;
  return (
    tagName !== 'INPUT' &&
      tagName !== 'SELECT' &&
      tagName !== 'TEXTAREA');
};


/**
 * Return `true` if the event originates from a mouse device.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a mouse device.
 * @api
 */
_ol_events_condition_.mouseOnly = function(mapBrowserEvent) {
  _ol_asserts_.assert(mapBrowserEvent.pointerEvent, 56); // mapBrowserEvent must originate from a pointer event
  // see http://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
  return /** @type {ol.MapBrowserEvent} */ (mapBrowserEvent).pointerEvent.pointerType == 'mouse';
};


/**
 * Return `true` if the event originates from a primary pointer in
 * contact with the surface or if the left mouse button is pressed.
 * @see http://www.w3.org/TR/pointerevents/#button-states
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a primary pointer.
 * @api
 */
_ol_events_condition_.primaryAction = function(mapBrowserEvent) {
  var pointerEvent = mapBrowserEvent.pointerEvent;
  return pointerEvent.isPrimary && pointerEvent.button === 0;
};
export default _ol_events_condition_;
