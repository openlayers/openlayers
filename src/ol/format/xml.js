import _ol_xml_ from '../xml';

/**
 * @classdesc
 * Generic format for reading non-feature XML data
 *
 * @constructor
 * @abstract
 * @struct
 */
var _ol_format_XML_ = function() {
};


/**
 * @param {Document|Node|string} source Source.
 * @return {Object} The parsed result.
 */
_ol_format_XML_.prototype.read = function(source) {
  if (_ol_xml_.isDocument(source)) {
    return this.readFromDocument(/** @type {Document} */ (source));
  } else if (_ol_xml_.isNode(source)) {
    return this.readFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = _ol_xml_.parse(source);
    return this.readFromDocument(doc);
  } else {
    return null;
  }
};


/**
 * @abstract
 * @param {Document} doc Document.
 * @return {Object} Object
 */
_ol_format_XML_.prototype.readFromDocument = function(doc) {};


/**
 * @abstract
 * @param {Node} node Node.
 * @return {Object} Object
 */
_ol_format_XML_.prototype.readFromNode = function(node) {};
export default _ol_format_XML_;
