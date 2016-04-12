goog.provide('ol.format.XML');

goog.require('goog.asserts');
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
    goog.asserts.fail();
    return null;
  }
};


/**
 * @param {Document} doc Document.
 * @return {Object}
 */
ol.format.XML.prototype.readFromDocument = goog.abstractMethod;


/**
 * @param {Node} node Node.
 * @return {Object}
 */
ol.format.XML.prototype.readFromNode = goog.abstractMethod;
