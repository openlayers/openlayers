/**
 * @module ol/uri
 */

import {modulo} from './math.js';
import {hashZXY} from './tilecoord.js';

/**
 * Appends query parameters to a URI.
 *
 * @param {string} uri The original URI, which may already have query data.
 * @param {!Object} params An object where keys are URI-encoded parameter keys,
 *     and the values are arbitrary types or arrays.
 * @return {string} The new URI.
 */
export function appendParams(uri, params) {
  /** @type {Array<string>} */
  const keyParams = [];
  // Skip any null or undefined parameter values
  Object.keys(params).forEach(function (k) {
    if (params[k] !== null && params[k] !== undefined) {
      keyParams.push(k + '=' + encodeURIComponent(params[k]));
    }
  });
  const qs = keyParams.join('&');
  // remove any trailing ? or &
  uri = uri.replace(/[?&]$/, '');
  // append ? or & depending on whether uri has existing parameters
  uri += uri.includes('?') ? '&' : '?';
  return uri + qs;
}

const zRegEx = /\{z\}/g;
const xRegEx = /\{x\}/g;
const yRegEx = /\{y\}/g;
const dashYRegEx = /\{-y\}/g;

/**
 * @param {string} template The URL template.  Should have `{x}`, `{y}`, and `{z}` placeholders.  If
 * the template has a `{-y}` placeholder, the `maxY` parameter must be supplied.
 * @param {number} z The tile z coordinate.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @param {number} [maxY] The maximum y coordinate at the given z level.
 * @return {string} The URL.
 */
export function renderXYZTemplate(template, z, x, y, maxY) {
  return template
    .replace(zRegEx, z.toString())
    .replace(xRegEx, x.toString())
    .replace(yRegEx, y.toString())
    .replace(dashYRegEx, function () {
      if (maxY === undefined) {
        throw new Error(
          'If the URL template has a {-y} placeholder, the grid extent must be known',
        );
      }
      return (maxY - y).toString();
    });
}

/**
 * @param {Array<string>} urls List of URLs.
 * @param {number} z The tile z coordinate.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @return {string} The chosen URL.
 */
export function pickUrl(urls, z, x, y) {
  const hash = hashZXY(z, x, y);
  const index = modulo(hash, urls.length);
  return urls[index];
}

/**
 * @param {string} url URL.
 * @return {Array<string>} Array of urls.
 */
export function expandUrl(url) {
  const urls = [];
  let match = /\{([a-z])-([a-z])\}/.exec(url);
  if (match) {
    // char range
    const startCharCode = match[1].charCodeAt(0);
    const stopCharCode = match[2].charCodeAt(0);
    let charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      urls.push(url.replace(match[0], String.fromCharCode(charCode)));
    }
    return urls;
  }
  match = /\{(\d+)-(\d+)\}/.exec(url);
  if (match) {
    // number range
    const stop = parseInt(match[2], 10);
    for (let i = parseInt(match[1], 10); i <= stop; i++) {
      urls.push(url.replace(match[0], i.toString()));
    }
    return urls;
  }
  urls.push(url);
  return urls;
}
