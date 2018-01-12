/**
 * @module ol/format/XSD
 */
import _ol_xml_ from '../xml.js';
import _ol_string_ from '../string.js';
const XSD = {};


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
XSD.readBoolean = function(node) {
  const s = _ol_xml_.getAllTextContent(node, false);
  return XSD.readBooleanString(s);
};


/**
 * @param {string} string String.
 * @return {boolean|undefined} Boolean.
 */
XSD.readBooleanString = function(string) {
  const m = /^\s*(true|1)|(false|0)\s*$/.exec(string);
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
XSD.readDateTime = function(node) {
  const s = _ol_xml_.getAllTextContent(node, false);
  const dateTime = Date.parse(s);
  return isNaN(dateTime) ? undefined : dateTime / 1000;
};


/**
 * @param {Node} node Node.
 * @return {number|undefined} Decimal.
 */
XSD.readDecimal = function(node) {
  const s = _ol_xml_.getAllTextContent(node, false);
  return XSD.readDecimalString(s);
};


/**
 * @param {string} string String.
 * @return {number|undefined} Decimal.
 */
XSD.readDecimalString = function(string) {
  // FIXME check spec
  const m = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(string);
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
XSD.readNonNegativeInteger = function(node) {
  const s = _ol_xml_.getAllTextContent(node, false);
  return XSD.readNonNegativeIntegerString(s);
};


/**
 * @param {string} string String.
 * @return {number|undefined} Non negative integer.
 */
XSD.readNonNegativeIntegerString = function(string) {
  const m = /^\s*(\d+)\s*$/.exec(string);
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
XSD.readString = function(node) {
  return _ol_xml_.getAllTextContent(node, false).trim();
};


/**
 * @param {Node} node Node to append a TextNode with the boolean to.
 * @param {boolean} bool Boolean.
 */
XSD.writeBooleanTextNode = function(node, bool) {
  XSD.writeStringTextNode(node, (bool) ? '1' : '0');
};


/**
 * @param {Node} node Node to append a CDATA Section with the string to.
 * @param {string} string String.
 */
XSD.writeCDATASection = function(node, string) {
  node.appendChild(_ol_xml_.DOCUMENT.createCDATASection(string));
};


/**
 * @param {Node} node Node to append a TextNode with the dateTime to.
 * @param {number} dateTime DateTime in seconds.
 */
XSD.writeDateTimeTextNode = function(node, dateTime) {
  const date = new Date(dateTime * 1000);
  const string = date.getUTCFullYear() + '-' +
      _ol_string_.padNumber(date.getUTCMonth() + 1, 2) + '-' +
      _ol_string_.padNumber(date.getUTCDate(), 2) + 'T' +
      _ol_string_.padNumber(date.getUTCHours(), 2) + ':' +
      _ol_string_.padNumber(date.getUTCMinutes(), 2) + ':' +
      _ol_string_.padNumber(date.getUTCSeconds(), 2) + 'Z';
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} decimal Decimal.
 */
XSD.writeDecimalTextNode = function(node, decimal) {
  const string = decimal.toPrecision();
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} nonNegativeInteger Non negative integer.
 */
XSD.writeNonNegativeIntegerTextNode = function(node, nonNegativeInteger) {
  const string = nonNegativeInteger.toString();
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the string to.
 * @param {string} string String.
 */
XSD.writeStringTextNode = function(node, string) {
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};
export default XSD;
