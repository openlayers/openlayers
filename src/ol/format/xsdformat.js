goog.provide('ol.format.XSD');

goog.require('goog.asserts');
goog.require('goog.string');
goog.require('ol');
goog.require('ol.xml');


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
  var re =
      /^\s*(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(?:([+\-])(\d{2})(?::(\d{2}))?))\s*$/;
  var m = re.exec(s);
  if (m) {
    var year = parseInt(m[1], 10);
    var month = parseInt(m[2], 10) - 1;
    var day = parseInt(m[3], 10);
    var hour = parseInt(m[4], 10);
    var minute = parseInt(m[5], 10);
    var second = parseInt(m[6], 10);
    var dateTime = Date.UTC(year, month, day, hour, minute, second) / 1000;
    if (m[7] != 'Z') {
      var sign = m[8] == '-' ? -1 : 1;
      dateTime += sign * 60 * parseInt(m[9], 10);
      if (m[10] !== undefined) {
        dateTime += sign * 60 * 60 * parseInt(m[10], 10);
      }
    }
    return dateTime;
  } else {
    return undefined;
  }
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
 * @param {Node} node Node to append a TextNode with the dateTime to.
 * @param {number} dateTime DateTime in seconds.
 */
ol.format.XSD.writeDateTimeTextNode = function(node, dateTime) {
  var date = new Date(dateTime * 1000);
  var string = date.getUTCFullYear() + '-' +
      goog.string.padNumber(date.getUTCMonth() + 1, 2) + '-' +
      goog.string.padNumber(date.getUTCDate(), 2) + 'T' +
      goog.string.padNumber(date.getUTCHours(), 2) + ':' +
      goog.string.padNumber(date.getUTCMinutes(), 2) + ':' +
      goog.string.padNumber(date.getUTCSeconds(), 2) + 'Z';
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
ol.format.XSD.writeNonNegativeIntegerTextNode =
    function(node, nonNegativeInteger) {
  goog.asserts.assert(nonNegativeInteger >= 0, 'value should be more than 0');
  goog.asserts.assert(nonNegativeInteger == (nonNegativeInteger | 0),
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
