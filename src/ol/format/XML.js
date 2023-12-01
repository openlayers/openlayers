/**
 * @module ol/format/XML
 */
import {abstract} from '../util.js';
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
   * @return {Object|null} An object representing the source.
   * @api
   */
  read(source) {
    if (!source) {
      return null;
    }
    if (typeof source === 'string') {
      const doc = parse(source);
      return this.readFromDocument(doc);
    }
    if (isDocument(source)) {
      return this.readFromDocument(/** @type {Document} */ (source));
    }
    return this.readFromNode(/** @type {Element} */ (source));
  }

  /**
   * @param {Document} doc Document.
   * @return {Object|null} Object
   */
  readFromDocument(doc) {
    for (let n = doc.firstChild; n; n = n.nextSibling) {
      if (n.nodeType == Node.ELEMENT_NODE) {
        return this.readFromNode(/** @type {Element} */ (n));
      }
    }
    return null;
  }

  /**
   * @abstract
   * @param {Element} node Node.
   * @return {Object|null} Object
   */
  readFromNode(node) {
    abstract();
  }
}

export default XML;
