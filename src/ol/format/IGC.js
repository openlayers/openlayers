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
function XML() {}

/**
 * Read the source document.
 *
 * @param {Document|Element|string} source The XML source.
 * @return {Object|null} An object representing the source.
 * @api
 */
XML.prototype.read = function (source) {
  if (!source) {
    return null;
  }
  if (typeof source === 'string') {
    var doc = parse(source);
    return this.readFromDocument(doc);
  }
  if (isDocument(source)) {
    return this.readFromDocument(/** @type {Document} */ (source));
  }
  return this.readFromNode(/** @type {Element} */ (source));
};

/**
 * @param {Document} doc Document.
 * @return {Object|null} Object
 */
XML.prototype.readFromDocument = function (doc) {
  for (var n = doc.firstChild; n; n = n.nextSibling) {
    if (n.nodeType == Node.ELEMENT_NODE) {
      return this.readFromNode(/** @type {Element} */ (n));
    }
  }
  return null;
};

/**
 * @abstract
 * @param {Element} node Node.
 * @return {Object|null} Object
 */
XML.prototype.readFromNode = function (node) {
  abstract();
};

export default XML;
