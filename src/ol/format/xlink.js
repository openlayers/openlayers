/**
 * @module ol/format/xlink
 */

/**
 * @const
 * @type {string}
 */
const NAMESPACE_URI = 'http://www.w3.org/1999/xlink';

/**
 * @param {Element} node Node.
 * @return {string|null} href.
 */
export function readHref(node) {
  return node.getAttributeNS(NAMESPACE_URI, 'href');
}
