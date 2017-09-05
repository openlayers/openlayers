var _ol_format_XLink_ = {};


/**
 * @const
 * @type {string}
 */
_ol_format_XLink_.NAMESPACE_URI = 'http://www.w3.org/1999/xlink';


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
_ol_format_XLink_.readHref = function(node) {
  return node.getAttributeNS(_ol_format_XLink_.NAMESPACE_URI, 'href');
};
export default _ol_format_XLink_;
