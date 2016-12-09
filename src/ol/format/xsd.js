goog.provide('ol.format.XSD');

goog.require('ol');
goog.require('ol.xml');
goog.require('ol.string');


/**
 * @const
 * @type {string}
 */
ol.format.XSD.NAMESPACE_URI = 'http://www.w3.org/2001/XMLSchema';


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
ol.format.XSD.readBoolean = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  return ol.format.XSD.readBooleanString(s);
};


/**
 * @param {string} string String.
 * @return {boolean|undefined} Boolean.
 */
ol.format.XSD.readBooleanString = function(string) {
  var m = /^\s*(true|1)|(false|0)\s*$/.exec(string);
  if (m) {
    return m[1] !== undefined || false;
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @return {number|undefined} DateTime in seconds.
 */
ol.format.XSD.readDateTime = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  var dateTime = Date.parse(s);
  return isNaN(dateTime) ? undefined : dateTime / 1000;
};


/**
 * @param {Node} node Node.
 * @return {number|undefined} Decimal.
 */
ol.format.XSD.readDecimal = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  return ol.format.XSD.readDecimalString(s);
};


/**
 * @param {string} string String.
 * @return {number|undefined} Decimal.
 */
ol.format.XSD.readDecimalString = function(string) {
  // FIXME check spec
  var m = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(string);
  if (m) {
    return parseFloat(m[1]);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @return {number|undefined} Non negative integer.
 */
ol.format.XSD.readNonNegativeInteger = function(node) {
  var s = ol.xml.getAllTextContent(node, false);
  return ol.format.XSD.readNonNegativeIntegerString(s);
};


/**
 * @param {string} string String.
 * @return {number|undefined} Non negative integer.
 */
ol.format.XSD.readNonNegativeIntegerString = function(string) {
  var m = /^\s*(\d+)\s*$/.exec(string);
  if (m) {
    return parseInt(m[1], 10);
  } else {
    return undefined;
  }
};


/**
 * @param {Node} node Node.
 * @return {string|undefined} String.
 */
ol.format.XSD.readString = function(node) {
  return ol.xml.getAllTextContent(node, false).trim();
};


/**
 * @param {Node} node Node to append a TextNode with the boolean to.
 * @param {boolean} bool Boolean.
 */
ol.format.XSD.writeBooleanTextNode = function(node, bool) {
  ol.format.XSD.writeStringTextNode(node, (bool) ? '1' : '0');
};


/**
 * @param {Node} node Node to append a CDATA Section with the string to.
 * @param {string} string String.
 */
ol.format.XSD.writeCDATASection = function(node, string) {
  node.appendChild(ol.xml.DOCUMENT.createCDATASection(string));
};


/**
 * @param {Node} node Node to append a TextNode with the dateTime to.
 * @param {number} dateTime DateTime in seconds.
 */
ol.format.XSD.writeDateTimeTextNode = function(node, dateTime) {
  var date = new Date(dateTime * 1000);
  var string = date.getUTCFullYear() + '-' +
      ol.string.padNumber(date.getUTCMonth() + 1, 2) + '-' +
      ol.string.padNumber(date.getUTCDate(), 2) + 'T' +
      ol.string.padNumber(date.getUTCHours(), 2) + ':' +
      ol.string.padNumber(date.getUTCMinutes(), 2) + ':' +
      ol.string.padNumber(date.getUTCSeconds(), 2) + 'Z';
  node.appendChild(ol.xml.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} decimal Decimal.
 */
ol.format.XSD.writeDecimalTextNode = function(node, decimal) {
  var string = decimal.toPrecision();
  node.appendChild(ol.xml.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} nonNegativeInteger Non negative integer.
 */
ol.format.XSD.writeNonNegativeIntegerTextNode = function(node, nonNegativeInteger) {
  ol.DEBUG && console.assert(nonNegativeInteger >= 0, 'value should be more than 0');
  ol.DEBUG && console.assert(nonNegativeInteger == (nonNegativeInteger | 0),
      'value should be an integer value');
  var string = nonNegativeInteger.toString();
  node.appendChild(ol.xml.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the string to.
 * @param {string} string String.
 */
ol.format.XSD.writeStringTextNode = function(node, string) {
  node.appendChild(ol.xml.DOCUMENT.createTextNode(string));
};
