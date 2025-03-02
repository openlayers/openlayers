/**
 * @module ol/events/condition
 */
import MapBrowserEventType from '../MapBrowserEventType.js';
import {FALSE, TRUE} from '../functions.js';
import {MAC, WEBKIT} from '../has.js';

/**
 * A function that takes a {@link module:ol/MapBrowserEvent~MapBrowserEvent} and returns a
 * `{boolean}`. If the condition is met, true should be returned.
 *
 * @typedef {function(this: ?, import("../MapBrowserEvent.js").default): boolean} Condition
 */

/**
 * Creates a condition function that passes when all provided conditions pass.
 * @param {...Condition} var_args Conditions to check.
 * @return {Condition} Condition function.
 */
export function all(var_args) {
  const conditions = arguments;
  /**
   * @param {import("../MapBrowserEvent.js").default} event Event.
   * @return {boolean} All conditions passed.
   */
  return function (event) {
    let pass = true;
    for (let i = 0, ii = conditions.length; i < ii; ++i) {
      pass = pass && conditions[i](event);
      if (!pass) {
        break;
      }
    }
    return pass;
  };
}

/**
 * Return `true` if only the alt-key is pressed, `false` otherwise (e.g. when
 * additionally the shift-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt key is pressed.
 * @api
 */
export const altKeyOnly = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return (
    originalEvent.altKey &&
    !(originalEvent.metaKey || originalEvent.ctrlKey) &&
    !originalEvent.shiftKey
  );
};

/**
 * Return `true` if only the alt-key and shift-key is pressed, `false` otherwise
 * (e.g. when additionally the platform-modifier-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the alt and shift keys are pressed.
 * @api
 */
export const altShiftKeysOnly = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return (
    originalEvent.altKey &&
    !(originalEvent.metaKey || originalEvent.ctrlKey) &&
    originalEvent.shiftKey
  );
};

/**
 * Return `true` if the map has the focus. This condition requires a map target
 * element with a `tabindex` attribute, e.g. `<div id="map" tabindex="1">`.
 *
 * @param {import("../MapBrowserEvent.js").default} event Map browser event.
 * @return {boolean} The map has the focus.
 * @api
 */
export const focus = function (event) {
  const targetElement = event.map.getTargetElement();
  const rootNode = targetElement.getRootNode();
  const activeElement = event.map.getOwnerDocument().activeElement;

  return rootNode instanceof ShadowRoot
    ? rootNode.host.contains(activeElement)
    : targetElement.contains(activeElement);
};

/**
 * Return `true` if the map has the focus or no 'tabindex' attribute set.
 *
 * @param {import("../MapBrowserEvent.js").default} event Map browser event.
 * @return {boolean} The map container has the focus or no 'tabindex' attribute.
 */
export const focusWithTabindex = function (event) {
  const targetElement = event.map.getTargetElement();
  const rootNode = targetElement.getRootNode();
  const tabIndexCandidate =
    rootNode instanceof ShadowRoot ? rootNode.host : targetElement;

  return tabIndexCandidate.hasAttribute('tabindex') ? focus(event) : true;
};

/**
 * Return always true.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True.
 * @api
 */
export const always = TRUE;

/**
 * Return `true` if the event is a `click` event, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `click` event.
 * @api
 */
export const click = function (mapBrowserEvent) {
  return mapBrowserEvent.type == MapBrowserEventType.CLICK;
};

/**
 * Return `true` if the event has an "action"-producing mouse button.
 *
 * By definition, this includes left-click on windows/linux, and left-click
 * without the ctrl key on Macs.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} The result.
 */
export const mouseActionButton = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return (
    originalEvent instanceof PointerEvent &&
    originalEvent.button == 0 &&
    !(WEBKIT && MAC && originalEvent.ctrlKey)
  );
};

/**
 * Return always false.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} False.
 * @api
 */
export const never = FALSE;

/**
 * Return `true` if the browser event is a `pointermove` event, `false`
 * otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the browser event is a `pointermove` event.
 * @api
 */
export const pointerMove = function (mapBrowserEvent) {
  return mapBrowserEvent.type == 'pointermove';
};

/**
 * Return `true` if the event is a map `singleclick` event, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `singleclick` event.
 * @api
 */
export const singleClick = function (mapBrowserEvent) {
  return mapBrowserEvent.type == MapBrowserEventType.SINGLECLICK;
};

