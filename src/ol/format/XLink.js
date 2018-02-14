/**
 * @module ol/format/XLink
 */


/**
 * @const
 * @type {string}
 */
const NAMESPACE_URI = 'http://www.w3.org/1999/xlink';


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
export function readHref(node) {
  return node.getAttributeNS(NAMESPACE_URI, 'href');
}
