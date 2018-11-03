/**
 * @module ol/format/XML
 */
import {isDocument, parse} from '../xml.js';

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
    if (!source) {
      return null;
    } else if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFromDocument(doc);
    } else if (isDocument(source)) {
      return this.readFromDocument(/** @type {Document} */ (source));
    } else {
      return this.readFromNode(/** @type {Element} */ (source));
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