/**
 * Return `true` if the event is a map `dblclick` event, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event is a map `dblclick` event.
 * @api
 */
export const doubleClick = function (mapBrowserEvent) {
  return mapBrowserEvent.type == MapBrowserEventType.DBLCLICK;
};

/**
 * Return `true` if no modifier key (alt-, shift- or platform-modifier-key) is
 * pressed.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True only if there no modifier keys are pressed.
 * @api
 */
export const noModifierKeys = function (mapBrowserEvent) {
  const originalEvent = /** @type {KeyboardEvent|MouseEvent|TouchEvent} */ (
    mapBrowserEvent.originalEvent
  );
  return (
    !originalEvent.altKey &&
    !(originalEvent.metaKey || originalEvent.ctrlKey) &&
    !originalEvent.shiftKey
  );
};

/**
 * Return `true` if only the platform-modifier-key (the meta-key on Mac,
 * ctrl-key otherwise) is pressed, `false` otherwise (e.g. when additionally
 * the shift-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the platform modifier key is pressed.
 * @api
 */
export const platformModifierKeyOnly = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return (
    !originalEvent.altKey &&
    (MAC ? originalEvent.metaKey : originalEvent.ctrlKey) &&
    !originalEvent.shiftKey
  );
};

/**
 * Return `true` if the platform-modifier-key (the meta-key on Mac,
 * ctrl-key otherwise) is pressed.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the platform modifier key is pressed.
 * @api
 */
export const platformModifierKey = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return MAC ? originalEvent.metaKey : originalEvent.ctrlKey;
};

/**
 * Return `true` if only the shift-key is pressed, `false` otherwise (e.g. when
 * additionally the alt-key is pressed).
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if only the shift key is pressed.
 * @api
 */
export const shiftKeyOnly = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  return (
    !originalEvent.altKey &&
    !(originalEvent.metaKey || originalEvent.ctrlKey) &&
    originalEvent.shiftKey
  );
};

/**
 * Return `true` if the target element is not editable, i.e. not an `input`,
 * `select`, or `textarea` element and no `contenteditable` attribute is
 * set or inherited, `false` otherwise.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True only if the target element is not editable.
 * @api
 */
export const targetNotEditable = function (mapBrowserEvent) {
  const originalEvent = mapBrowserEvent.originalEvent;
  const tagName = /** @type {Element} */ (originalEvent.target).tagName;
  return (
    tagName !== 'INPUT' &&
    tagName !== 'SELECT' &&
    tagName !== 'TEXTAREA' &&
    // `isContentEditable` is only available on `HTMLElement`, but it may also be a
    // different type like `SVGElement`.
    // @ts-ignore
    !originalEvent.target.isContentEditable
  );
};

/**
 * Return `true` if the event originates from a mouse device.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a mouse device.
 * @api
 */
export const mouseOnly = function (mapBrowserEvent) {
  const pointerEvent = mapBrowserEvent.originalEvent;
  // see https://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
  return (
    pointerEvent instanceof PointerEvent && pointerEvent.pointerType == 'mouse'
  );
};

/**
 * Return `true` if the event originates from a touchable device.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a touchable device.
 * @api
 */
export const touchOnly = function (mapBrowserEvent) {
  const pointerEvt = mapBrowserEvent.originalEvent;
  // see https://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
  return (
    pointerEvt instanceof PointerEvent && pointerEvt.pointerType === 'touch'
  );
};

/**
 * Return `true` if the event originates from a digital pen.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a digital pen.
 * @api
 */
export const penOnly = function (mapBrowserEvent) {
  const pointerEvt = mapBrowserEvent.originalEvent;
  // see https://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
  return pointerEvt instanceof PointerEvent && pointerEvt.pointerType === 'pen';
};

/**
 * Return `true` if the event originates from a primary pointer in
 * contact with the surface or if the left mouse button is pressed.
 * See https://www.w3.org/TR/pointerevents/#button-states.
 *
 * @param {import("../MapBrowserEvent.js").default} mapBrowserEvent Map browser event.
 * @return {boolean} True if the event originates from a primary pointer.
 * @api
 */
export const primaryAction = function (mapBrowserEvent) {
  const pointerEvent = mapBrowserEvent.originalEvent;
  return (
    pointerEvent instanceof PointerEvent &&
    pointerEvent.isPrimary &&
    pointerEvent.button === 0
  );
};
