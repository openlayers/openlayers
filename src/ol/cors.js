/**
 * @module ol/cors
 */

/**
 * Value to use for 'crossOrigin' attribute of images and media.
 *
 * The placeholder value 'no-cors' will mean the attribute should not be set,
 * and any fetch will occur without CORS. Use 'anonymous' or 'use-credentials'
 * to fetch using CORS, which is a requirement to for example access data from
 * a canvas object containing any image from a different origin.
 *
 * For more, see:
 * <https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image>
 * <https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin>
 * <https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/crossOrigin>
 *
 * @typedef {'anonymous'|'use-credentials'|'no-cors'} CrossOriginAttribute
 */

/**
 * Value to use for 'crossOrigin' attribute, or null to default.
 *
 * @typedef {CrossOriginAttribute|null} CrossOriginOption
 */

/**
 * Set the 'crossOrigin' attribute of an image or media element.
 *
 * The element attribute remains unset if 'no-cors' is the value.
 *
 * @param {HTMLImageElement|HTMLMediaElement} element HTML element to configure for cors.
 * @param {CrossOriginAttribute} crossOrigin The cors mode to use.
 */
export function setCrossOrigin(element, crossOrigin) {
  if (crossOrigin !== 'no-cors') {
    element.crossOrigin = crossOrigin;
  }
}
