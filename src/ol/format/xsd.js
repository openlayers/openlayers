/**
 * @module ol/format/xsd
 */
import {padNumber} from '../string.js';
import {getAllTextContent, getDocument} from '../xml.js';

/**
 * @param {Node} node Node.
 * @return {boolean|undefined} Boolean.
 */
export function readBoolean(node) {
  const s = getAllTextContent(node, false);
  return readBooleanString(s);
}

/**
 * @param {string} string String.
 * @return {boolean|undefined} Boolean.
 */
export function readBooleanString(string) {
  const m = /^\s*(true|1)|(false|0)\s*$/.exec(string);
  if (m) {
    return m[1] !== undefined || false;
  }
  return undefined;
}

/**
 * @param {Node} node Node.
 * @return {number|undefined} DateTime in seconds.
 */
export function readDateTime(node) {
  const s = getAllTextContent(node, false);
  const dateTime = Date.parse(s);
  return isNaN(dateTime) ? undefined : dateTime / 1000;
}

/**
 * @param {Node} node Node.
 * @return {number|undefined} Decimal.
 */
export function readDecimal(node) {
  const s = getAllTextContent(node, false);
  return readDecimalString(s);
}

/**
 * @param {string} string String.
 * @return {number|undefined} Decimal.
 */
export function readDecimalString(string) {
  // FIXME check spec
  const m = /^\s*([+\-]?\d*\.?\d+(?:e[+\-]?\d+)?)\s*$/i.exec(string);
  if (m) {
    return parseFloat(m[1]);
  }
  return undefined;
}

/**
 * @param {Node} node Node.
 * @return {number|undefined} Non negative integer.
 */
export function readPositiveInteger(node) {
  const s = getAllTextContent(node, false);
  return readNonNegativeIntegerString(s);
}

/**
 * @param {string} string String.
 * @return {number|undefined} Non negative integer.
 */
export function readNonNegativeIntegerString(string) {
  const m = /^\s*(\d+)\s*$/.exec(string);
  if (m) {
    return parseInt(m[1], 10);
  }
  return undefined;
}

/**
 * @param {Node} node Node.
 * @return {string|undefined} String.
 */
export function readString(node) {
  return getAllTextContent(node, false).trim();
}

/**
 * @param {Node} node Node to append a TextNode with the boolean to.
 * @param {boolean} bool Boolean.
 */
export function writeBooleanTextNode(node, bool) {
  writeStringTextNode(node, bool ? '1' : '0');
}

/**
 * @param {Node} node Node to append a CDATA Section with the string to.
 * @param {string} string String.
 */
export function writeCDATASection(node, string) {
  node.appendChild(getDocument().createCDATASection(string));
}

/**
 * @param {Node} node Node to append a TextNode with the dateTime to.
 * @param {number} dateTime DateTime in seconds.
 */
export function writeDateTimeTextNode(node, dateTime) {
  const date = new Date(dateTime * 1000);
  const string =
    date.getUTCFullYear() +
    '-' +
    padNumber(date.getUTCMonth() + 1, 2) +
    '-' +
    padNumber(date.getUTCDate(), 2) +
    'T' +
    padNumber(date.getUTCHours(), 2) +
    ':' +
    padNumber(date.getUTCMinutes(), 2) +
    ':' +
    padNumber(date.getUTCSeconds(), 2) +
    'Z';
  node.appendChild(getDocument().createTextNode(string));
}

/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} decimal Decimal.
 */
export function writeDecimalTextNode(node, decimal) {
  const string = decimal.toPrecision();
  node.appendChild(getDocument().createTextNode(string));
}

/**
 * @param {Node} node Node to append a TextNode with the decimal to.
 * @param {number} nonNegativeInteger Non negative integer.
 */
export function writeNonNegativeIntegerTextNode(node, nonNegativeInteger) {
  const string = nonNegativeInteger.toString();
  node.appendChild(getDocument().createTextNode(string));
}

/**
 * @param {Node} node Node to append a TextNode with the string to.
 * @param {string} string String.
 */
export function writeStringTextNode(node, string) {
  node.appendChild(getDocument().createTextNode(string));
}
