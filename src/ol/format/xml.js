goog.provide('ol.format.XML');

goog.require('ol.xml');


/**
 * @classdesc
 * Generic format for reading non-feature XML data
 *
 * @constructor
 * @struct
 */
ol.format.XML = function() {
};


/**
 * @param {Document|Node|string} source Source.
 * @return {Object} The parsed result.
 */
ol.format.XML.prototype.read = function(source) {
  if (ol.xml.isDocument(source)) {
    return this.readFromDocument(/** @type {Document} */ (source));
  } else if (ol.xml.isNode(source)) {
    return this.readFromNode(/** @type {Node} */ (source));
  } else if (typeof source === 'string') {
    var doc = ol.xml.parse(source);
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
ol.format.XML.prototype.readFromDocument = function(doc) {};


/**
 * @abstract
 * @param {Node} node Node.
 * @return {Object} Object
 */
ol.format.XML.prototype.readFromNode = function(node) {};
