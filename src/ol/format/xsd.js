import _ol_xml_ from '../xml';
import _ol_string_ from '../string';
var _ol_format_XSD_ = {};


/**
 * @const
 * @type {string}
 */
_ol_format_XSD_.NAMESPACE_URI = 'http://www.w3.org/2001/XMLSchema';


/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
_ol_format_XSD_.readBoolean = function(node) {
  var s = _ol_xml_.getAllTextContent(node, false);
  return _ol_format_XSD_.readBooleanString(s);
};


/**
 * @param {string} string String.
 * @return {boolean|undefined} Boolean.
 */
_ol_format_XSD_.readBooleanString = function(string) {
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
_ol_format_XSD_.readDateTime = function(node) {
  var s = _ol_xml_.getAllTextContent(node, false);
  var dateTime = Date.parse(s);
  return isNaN(dateTime) ? undefined : dateTime / 1000;
};


/**
 * @param {Node} node Node.
 * @return {number|undefined} Decimal.
 */
_ol_format_XSD_.readDecimal = function(node) {
  var s = _ol_xml_.getAllTextContent(node, false);
  return _ol_format_XSD_.readDecimalString(s);
};


/**
 * @param {string} string String.
 * @return {number|undefined} Decimal.
 */
_ol_format_XSD_.readDecimalString = function(string) {
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
_ol_format_XSD_.readNonNegativeInteger = function(node) {
  var s = _ol_xml_.getAllTextContent(node, false);
  return _ol_format_XSD_.readNonNegativeIntegerString(s);
};


/**
 * @param {string} string String.
 * @return {number|undefined} Non negative integer.
 */
_ol_format_XSD_.readNonNegativeIntegerString = function(string) {
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
_ol_format_XSD_.readString = function(node) {
  return _ol_xml_.getAllTextContent(node, false).trim();
};


/**
 * @param {Node} node Node to append a TextNode with the boolean to.
 * @param {boolean} bool Boolean.
 */
_ol_format_XSD_.writeBooleanTextNode = function(node, bool) {
  _ol_format_XSD_.writeStringTextNode(node, (bool) ? '1' : '0');
};


/**
 * @param {Node} node Node to append a CDATA Section with the string to.
 * @param {string} string String.
 */
_ol_format_XSD_.writeCDATASection = function(node, string) {
  node.appendChild(_ol_xml_.DOCUMENT.createCDATASection(string));
};


/**
 * @param {Node} node Node to append a TextNode with the dateTime to.
 * @param {number} dateTime DateTime in seconds.
 */
_ol_format_XSD_.writeDateTimeTextNode = function(node, dateTime) {
  var date = new Date(dateTime * 1000);
  var string = date.getUTCFullYear() + '-' +
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
_ol_format_XSD_.writeDecimalTextNode = function(node, decimal) {
  var string = decimal.toPrecision();
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} nonNegativeInteger Non negative integer.
 */
_ol_format_XSD_.writeNonNegativeIntegerTextNode = function(node, nonNegativeInteger) {
  var string = nonNegativeInteger.toString();
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};


/**
 * @param {Node} node Node to append a TextNode with the string to.
 * @param {string} string String.
 */
_ol_format_XSD_.writeStringTextNode = function(node, string) {
  node.appendChild(_ol_xml_.DOCUMENT.createTextNode(string));
};
export default _ol_format_XSD_;
