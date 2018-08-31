/**
 * @module ol/format/XML
 */
import {isDocument, isNode, parse} from '../xml.js';

/**
 * @classdesc
 * Generic format for reading non-feature XML data
 *
 * @abstract
 */
class XML {
  /**
   * Read the source document.
   *
   * @param {Document|Element|string} source The XML source.
   * @return {Object} An object representing the source.
   * @api
   */
  read(source) {
    if (isDocument(source)) {
      return this.readFromDocument(/** @type {Document} */ (source));
    } else if (isNode(source)) {
      return this.readFromNode(/** @type {Element} */ (source));
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
   * @param {Element} node Node.
   * @return {Object} Object
   */
  readFromNode(node) {}
}

export default XML;
