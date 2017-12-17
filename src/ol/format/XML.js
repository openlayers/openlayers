/**
 * @module ol/format/XML
 */
import _ol_xml_ from '../xml.js';

/**
 * @classdesc
 * Generic format for reading non-feature XML data
 *
 * @constructor
 * @abstract
 * @struct
 */
var XML = function() {
};


/**
 * @param {Document|Node|string} source Source.
 * @return {Object} The parsed result.
 */
XML.prototype.read = function(source) {
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
XML.prototype.readFromDocument = function(doc) {};


/**
 * @abstract
 * @param {Node} node Node.
 * @return {Object} Object
 */
XML.prototype.readFromNode = function(node) {};
export default XML;
