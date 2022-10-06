import {DEVICE_PIXEL_RATIO} from './has.js';

/**
 * If the map is scaled using css transform scale(), pointer events for interactions will be offset.
 * This function calculates the scale from the event so we can take that into account when handling the interactions.
 *
 * @param {HTMLCanvasElement} el Event target element (the map Canvas element)
 * @return {Array} Array of x-scale and y-scale
 */
export function getCanvasScale(el) {
  if(!(el instanceof HTMLCanvasElement)) {
    return [1, 1]
  }
  const scaleX = el.getBoundingClientRect().width * DEVICE_PIXEL_RATIO / el.offsetWidth
  const scaleY = el.getBoundingClientRect().height * DEVICE_PIXEL_RATIO / el.offsetHeight
  return [scaleX,scaleY]
}
