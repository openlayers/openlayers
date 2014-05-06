goog.provide('ol.format.XLink');


/**
 * @const
 * @type {string}
 */
ol.format.XLink.NAMESPACE_URI = 'http://www.w3.org/1999/xlink';


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
ol.format.XLink.readHref = function(node) {
  return node.getAttributeNS(ol.format.XLink.NAMESPACE_URI, 'href');
};
