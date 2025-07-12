/**
 * @module ol/format/XML
 */
import { abstract } from '../util.js';
import { isDocument, parse } from '../xml.js';

/**
 * @classdesc
 * Generic format for reading non-feature XML data.
 *
 * This is an abstract base class. Subclasses must implement `readFromNode`.
 *
 * @abstract
 * @api
 */
class XML {
  /**
   * Read and parse the XML source into a JavaScript object.
   *
   * @param {Document|Element|string|null|undefined} source The XML source.
   * @return {Object|null} Parsed object or `null` if source is invalid.
   * @api
   */
  read(source) {
    if (!source) return null;

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
   * Read from a full XML Document.
   *
   * @param {Document} doc XML Document.
   * @return {Object|null} Parsed object or `null`.
   */
  readFromDocument(doc) {
    const root = Array.from(doc.childNodes).find(
      (node) => node.nodeType === Node.ELEMENT_NODE
    );
    return root ? this.readFromNode(/** @type {Element} */ (root)) : null;
  }

  /**
   * Read from an XML Element. Must be implemented by subclasses.
   *
   * @abstract
   * @param {Element} node XML Element.
   * @return {Object|null} Parsed object.
   */
  readFromNode(node) {
    abstract(); // Enforces implementation by subclass
  }
}

export default XML;
