/**
 * @module ol/format/XML
 */
import {isDocument, isNode, parse} from '../xml.js';

/**
 * @classdesc
 * Generic format for reading non-feature XML data
 *
 * @constructor
 * @abstract
 * @struct
 */
const XML = function() {
};


/**
 * @param {Document|Node|string} source Source.
 * @return {Object} The parsed result.
 */
XML.prototype.read = function(source) {
  if (isDocument(source)) {
    return this.readFromDocument(/** @type {Document} */ (source));
  } else if (isNode(source)) {
    return this.readFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    const doc = parse(source);
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
