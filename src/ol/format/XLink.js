/**
 * @module ol/format/XLink
 */
var XLink = {};


/**
 * @const
 * @type {string}
 */
var NAMESPACE_URI = 'http://www.w3.org/1999/xlink';


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
XLink.readHref = function(node) {
  return node.getAttributeNS(NAMESPACE_URI, 'href');
};
export default XLink;
