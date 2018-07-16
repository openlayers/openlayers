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
class XML {
  /**
  * @param {Document|Node|string} source Source.
  * @return {Object} The parsed result.
  */
  read(source) {
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
  }

  /**
  * @abstract
  * @param {Document} doc Document.
  * @return {Object} Object
  */
  readFromDocument(doc) {}

  /**
  * @abstract
  * @param {Node} node Node.
  * @return {Object} Object
  */
  readFromNode(node) {}
}

export default XML;
